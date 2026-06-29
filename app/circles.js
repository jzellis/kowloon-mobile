// Circles — the user's own circles (Kowloon's social-graph primitive).
//
// Lists circles owned by the active account. Tap a circle to view/manage it;
// the header "+ New" creates one. Circles are how Kowloon replaces
// follow/unfollow — curated lists of people whose posts you read.

import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
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
import { Plus } from "lucide-react-native";

import { BackLink } from "../src/components/ui/BackLink.jsx";
import { CircleCard } from "../src/components/circles/CircleCard.jsx";
import { useActiveClient } from "../src/lib/useActiveClient.js";
import { selectActiveAccount } from "../src/state/accountsSlice.js";

export default function Circles() {
  const router = useRouter();
  const client = useActiveClient();
  const account = useSelector(selectActiveAccount);

  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async ({ isRefresh = false } = {}) => {
      if (!client || !account?.id) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await client.feeds.getUserCircles({ userId: account.id });
        const items = res?.orderedItems || res?.items || [];
        // Hide system circles (Following, Groups, Blocked, Muted, etc.) — those
        // are managed implicitly, not curated by hand.
        setCircles(items.filter((c) => c?.type !== "System"));
      } catch (e) {
        setError(e?.message || "Couldn't load your circles.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [client, account?.id]
  );

  // Refresh on focus so a newly created/edited/deleted circle shows up.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["top", "left", "right"]}>
      {/* Masthead */}
      <View className="px-5 pt-3 pb-3 border-b-2 border-base-content">
        <BackLink />
        <View className="flex-row items-end justify-between mt-2">
          <Text className="font-ui text-3xl text-base-content">Circles</Text>
          <Pressable
            onPress={() => router.push("/circle/new")}
            hitSlop={8}
            android_ripple={{ color: "rgba(0,0,0,0.06)" }}
            className="flex-row items-center border-2 border-base-content px-3 py-1.5"
          >
            <Plus size={14} color="rgba(26,26,32,0.85)" strokeWidth={2} />
            <Text className="font-ui uppercase tracking-[0.16em] text-[11px] text-base-content ml-1.5">
              New
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={circles}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <CircleCard
            circle={item}
            serverDomain={account?.server}
            baseUrl={account?.baseUrl}
            onPress={() =>
              router.push(`/circle/${encodeURIComponent(item.id)}`)
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load({ isRefresh: true })}
          />
        }
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
                onPress={() => load()}
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
              <Text className="font-ui text-lg text-base-content/70 text-center mb-2">
                No circles yet.
              </Text>
              <Text className="font-ui text-sm text-base-content/55 text-center leading-6">
                Circles are curated lists of people whose posts you want to
                read. Create one to get started.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
