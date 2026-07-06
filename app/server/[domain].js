// Server profile — full cached profile for a remote Kowloon server.
// Pull-to-refresh forces a fresh fetch from the remote.

import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ExternalLink, Globe, MapPin, Users } from "lucide-react-native";

import { BackLink } from "../../src/components/ui/BackLink.jsx";
import { useActiveClient } from "../../src/lib/useActiveClient.js";
import { resolveImageUrl } from "../../src/lib/resolveImageUrl.js";

// ── Small helpers ─────────────────────────────────────────────────────────────

function stripHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function SectionHeading({ children }) {
  return (
    <Text className="font-ui text-[11px] uppercase tracking-[0.18em] text-base-content/50 mb-2 mt-6">
      {children}
    </Text>
  );
}

function StatPill({ label, value }) {
  if (value == null) return null;
  return (
    <View className="mr-5">
      <Text className="font-ui text-xl text-base-content leading-tight">
        {typeof value === "number" ? value.toLocaleString() : value}
      </Text>
      <Text className="font-ui text-[11px] uppercase tracking-[0.14em] text-base-content/50">
        {label}
      </Text>
    </View>
  );
}

// ── Cached item rows ──────────────────────────────────────────────────────────

function ItemAvatar({ item, baseUrl, size = 36 }) {
  const [failed, setFailed] = useState(false);
  const src = resolveImageUrl(item?.icon, baseUrl);
  if (src && !failed) {
    return (
      <Image
        source={{ uri: src }}
        style={{ width: size, height: size }}
        className="border-2 border-base-300 bg-base-200"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View
      style={{ width: size, height: size }}
      className="border-2 border-base-300 bg-secondary items-center justify-center"
    >
      <Users size={size * 0.45} color="rgba(255,244,224,0.7)" strokeWidth={1.75} />
    </View>
  );
}

function CachedRow({ item, baseUrl }) {
  return (
    <View className="flex-row items-center py-3 border-t border-base-300">
      <ItemAvatar item={item} baseUrl={baseUrl} />
      <View className="flex-1 ml-3 min-w-0">
        <Text
          className="font-ui text-base text-base-content leading-tight"
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {typeof item.memberCount === "number" ? (
          <Text className="font-ui text-[11px] uppercase tracking-[0.14em] text-base-content/50 mt-0.5">
            {item.memberCount.toLocaleString()} members
          </Text>
        ) : null}
        {item.summary ? (
          <Text
            className="font-ui text-xs text-base-content/70 leading-snug mt-1"
            numberOfLines={2}
          >
            {stripHtml(item.summary)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function PageRow({ page }) {
  return (
    <Pressable
      onPress={() => Linking.openURL(page.url)}
      android_ripple={{ color: "rgba(0,0,0,0.05)" }}
      className="flex-row items-center justify-between py-3 border-t border-base-300"
    >
      <Text className="font-ui text-base text-base-content flex-1 mr-3" numberOfLines={1}>
        {page.title}
      </Text>
      <ExternalLink size={14} color="rgba(26,26,32,0.4)" strokeWidth={1.75} />
    </Pressable>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ServerProfile() {
  const { domain: rawDomain } = useLocalSearchParams();
  const domain = decodeURIComponent(rawDomain || "");
  const client = useActiveClient();
  const baseUrl = client?.http?.baseUrl;

  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [heroFailed, setHeroFailed] = useState(false);

  const load = useCallback(
    async ({ isRefresh = false } = {}) => {
      if (!client || !domain) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await client.feeds.getServer({ domain, refresh: isRefresh });
        setServer(res);
      } catch (e) {
        setError(e?.message || "Couldn't load server profile.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [client, domain]
  );

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading && !server) {
    return (
      <SafeAreaView className="flex-1 bg-base-100 items-center justify-center" edges={["top"]}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (error && !server) {
    return (
      <SafeAreaView className="flex-1 bg-base-100" edges={["top", "left", "right"]}>
        <View className="px-5 pt-3 pb-4 border-b-2 border-base-content">
          <BackLink />
          <Text className="font-ui text-3xl text-base-content mt-2">{domain}</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="font-ui text-base text-error text-center mb-4">{error}</Text>
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
      </SafeAreaView>
    );
  }

  const heroSrc = resolveImageUrl(server?.image, baseUrl);
  const iconSrc = resolveImageUrl(server?.icon, baseUrl);
  const hasHero = heroSrc && !heroFailed;
  const circles = server?.cachedCircles || [];
  const groups  = server?.cachedGroups  || [];
  const pages   = server?.cachedPages   || [];

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["top", "left", "right"]}>
      {/* Fixed back bar */}
      <View className="px-5 pt-3 pb-3 border-b-2 border-base-content">
        <BackLink />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load({ isRefresh: true })}
          />
        }
      >
        {/* Hero */}
        {hasHero ? (
          <Image
            source={{ uri: heroSrc }}
            className="w-full bg-base-200"
            style={{ aspectRatio: 16 / 9 }}
            resizeMode="cover"
            onError={() => setHeroFailed(true)}
          />
        ) : (
          <View
            className="w-full bg-secondary items-center justify-center"
            style={{ aspectRatio: 16 / 9 }}
          >
            {iconSrc ? (
              <Image
                source={{ uri: iconSrc }}
                style={{ width: 72, height: 72 }}
                className="border-2 border-secondary-content/30"
                resizeMode="contain"
              />
            ) : (
              <Globe size={48} color="rgba(255,244,224,0.5)" strokeWidth={1.5} />
            )}
          </View>
        )}

        <View className="px-5 pb-10">
          {/* Name + domain */}
          <View className="mt-4 mb-1">
            <Text className="font-ui text-3xl text-base-content leading-tight">
              {server?.name || domain}
            </Text>
            <Text className="font-ui text-[11px] uppercase tracking-[0.16em] text-base-content/50 mt-1">
              {domain}
            </Text>
          </View>

          {/* Stale warning */}
          {server?.stale ? (
            <Text className="font-ui text-xs text-warning mt-1">
              Showing cached data — server unreachable
            </Text>
          ) : null}

          {/* Description */}
          {server?.description ? (
            <Text className="font-ui text-sm text-base-content/80 leading-relaxed mt-3">
              {stripHtml(server.description)}
            </Text>
          ) : null}

          {/* Location */}
          {server?.location?.name ? (
            <View className="flex-row items-center mt-3">
              <MapPin size={13} color="rgba(26,26,32,0.5)" strokeWidth={1.75} />
              <Text className="font-ui text-xs uppercase tracking-[0.14em] text-base-content/50 ml-1.5">
                {server.location.name}
              </Text>
            </View>
          ) : null}

          {/* Stats */}
          <View className="flex-row mt-4">
            <StatPill label="Users" value={server?.userCount} />
            <StatPill label="Posts" value={server?.postCount} />
            {server?.openRegistrations != null ? (
              <StatPill
                label="Registration"
                value={server.openRegistrations ? "Open" : "Closed"}
              />
            ) : null}
          </View>

          {/* Circles */}
          {circles.length > 0 ? (
            <>
              <SectionHeading>Circles</SectionHeading>
              {circles.slice(0, 5).map((c) => (
                <CachedRow key={c.id} item={c} baseUrl={baseUrl} />
              ))}
              {circles.length > 5 ? (
                <Text className="font-ui text-[11px] uppercase tracking-[0.16em] text-base-content/40 mt-2">
                  +{circles.length - 5} more
                </Text>
              ) : null}
            </>
          ) : null}

          {/* Groups */}
          {groups.length > 0 ? (
            <>
              <SectionHeading>Groups</SectionHeading>
              {groups.slice(0, 5).map((g) => (
                <CachedRow key={g.id} item={g} baseUrl={baseUrl} />
              ))}
              {groups.length > 5 ? (
                <Text className="font-ui text-[11px] uppercase tracking-[0.16em] text-base-content/40 mt-2">
                  +{groups.length - 5} more
                </Text>
              ) : null}
            </>
          ) : null}

          {/* Pages */}
          {pages.length > 0 ? (
            <>
              <SectionHeading>Pages</SectionHeading>
              {pages.map((p, i) => (
                <PageRow key={p.url || i} page={p} />
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
