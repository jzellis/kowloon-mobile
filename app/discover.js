// Discover — find people and explore popular public Circles.
// First stop after onboarding; also reachable from the menu.
// Shows a one-time welcome banner for users who just registered.

import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "../src/components/posts/Avatar.jsx";
import { CircleAvatar } from "../src/components/circles/CircleAvatar.jsx";
import { CircleHeartButton } from "../src/components/circles/CircleHeartButton.jsx";
import { Eyebrow, Heading } from "../src/components/ui/Heading.jsx";
import { useActiveClient } from "../src/lib/useActiveClient.js";
import { rootStorage } from "../src/lib/storage.js";

const BANNER_KEY = "kowloon_discover_welcomed";

function CircleCard({ circle, client, router }) {
  return (
    <Pressable
      className="flex-row items-start border-b border-base-300 py-4 gap-3"
      onPress={() => router.push(`/circle/${encodeURIComponent(circle.id)}`)}
      android_ripple={{ color: "rgba(0,0,0,0.05)" }}
    >
      <CircleAvatar circle={circle} size={44} baseUrl={circle.baseUrl} />
      <View className="flex-1 min-w-0">
        <Text
          className="font-ui text-base font-bold text-base-content"
          numberOfLines={1}
        >
          {circle.name}
        </Text>
        {circle.memberCount > 0 ? (
          <Text className="font-ui text-xs text-base-content/50 mb-1">
            {circle.memberCount} {circle.memberCount === 1 ? "member" : "members"}
          </Text>
        ) : null}
        {circle.summary ? (
          <Text
            className="font-ui text-sm text-base-content/70 leading-relaxed"
            numberOfLines={2}
          >
            {circle.summary}
          </Text>
        ) : null}
      </View>
      <CircleHeartButton circle={circle} client={client} />
    </Pressable>
  );
}

function UserRow({ user, router }) {
  const actor = {
    name: user.profile?.name || user.username,
    icon: user.profile?.icon,
  };
  return (
    <Pressable
      className="flex-row items-center py-3 border-b border-base-300 gap-3"
      onPress={() => router.push(`/user/${encodeURIComponent(user.id)}`)}
      android_ripple={{ color: "rgba(0,0,0,0.05)" }}
    >
      <Avatar actor={actor} size={36} baseUrl={user.baseUrl} />
      <View className="flex-1 min-w-0">
        <Text
          className="font-ui text-sm font-semibold text-base-content"
          numberOfLines={1}
        >
          {actor.name}
        </Text>
        <Text
          className="font-ui text-xs text-base-content/50"
          numberOfLines={1}
        >
          {user.id}
        </Text>
      </View>
    </Pressable>
  );
}

export default function Discover() {
  const client = useActiveClient();
  const router = useRouter();

  const [banner, setBanner] = useState(false);
  const [query, setQuery] = useState("");
  const [circles, setCircles] = useState([]);
  const [circlesLoading, setCirclesLoading] = useState(true);
  const [circlesError, setCirclesError] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    rootStorage.getItem(BANNER_KEY).then((val) => {
      if (val === "1") setBanner(true);
    });
  }, []);

  function dismissBanner() {
    setBanner(false);
    rootStorage.setItem(BANNER_KEY, "0");
  }

  useFocusEffect(
    useCallback(() => {
      if (!client) return;
      setCirclesLoading(true);
      setCirclesError(null);
      client.feeds
        .browseCircles({ sort: "reacts", limit: 20 })
        .then((res) => setCircles(res?.orderedItems ?? []))
        .catch((e) =>
          setCirclesError(e?.message || "Could not load circles.")
        )
        .finally(() => setCirclesLoading(false));
    }, [client])
  );

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setUsers([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      if (!client) return;
      setUsersLoading(true);
      try {
        const res = await client.search.searchUsers({ query: q, limit: 10 });
        setUsers(res?.orderedItems ?? res?.items ?? []);
      } catch {
        setUsers([]);
      }
      setUsersLoading(false);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, client]);

  const showUserResults = query.trim().length >= 2;

  return (
    <SafeAreaView
      className="flex-1 bg-base-100"
      edges={["top", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Welcome banner */}
        {banner ? (
          <View className="bg-secondary px-5 py-5 border-b-2 border-base-content">
            <Text className="font-display text-2xl text-secondary-content mb-1">
              Welcome to Kowloon.
            </Text>
            <Text className="font-ui text-sm text-secondary-content/80 leading-relaxed mb-3">
              Search for people to add to your circles, or heart a public circle
              below to show your support.
            </Text>
            <Pressable onPress={dismissBanner} hitSlop={12}>
              <Text className="font-ui text-xs uppercase tracking-widest text-secondary-content/60">
                Got it — dismiss
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View className="px-5 pt-6">
          <Eyebrow>Explore</Eyebrow>
          <Heading className="text-4xl mt-1 mb-5 leading-tight">
            Discover
          </Heading>

          {/* Search */}
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for people..."
            placeholderTextColor="rgba(26,26,32,0.35)"
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            className="border-2 border-base-300 bg-base-100 px-3 h-11 font-ui text-sm text-base-content mb-6"
          />

          {/* User results */}
          {showUserResults ? (
            <View className="mb-6">
              <Text className="font-ui text-[10px] uppercase tracking-widest text-base-content/40 mb-2">
                People
              </Text>
              {usersLoading ? (
                <ActivityIndicator className="py-4" />
              ) : users.length > 0 ? (
                users.map((u) => (
                  <UserRow key={u.id} user={u} router={router} />
                ))
              ) : (
                <Text className="font-ui text-sm text-base-content/40 py-3">
                  No people found for "{query.trim()}".
                </Text>
              )}
            </View>
          ) : null}

          {/* Popular circles */}
          {!showUserResults ? (
            <>
              <Text className="font-ui text-[10px] uppercase tracking-widest text-base-content/40 mb-2">
                Popular Circles
              </Text>
              {circlesLoading ? (
                <ActivityIndicator className="py-8" />
              ) : circlesError ? (
                <Text className="font-ui text-sm text-error py-4">
                  {circlesError}
                </Text>
              ) : circles.length === 0 ? (
                <Text className="font-ui text-sm text-base-content/40 py-4">
                  No public circles yet. Be the first to create one.
                </Text>
              ) : (
                circles.map((circle) => (
                  <CircleCard
                    key={circle.id}
                    circle={circle}
                    client={client}
                    router={router}
                  />
                ))
              )}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
