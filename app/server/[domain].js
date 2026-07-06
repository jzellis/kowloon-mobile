import { useCallback, useEffect, useState } from "react";
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
import { PostCard } from "../../src/components/posts/PostCard.jsx";
import { useActiveClient } from "../../src/lib/useActiveClient.js";
import { resolveImageUrl } from "../../src/lib/resolveImageUrl.js";

const TABS = [
  { key: "posts",   label: "Posts"   },
  { key: "circles", label: "Circles" },
  { key: "groups",  label: "Groups"  },
  { key: "pages",   label: "Pages"   },
];

const POSTS_PER_PAGE = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Sub-components ────────────────────────────────────────────────────────────

function TabBar({ tab, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12 }}
      className="border-b-2 border-base-content"
    >
      {TABS.map((t) => (
        <Pressable
          key={t.key}
          onPress={() => onSelect(t.key)}
          android_ripple={{ color: "rgba(0,0,0,0.05)" }}
          className={`px-4 py-3 ${tab === t.key ? "border-b-2 border-primary -mb-[2px]" : ""}`}
        >
          <Text
            className={`font-ui uppercase tracking-[0.16em] text-[11px] ${
              tab === t.key ? "text-base-content" : "text-base-content/50"
            }`}
          >
            {t.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function SectionHeading({ children }) {
  return (
    <Text className="font-ui text-[11px] uppercase tracking-[0.18em] text-base-content/50 mb-2 mt-6 px-5">
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
    <View className="flex-row items-center py-3 px-5 border-t border-base-300">
      <ItemAvatar item={item} baseUrl={baseUrl} />
      <View className="flex-1 ml-3 min-w-0">
        <Text className="font-ui text-base text-base-content leading-tight" numberOfLines={1}>
          {item.name}
        </Text>
        {typeof item.memberCount === "number" ? (
          <Text className="font-ui text-[11px] uppercase tracking-[0.14em] text-base-content/50 mt-0.5">
            {item.memberCount.toLocaleString()} members
          </Text>
        ) : null}
        {item.summary ? (
          <Text className="font-ui text-xs text-base-content/70 leading-snug mt-1" numberOfLines={2}>
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
      className="flex-row items-center justify-between py-3 px-5 border-t border-base-300"
    >
      <Text className="font-ui text-base text-base-content flex-1 mr-3" numberOfLines={1}>
        {page.title}
      </Text>
      <ExternalLink size={14} color="rgba(26,26,32,0.4)" strokeWidth={1.75} />
    </Pressable>
  );
}

function EmptyTab({ message }) {
  return (
    <View className="px-6 py-16 items-center">
      <Text className="font-ui text-base text-base-content/50 text-center">{message}</Text>
    </View>
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
  const [profileError, setProfileError] = useState(null);
  const [heroFailed, setHeroFailed] = useState(false);

  const [tab, setTab] = useState("posts");

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState(null);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotal, setPostsTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadServer = useCallback(
    async ({ isRefresh = false } = {}) => {
      if (!client || !domain) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setProfileError(null);
      try {
        const res = await client.feeds.getServer({ domain, refresh: isRefresh });
        setServer(res);
      } catch (e) {
        setProfileError(e?.message || "Couldn't load server profile.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [client, domain]
  );

  const loadPosts = useCallback(
    async ({ page = 1, append = false } = {}) => {
      if (!domain) return;
      if (append) setLoadingMore(true);
      else setPostsLoading(true);
      setPostsError(null);
      try {
        const qs = `limit=${POSTS_PER_PAGE}${page > 1 ? `&page=${page}` : ""}`;
        const res = await fetch(`https://${domain}/posts?${qs}`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items = data.orderedItems ?? data.items ?? [];
        if (append) {
          setPosts((prev) => {
            const seen = new Set(prev.map((p) => p.id));
            return [...prev, ...items.filter((p) => !seen.has(p.id))];
          });
        } else {
          setPosts(items);
        }
        setPostsTotal(data.totalItems ?? items.length);
        setPostsPage(page);
      } catch (e) {
        setPostsError(e?.message || "Couldn't load posts.");
      } finally {
        setPostsLoading(false);
        setLoadingMore(false);
      }
    },
    [domain]
  );

  // Always load server profile on focus; posts only when Posts tab is active.
  useFocusEffect(
    useCallback(() => {
      loadServer();
    }, [loadServer])
  );

  useEffect(() => {
    if (tab === "posts" && posts.length === 0 && !postsLoading) {
      loadPosts({ page: 1 });
    }
  }, [tab, loadPosts]);

  const onRefresh = useCallback(() => {
    loadServer({ isRefresh: true });
    if (tab === "posts") loadPosts({ page: 1 });
  }, [loadServer, loadPosts, tab]);

  if (loading && !server) {
    return (
      <SafeAreaView className="flex-1 bg-base-100 items-center justify-center" edges={["top"]}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (profileError && !server) {
    return (
      <SafeAreaView className="flex-1 bg-base-100" edges={["top", "left", "right"]}>
        <View className="px-5 pt-3 pb-4 border-b-2 border-base-content">
          <BackLink />
          <Text className="font-ui text-3xl text-base-content mt-2">{domain}</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="font-ui text-base text-error text-center mb-4">{profileError}</Text>
          <Pressable
            onPress={() => loadServer()}
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
  const circles = server?.cachedCircles ?? [];
  const groups  = server?.cachedGroups  ?? [];
  const pages   = server?.cachedPages   ?? [];
  const hasMore = posts.length < postsTotal;

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["top", "left", "right"]}>
      {/* Fixed back bar */}
      <View className="px-5 pt-3 pb-3 border-b-2 border-base-content">
        <BackLink />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
          <View className="w-full bg-secondary items-center justify-center" style={{ aspectRatio: 16 / 9 }}>
            {iconSrc ? (
              <Image source={{ uri: iconSrc }} style={{ width: 72, height: 72 }} resizeMode="contain" />
            ) : (
              <Globe size={48} color="rgba(255,244,224,0.5)" strokeWidth={1.5} />
            )}
          </View>
        )}

        {/* Masthead */}
        <View className="px-5 pt-4 pb-3">
          <Text className="font-ui text-3xl text-base-content leading-tight">
            {server?.name || domain}
          </Text>
          <Text className="font-ui text-[11px] uppercase tracking-[0.16em] text-base-content/50 mt-1">
            {domain}
          </Text>

          {server?.stale ? (
            <Text className="font-ui text-xs text-warning mt-1">
              Showing cached data — server unreachable
            </Text>
          ) : null}

          {server?.description ? (
            <Text className="font-ui text-sm text-base-content/80 leading-relaxed mt-3">
              {stripHtml(server.description)}
            </Text>
          ) : null}

          {server?.location?.name ? (
            <View className="flex-row items-center mt-3">
              <MapPin size={13} color="rgba(26,26,32,0.5)" strokeWidth={1.75} />
              <Text className="font-ui text-xs uppercase tracking-[0.14em] text-base-content/50 ml-1.5">
                {server.location.name}
              </Text>
            </View>
          ) : null}

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
        </View>

        {/* Tab bar */}
        <TabBar tab={tab} onSelect={setTab} />

        {/* Tab content */}
        <View className="pb-10">
          {/* ── Posts ── */}
          {tab === "posts" ? (
            postsLoading ? (
              <View className="py-16 items-center">
                <ActivityIndicator />
              </View>
            ) : postsError ? (
              <View className="px-6 py-16 items-center">
                <Text className="font-ui text-base text-error text-center mb-4">{postsError}</Text>
                <Pressable
                  onPress={() => loadPosts({ page: 1 })}
                  className="border-2 border-base-content px-5 py-2.5"
                >
                  <Text className="font-ui uppercase tracking-[0.16em] text-xs text-base-content">
                    Retry
                  </Text>
                </Pressable>
              </View>
            ) : posts.length === 0 ? (
              <EmptyTab message="No public posts yet." />
            ) : (
              <>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
                {hasMore ? (
                  <View className="items-center py-6">
                    {loadingMore ? (
                      <ActivityIndicator />
                    ) : (
                      <Pressable
                        onPress={() => loadPosts({ page: postsPage + 1, append: true })}
                        className="border-2 border-base-content px-6 py-3"
                        android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                      >
                        <Text className="font-ui uppercase tracking-[0.16em] text-xs text-base-content">
                          Load more
                        </Text>
                      </Pressable>
                    )}
                  </View>
                ) : null}
              </>
            )
          ) : null}

          {/* ── Circles ── */}
          {tab === "circles" ? (
            circles.length === 0 ? (
              <EmptyTab message="No public circles." />
            ) : (
              <>
                <SectionHeading>Circles</SectionHeading>
                {circles.map((c) => (
                  <CachedRow key={c.id} item={c} baseUrl={baseUrl} />
                ))}
              </>
            )
          ) : null}

          {/* ── Groups ── */}
          {tab === "groups" ? (
            groups.length === 0 ? (
              <EmptyTab message="No public groups." />
            ) : (
              <>
                <SectionHeading>Groups</SectionHeading>
                {groups.map((g) => (
                  <CachedRow key={g.id} item={g} baseUrl={baseUrl} />
                ))}
              </>
            )
          ) : null}

          {/* ── Pages ── */}
          {tab === "pages" ? (
            pages.length === 0 ? (
              <EmptyTab message="No public pages." />
            ) : (
              <>
                <SectionHeading>Pages</SectionHeading>
                {pages.map((p, i) => (
                  <PageRow key={p.url || i} page={p} />
                ))}
              </>
            )
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
