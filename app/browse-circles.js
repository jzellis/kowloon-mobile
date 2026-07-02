// Browse Circles — server-wide discovery of public/server circles.
// Like Spotify's Browse page: curated, sorted by popularity or recency.
// Distinct from /circles which shows the viewer's own circles.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
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

import { BackLink } from "../src/components/ui/BackLink.jsx";
import { CircleCard } from "../src/components/circles/CircleCard.jsx";
import { useActiveClient } from "../src/lib/useActiveClient.js";
import { selectActiveAccount } from "../src/state/accountsSlice.js";

const PAGE_SIZE = 20;

export default function BrowseCircles() {
  const router = useRouter();
  const client = useActiveClient();
  const account = useSelector(selectActiveAccount);

  const [circles, setCircles] = useState([]);
  const [sort, setSort] = useState("reacts");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Track in-flight fetches so sort/refresh changes cancel stale loads
  const fetchId = useRef(0);
  // Prevent onEndReached firing multiple times before the first load-more settles
  const loadingMoreRef = useRef(false);

  const load = useCallback(
    async ({ pageNum = 1, currentSort = sort, isRefresh = false } = {}) => {
      if (!client) return;
      const id = ++fetchId.current;

      if (pageNum === 1) {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        loadingMoreRef.current = false;
      } else {
        setLoadingMore(true);
        loadingMoreRef.current = true;
      }
      setError(null);

      try {
        const res = await client.feeds.browseCircles({
          sort: currentSort,
          page: pageNum,
          limit: PAGE_SIZE,
        });
        if (id !== fetchId.current) return; // stale — a newer fetch is running

        const items = res?.orderedItems || res?.items || [];
        const total = res?.totalItems ?? items.length;
        const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

        setTotalPages(pages);
        setPage(pageNum);
        setCircles((prev) => {
          if (pageNum === 1) return items;
          const seen = new Set(prev.map((c) => c.id));
          return [...prev, ...items.filter((c) => !seen.has(c.id))];
        });
      } catch (e) {
        if (id !== fetchId.current) return;
        setError(e?.message || "Couldn't load circles.");
      } finally {
        if (id !== fetchId.current) return;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    },
    [client, sort]
  );

  // Initial load
  useEffect(() => {
    load({ pageNum: 1, currentSort: sort });
  }, [sort]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSortChange(newSort) {
    if (newSort === sort) return;
    setSort(newSort);
    setCircles([]);
    setPage(1);
    // load() fires via the useEffect above
  }

  function handleRefresh() {
    load({ pageNum: 1, currentSort: sort, isRefresh: true });
  }

  function handleLoadMore() {
    if (loadingMoreRef.current || loadingMore || page >= totalPages) return;
    load({ pageNum: page + 1, currentSort: sort });
  }

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["top", "left", "right"]}>
      {/* Masthead */}
      <View className="px-5 pt-3 pb-4 border-b-2 border-base-content">
        <BackLink />
        <View className="flex-row items-end justify-between mt-2">
          <Text className="font-ui text-3xl text-base-content leading-tight">
            Discover Circles
          </Text>
          {/* Sort toggle */}
          <View className="flex-row items-center border-2 border-base-300">
            <Pressable
              onPress={() => handleSortChange("reacts")}
              android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              className={`px-3 py-1.5 ${sort === "reacts" ? "bg-base-content" : "bg-transparent"}`}
            >
              <Text
                className={`font-ui text-[11px] uppercase tracking-[0.16em] ${
                  sort === "reacts" ? "text-base-100" : "text-base-content/55"
                }`}
              >
                Popular
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleSortChange("date")}
              android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              className={`px-3 py-1.5 border-l-2 border-base-300 ${sort === "date" ? "bg-base-content" : "bg-transparent"}`}
            >
              <Text
                className={`font-ui text-[11px] uppercase tracking-[0.16em] ${
                  sort === "date" ? "text-base-100" : "text-base-content/55"
                }`}
              >
                Newest
              </Text>
            </Pressable>
          </View>
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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
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
                onPress={() => load({ pageNum: 1, currentSort: sort })}
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
                No circles to discover yet.
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
    </SafeAreaView>
  );
}
