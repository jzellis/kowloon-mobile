// User profile — read-only view of a user. Header (avatar, name, handle,
// bio, location) plus three tabs (Posts | Circles | Bookmarks). The server
// gates Circles and Bookmarks to the profile owner — non-owners just see
// empty tabs there, which we render with a discreet "private" empty state.

import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin } from "lucide-react-native";

import { Avatar } from "../../../src/components/posts/Avatar.jsx";
import { BackLink } from "../../../src/components/ui/BackLink.jsx";
import { BookmarkCard } from "../../../src/components/bookmarks/BookmarkCard.jsx";
import { Button } from "../../../src/components/ui/Button.jsx";
import { CircleCard } from "../../../src/components/circles/CircleCard.jsx";
import { HtmlContent } from "../../../src/components/HtmlContent.jsx";
import { PostCard } from "../../../src/components/posts/PostCard.jsx";
import { useActiveClient } from "../../../src/lib/useActiveClient.js";
import { selectActiveAccount } from "../../../src/state/accountsSlice.js";

const TABS = [
  { key: "posts", label: "Posts" },
  { key: "circles", label: "Circles" },
  { key: "bookmarks", label: "Bookmarks" },
];

function TabButton({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "rgba(0,0,0,0.05)" }}
      className={`flex-1 py-3 items-center ${
        active ? "border-b-2 border-primary -mb-[2px]" : ""
      }`}
    >
      <Text
        className={`font-ui uppercase tracking-[0.16em] text-[11px] ${
          active ? "text-base-content" : "text-base-content/50"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function UserProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const client = useActiveClient();
  const account = useSelector(selectActiveAccount);

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [circles, setCircles] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState("posts");

  const userId = String(id || "");
  const isSelf = !!account?.id && account.id === userId;

  const load = useCallback(
    async ({ isRefresh = false } = {}) => {
      if (!client || !userId) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [userRes, postsRes, circlesRes, bookmarksRes] = await Promise.all([
          client.feeds.getUser({ userId }),
          client.feeds.getUserPosts({ userId }).catch(() => null),
          client.feeds.getUserCircles({ userId }).catch(() => null),
          client.feeds
            .getUserBookmarks({ userId, type: "Bookmark" })
            .catch(() => null),
        ]);
        setUser(userRes?.item || userRes?.user || userRes || null);
        setPosts(postsRes?.orderedItems || postsRes?.items || []);
        setCircles(
          (circlesRes?.orderedItems || circlesRes?.items || []).filter(
            (c) => c?.type !== "System"
          )
        );
        setBookmarks(bookmarksRes?.orderedItems || bookmarksRes?.items || []);
      } catch (e) {
        setError(e?.message || "Couldn't load this profile.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [client, userId]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const name = user?.profile?.name || user?.name || user?.username || userId;
  const description = user?.profile?.description;
  const location = user?.profile?.location;
  const me = {
    name,
    icon: user?.profile?.icon || user?.icon,
    id: userId,
  };

  function header() {
    return (
      <View>
        <View className="px-5 pt-3 pb-2">
          <BackLink />
        </View>
        <View className="px-5 pt-2 pb-5 border-b-2 border-base-300">
          <View className="flex-row items-start">
            <Avatar actor={me} size={72} baseUrl={account?.baseUrl} />
            <View className="flex-1 ml-4 min-w-0">
              <Text
                className="font-reading text-2xl text-base-content leading-tight"
                numberOfLines={1}
              >
                {name}
              </Text>
              <Text
                className="font-ui text-xs text-base-content/55 mt-0.5"
                numberOfLines={1}
              >
                {userId}
              </Text>
              {location?.name ? (
                <View className="flex-row items-center mt-2">
                  <MapPin
                    size={11}
                    color="rgba(26,26,32,0.55)"
                    strokeWidth={1.75}
                  />
                  <Text
                    className="font-ui text-[11px] uppercase tracking-[0.14em] text-base-content/55 ml-1.5 flex-1"
                    numberOfLines={1}
                  >
                    {location.name}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {description ? (
            <View className="mt-4">
              <HtmlContent html={description} fontSize={15} />
            </View>
          ) : null}
        </View>

        {/* Tabs */}
        <View className="flex-row border-b-2 border-base-300">
          {TABS.map((t) => (
            <TabButton
              key={t.key}
              label={t.label}
              active={tab === t.key}
              onPress={() => setTab(t.key)}
            />
          ))}
        </View>
      </View>
    );
  }

  // Pick the data + renderer + key for the active tab.
  const view = (() => {
    if (tab === "posts") {
      return {
        data: posts,
        keyExtractor: (p) => p.id,
        renderItem: ({ item }) => <PostCard post={item} />,
        emptyTitle: "No posts yet.",
        emptyBody: isSelf
          ? "Anything you post lands here."
          : "When this person posts something, you'll see it here.",
      };
    }
    if (tab === "circles") {
      return {
        data: circles,
        keyExtractor: (c) => c.id,
        renderItem: ({ item }) => (
          <CircleCard
            circle={item}
            serverDomain={account?.server}
            baseUrl={account?.baseUrl}
            onPress={() =>
              router.push(`/circle/${encodeURIComponent(item.id)}`)
            }
          />
        ),
        emptyTitle: isSelf ? "No circles yet." : "Private.",
        emptyBody: isSelf
          ? "Circles you create show up here."
          : "Someone's circles are visible only to themselves.",
      };
    }
    return {
      data: bookmarks,
      keyExtractor: (b) => b.id,
      renderItem: ({ item }) => (
        <BookmarkCard bookmark={item} baseUrl={account?.baseUrl} />
      ),
      emptyTitle: isSelf ? "No bookmarks yet." : "Private.",
      emptyBody: isSelf
        ? "Save a link from a post and it lands here."
        : "Someone's bookmarks are visible only to themselves.",
    };
  })();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-base-100" edges={["top", "left", "right"]}>
        {header()}
        <View className="py-20 items-center">
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-base-100" edges={["top", "left", "right"]}>
        {header()}
        <View className="py-20 items-center px-6">
          <Text className="font-reading text-base text-error text-center mb-4">
            {error}
          </Text>
          <Button label="Back" variant="ghost" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["top", "left", "right"]}>
      <FlatList
        data={view.data}
        keyExtractor={view.keyExtractor}
        renderItem={view.renderItem}
        ListHeaderComponent={header()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load({ isRefresh: true })}
          />
        }
        ListEmptyComponent={
          <View className="px-6 py-16 items-center">
            <Text className="font-reading text-lg text-base-content/70 text-center mb-2">
              {view.emptyTitle}
            </Text>
            <Text className="font-reading text-sm text-base-content/55 text-center leading-6">
              {view.emptyBody}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
