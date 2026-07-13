// Home feed — the active account's post timeline.
//
// Posts load page by page via useFeed (GET /posts through @kowloon/client).
// Cards show previews only; tapping a card opens the post detail screen.

import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { PostCard } from "../src/components/posts/PostCard.jsx";
import { Avatar } from "../src/components/posts/Avatar.jsx";
import { FeedHeader } from "../src/components/posts/FeedHeader.jsx";
import { UserMenu } from "../src/components/UserMenu.jsx";
import { LeftDrawer } from "../src/components/drawer/LeftDrawer.jsx";
import { BottomTabBar } from "../src/components/nav/BottomTabBar.jsx";
import { Globe } from "lucide-react-native";
import { useFeed } from "../src/lib/useFeed.js";
import { useActiveClient } from "../src/lib/useActiveClient.js";
import { useUnreadCount } from "../src/lib/UnreadCountContext.js";
import { usePersistedFilter } from "../src/lib/usePersistedFilter.js";
import { resolveImageUrl } from "../src/lib/resolveImageUrl.js";
import {
  selectActiveAccount,
  updateAccountAndPersist,
} from "../src/state/accountsSlice.js";

export default function Feed() {
  const router = useRouter();
  const dispatch = useDispatch();
  const account = useSelector(selectActiveAccount);
  const client = useActiveClient();
  const { count: unreadCount } = useUnreadCount();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [serverIcon, setServerIcon] = useState(null);
  // Override the persisted view once when arriving via /feed?view=<key>
  // (e.g. tapping "View posts" on a circle or group detail screen).
  const viewOverrideRef = useRef(null);

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

  // Server icon for the masthead drawer toggle.
  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    client.feeds
      .getServerInfo()
      .then((info) => {
        if (cancelled || !info?.icon) return;
        setServerIcon(resolveImageUrl(info.icon, client?.http?.baseUrl));
      })
      .catch(() => {});
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

  // Persisted filter state — viewKey (public/server/circleId/groupId) +
  // activeTypes. Falls back to the user's saved server-side defaults on first
  // hydration.
  const { viewKey, setViewKey, activeTypes, setActiveTypes } =
    usePersistedFilter(account?.id, fallbackDefaults);

  // If we arrived via `?view=...`, apply it once (then leave the persisted
  // viewKey alone so subsequent normal navigations don't re-fire this).
  useEffect(() => {
    const requested = typeof params.view === "string" ? params.view : null;
    if (!requested) return;
    if (viewOverrideRef.current === requested) return;
    viewOverrideRef.current = requested;
    if (requested !== viewKey) setViewKey(requested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.view]);

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

  function handleSetTypes(types) {
    setActiveTypes(types);
    scheduleSync(viewKey, types);
  }

  const {
    posts,
    loading,
    loadingMore,
    refreshing,
    error,
    refresh,
    loadMore,
    removePost,
  } = useFeed({ viewKey, activeTypes, accountId: account?.id });

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
  // router is a stable API object, not reactive state — including it causes
  // this effect to re-fire every render and rapid-navigate on iOS dev client.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  if (!account) return null;

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["top"]}>
      {/* Masthead */}
      <View className="px-5 pt-2 pb-3 border-b-2 border-base-content flex-row items-center">
        <Pressable
          onPress={() => setDrawerOpen(true)}
          hitSlop={8}
          android_ripple={{ color: "rgba(0,0,0,0.06)" }}
          className="flex-row items-center flex-1 min-w-0 mr-3"
        >
          <View className="w-6 h-6 bg-secondary items-center justify-center overflow-hidden mr-2.5">
            {serverIcon ? (
              <Image
                source={{ uri: serverIcon }}
                style={{ width: 24, height: 24 }}
                resizeMode="cover"
              />
            ) : (
              <Globe
                size={15}
                color="rgba(255,244,224,0.85)"
                strokeWidth={1.75}
              />
            )}
          </View>
          <Text
            className="font-ui text-xl tracking-tight text-base-content flex-1"
            numberOfLines={1}
          >
            {account.serverName || account.server}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMenuOpen(true)}
          hitSlop={8}
          android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
        >
          <View className="relative">
            <Avatar
              actor={{
                name: account.profile?.name || account.username,
                icon: account.profile?.icon || null,
                id: account.id,
              }}
              size={38}
              baseUrl={account.baseUrl}
            />
            {unreadCount > 0 ? (
              <View className="absolute -top-1 -right-1 bg-primary border-2 border-base-100 min-w-[20px] h-5 items-center justify-center px-1">
                <Text className="font-ui text-[10px] font-bold text-primary-content">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </View>

      <LeftDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <UserMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Filter header — view picker (Public / Server / Circle) + type filter */}
      <FeedHeader
        viewKey={viewKey}
        onViewChange={handleViewChange}
        activeTypes={activeTypes}
        onSetTypes={handleSetTypes}
      />

      <FlatList
        className="flex-1"
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PostCard post={item} onDeleted={() => removePost(item.id)} />
        )}
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
              <Text className="font-ui text-base text-error text-center mb-4">
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
              <Text className="font-ui text-base text-base-content/60 text-center">
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

      <BottomTabBar active="feed" />

      {/* Compose — square editorial FAB, floated above the bottom tab bar.
          Absolute children of SafeAreaView are positioned relative to the
          physical screen edge, so we clear the tab bar height + nav-bar inset. */}
      <Pressable
        onPress={() => router.push("/compose")}
        style={{ bottom: (insets.bottom || 0) + 78, right: 20 }}
        className="absolute w-14 h-14 bg-primary border-2 border-base-content items-center justify-center"
        android_ripple={{ color: "rgba(255,255,255,0.15)" }}
      >
        <Text className="text-primary-content text-3xl leading-none mt-[-2px]">
          +
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
