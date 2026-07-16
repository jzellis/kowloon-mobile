// Servers — browse remote Kowloon servers known to this server.
// Starting point: eventually the list folds into the Discover screen.

import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Globe } from "lucide-react-native";

import { AppHeader } from "../src/components/nav/AppHeader.jsx";
import { useActiveClient } from "../src/lib/useActiveClient.js";
import { resolveImageUrl } from "../src/lib/resolveImageUrl.js";

function ServerAvatar({ server, baseUrl }) {
  const [failed, setFailed] = useState(false);
  const src = resolveImageUrl(server?.icon, baseUrl);
  if (src && !failed) {
    return (
      <Image
        source={{ uri: src }}
        style={{ width: 44, height: 44 }}
        className="  bg-base-200"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View
      style={{ width: 44, height: 44 }}
      className="  bg-secondary items-center justify-center"
    >
      <Globe size={20} color="rgba(255,244,224,0.7)" strokeWidth={1.75} />
    </View>
  );
}

function ServerRow({ server, baseUrl, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "rgba(0,0,0,0.05)" }}
      className="flex-row items-center px-5 py-4   bg-base-100"
    >
      <ServerAvatar server={server} baseUrl={baseUrl} />
      <View className="flex-1 ml-3 min-w-0">
        <Text
          className="font-ui text-lg text-base-content leading-tight"
          numberOfLines={1}
        >
          {server.name || server.domain}
        </Text>
        <Text className="font-ui text-[11px] uppercase tracking-[0.14em] text-base-content/50 mt-0.5">
          {server.domain}
          {typeof server.userCount === "number"
            ? `  ·  ${server.userCount.toLocaleString()} users`
            : ""}
        </Text>
        {server.description ? (
          <Text
            className="font-ui text-xs text-base-content/70 leading-snug mt-1"
            numberOfLines={2}
          >
            {server.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function Servers() {
  const router = useRouter();
  const client = useActiveClient();
  const baseUrl = client?.http?.baseUrl;

  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async ({ isRefresh = false } = {}) => {
      if (!client) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await client.feeds.getServers({ limit: 50, sort: "name" });
        setServers(res?.orderedItems || res?.items || []);
      } catch (e) {
        setError(e?.message || "Couldn't load servers.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [client]
  );

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["left", "right"]}>
      <AppHeader back title="Other Servers" />

      <FlatList
        data={servers}
        keyExtractor={(s) => s.domain}
        renderItem={({ item }) => (
          <ServerRow
            server={item}
            baseUrl={baseUrl}
            onPress={() =>
              router.push(`/server/${encodeURIComponent(item.domain)}`)
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
                className="  px-5 py-2.5"
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
                No other servers discovered yet.
              </Text>
              <Text className="font-ui text-sm text-base-content/45 text-center leading-6 mt-2">
                Add a server to one of your Circles to start discovering.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
