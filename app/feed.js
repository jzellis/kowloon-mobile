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

  // Persisted filter state — viewKey (public/server/circleId) + activeTypes.
  const { viewKey, setViewKey, activeTypes, toggleType, clearTypes } =
    usePersistedFilter(account?.id);

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

  if (!account) {
    router.replace("/welcome");
    return null;
  }

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
        onViewChange={setViewKey}
        activeTypes={activeTypes}
        onToggleType={toggleType}
        onClearTypes={clearTypes}
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
