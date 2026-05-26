// Home feed — the active account's post timeline.
//
// Posts load page by page via useFeed (GET /posts through @kowloon/client).
// Cards show previews only; tapping a card opens the post detail screen.

import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PostCard } from "../src/components/posts/PostCard.jsx";
import { Avatar } from "../src/components/posts/Avatar.jsx";
import { FeedHeader } from "../src/components/posts/FeedHeader.jsx";
import { UserMenu } from "../src/components/UserMenu.jsx";
import { useFeed } from "../src/lib/useFeed.js";
import { useActiveClient } from "../src/lib/useActiveClient.js";
import { usePersistedFilter } from "../src/lib/usePersistedFilter.js";
import {
  selectActiveAccount,
  updateAccountAndPersist,
} from "../src/state/accountsSlice.js";

export default function Feed() {
  const router = useRouter();
  const dispatch = useDispatch();
  const account = useSelector(selectActiveAccount);
  const client = useActiveClient();
  const [menuOpen, setMenuOpen] = useState(false);

  // User's server-side filter defaults — used as the fallback for
  // usePersistedFilter on a fresh device (where AsyncStorage is empty for
  // this account). Loaded once when the client is ready.
  const [prefs, setPrefs] = useState(null);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    (async () => {
      let user = client.auth?.getUser?.();
      if (!user) {
        try {
          user = await client.init();
        } catch {
          user = null;
        }
      }
      if (!cancelled) setPrefs(user?.prefs || {});
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  const fallbackDefaults = prefs
    ? {
        viewKey: prefs.defaultFeedView || "",
        activeTypes: Array.isArray(prefs.defaultPostView)
          ? prefs.defaultPostView
          : [],
      }
    : undefined;

  // Persisted filter state — viewKey (public/server/circleId) + activeTypes.
  // Falls back to the user's saved server-side defaults on first hydration.
  const { viewKey, setViewKey, activeTypes, setActiveTypes } =
    usePersistedFilter(account?.id, fallbackDefaults);

  // Auto-sync: every user-driven filter change writes to user.prefs (debounced).
  // The pending value is held in a ref so a quick succession of taps coalesces
  // into a single write.
  const syncTimer = useRef(null);
  const pendingSync = useRef(null);

  function scheduleSync(nextViewKey, nextActiveTypes) {
    if (!client) return;
    pendingSync.current = { viewKey: nextViewKey, activeTypes: nextActiveTypes };
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      syncTimer.current = null;
      const payload = pendingSync.current;
      pendingSync.current = null;
      if (!payload || !client) return;
      client.activities
        ?.updateProfile({
          updates: {
            prefs: {
              defaultFeedView: payload.viewKey,
              defaultPostView: payload.activeTypes,
            },
          },
        })
        .catch(() => {
          // Non-fatal: local state still applies; a later change reconciles.
        });
    }, 500);
  }

  useEffect(() => {
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, []);

  // Wrapped setters that update local state and schedule the prefs sync.
  function handleViewChange(v) {
    setViewKey(v);
    scheduleSync(v, activeTypes);
  }

  function handleToggleType(type) {
    const next = activeTypes.includes(type)
      ? activeTypes.filter((t) => t !== type)
      : [...activeTypes, type];
    setActiveTypes(next);
    scheduleSync(viewKey, next);
  }

  function handleClearTypes() {
    setActiveTypes([]);
    scheduleSync(viewKey, []);
  }

  const {
    posts,
    loading,
    loadingMore,
    refreshing,
    error,
    refresh,
    loadMore,
  } = useFeed({ viewKey, activeTypes });

  // Backfill the server's display name onto the account the first time we
  // have a client for it. Accounts created before this field existed (and
  // any new login) get it filled in here, cached so later mounts skip it.
  useEffect(() => {
    if (!account || account.serverName || !client) return;
    let cancelled = false;
    client.feeds
      .getServerInfo()
      .then((info) => {
        if (!cancelled && info?.name) {
          dispatch(updateAccountAndPersist(account.id, { serverName: info.name }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [account?.id, account?.serverName, client, dispatch]);

  // Refresh when the feed regains focus — after composing a post, returning
  // from a detail view, etc. Skip the very first focus: useFeed already loads
  // on mount, so refreshing there would double-fetch.
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refresh();
    }, [refresh])
  );

  // Belt-and-suspenders — the / redirect handles the no-account case. Run as
  // an effect so we don't trip React's "setState during render" warning by
  // calling router.replace synchronously in the render path.
  useEffect(() => {
    if (!account) router.replace("/welcome");
  }, [account, router]);

  if (!account) return null;

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["top"]}>
      {/* Masthead */}
      <View className="px-5 pt-2 pb-3 border-b-2 border-base-content flex-row items-center justify-between">
        <Text
          className="font-reading text-3xl text-base-content flex-1 mr-3"
          numberOfLines={1}
        >
          {account.serverName || account.server}
        </Text>
        <Pressable
          onPress={() => setMenuOpen(true)}
          hitSlop={8}
          android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
        >
          <Avatar
            actor={{
              name: account.profile?.name || account.username,
              icon: account.profile?.icon || null,
              id: account.id,
            }}
            size={38}
            baseUrl={account.baseUrl}
          />
        </Pressable>
      </View>

      <UserMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Filter header — view picker (Public / Server / Circle) + type filter */}
      <FeedHeader
        viewKey={viewKey}
        onViewChange={handleViewChange}
        activeTypes={activeTypes}
        onToggleType={handleToggleType}
        onClearTypes={handleClearTypes}
      />

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        ListEmptyComponent={
          loading ? (
            <View className="py-20 items-center">
              <ActivityIndicator />
            </View>
          ) : error ? (
            <View className="px-6 py-20 items-center">
              <Text className="font-reading text-base text-error text-center mb-4">
                {error}
              </Text>
              <Pressable
                onPress={refresh}
                className="border-2 border-base-content px-5 py-2.5"
                android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              >
                <Text className="font-ui uppercase tracking-[0.16em] text-xs text-base-content">
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="px-6 py-20 items-center">
              <Text className="font-reading text-base text-base-content/60 text-center">
                No posts in your feed yet. Pull to refresh.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="py-6 items-center">
              <ActivityIndicator />
            </View>
          ) : null
        }
      />

      {/* Compose — square editorial FAB */}
      <Pressable
        onPress={() => router.push("/compose")}
        className="absolute bottom-8 right-5 w-14 h-14 bg-primary border-2 border-base-content items-center justify-center"
        android_ripple={{ color: "rgba(255,255,255,0.15)" }}
      >
        <Text className="text-primary-content text-3xl leading-none mt-[-2px]">
          +
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
