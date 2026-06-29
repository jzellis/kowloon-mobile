// LeftDrawer — the mobile counterpart to the web's left sidebar.
//
// Slides in from the left (Modal w/ fade for now; a real slide-in could come
// later with Reanimated). Contains the same five widgets as the web:
//   - ServerInfo (hero + description + location)
//   - PagesMenu (server pages tree)
//   - PopularCircles (top circles by reaction count)
//   - PopularPosts (top posts by reaction + reply)
//   - ActiveGroups (groups w/ recent post snippet)
//
// Each section fetches its own data on first mount inside the drawer. The
// drawer is rendered inside a Modal so the children mount when `visible`
// flips true; on close they unmount (RN Modal default), so re-opening
// re-fetches. That's fine for now — the lists are small.

import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  MapPin,
  MessageSquare,
  Music,
  Play,
  Smile,
  Users,
  X,
} from "lucide-react-native";

import { useActiveClient } from "../../lib/useActiveClient.js";
import { resolveImageUrl } from "../../lib/resolveImageUrl.js";
import { POST_TYPES } from "../../lib/postTypes.js";

const DRAWER_WIDTH_PCT = 0.85;

function SectionHeader({ children }) {
  return (
    <Text className="font-ui text-2xl text-base-content leading-none mb-3">
      {children}
    </Text>
  );
}

function stripHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function relativeTime(iso) {
  const t = new Date(iso).getTime();
  if (!t) return "";
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ── ServerInfo ──────────────────────────────────────────────────────────────

function ServerInfoSection({ client, onNavigate }) {
  const [info, setInfo] = useState(null);
  const [heroFailed, setHeroFailed] = useState(false);
  const baseUrl = client?.http?.baseUrl;

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    client.feeds
      .getServerInfo()
      .then((res) => {
        if (!cancelled) setInfo(res || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [client]);

  if (!info) return null;
  // Prefer the configured hero image; fall back to the icon. Resolve relative
  // paths against the server's baseUrl so RN's Image can fetch them.
  const heroSrc = resolveImageUrl(info.image || info.icon, baseUrl);
  const description = info.description;
  const location = info.settings?.profile?.location;
  const serverName = info.name;
  // Render the hero block whenever we have *something* to head the drawer
  // with — image, name, description, or location. If the image is set but
  // fails to load, we drop to the name placeholder so there's never an empty
  // gap at the top.
  const hasHero = heroSrc && !heroFailed;
  const hasContent = hasHero || serverName || description || location?.name;

  if (!hasContent) return null;

  return (
    <View className="border-b-2 border-base-300 pb-5 mb-5">
      {hasHero ? (
        <View className="-mt-5 -mx-5 mb-4">
          <Image
            source={{ uri: heroSrc }}
            className="w-full bg-base-200"
            style={{ aspectRatio: 16 / 9 }}
            resizeMode="cover"
            onError={() => setHeroFailed(true)}
          />
        </View>
      ) : serverName ? (
        // Editorial placeholder — the server name in big display type. Same
        // bleed and aspect ratio as the hero would have so the layout stays
        // stable when the admin uploads an image later.
        <View
          className="-mt-5 -mx-5 mb-4 items-center justify-center bg-secondary px-6"
          style={{ aspectRatio: 16 / 9 }}
        >
          <Text
            className="font-ui text-4xl text-secondary-content text-center leading-tight"
            numberOfLines={3}
          >
            {serverName}
          </Text>
        </View>
      ) : null}
      {description ? (
        <Text className="font-ui text-sm text-base-content/80 leading-relaxed mb-3">
          {stripHtml(description)}
        </Text>
      ) : null}
      {location?.name ? (
        <View className="flex-row items-center">
          <MapPin
            size={13}
            color="rgba(26,26,32,0.55)"
            strokeWidth={1.75}
          />
          <Text className="font-ui text-xs uppercase tracking-[0.16em] text-base-content/55 ml-1.5 flex-1">
            {location.name}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ── PagesMenu ───────────────────────────────────────────────────────────────

function PagesMenuSection({ client, onNavigate }) {
  const [pages, setPages] = useState([]);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    client.feeds.http
      .get("/pages", { params: { limit: 50 } })
      .then((res) => {
        if (cancelled) return;
        const items = res?.orderedItems || res?.items || [];
        const top = items.filter((p) => !p.parentId);
        const tree = top.map((p) => ({
          ...p,
          children: items.filter((c) => c.parentId === p.id),
        }));
        setPages(tree);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [client]);

  if (!pages.length) return null;

  return (
    <View className="border-b-2 border-base-300 pb-5 mb-5">
      <SectionHeader>Pages</SectionHeader>
      {pages.map((page) => (
        <View key={page.id}>
          <Pressable
            onPress={() =>
              onNavigate(`/pages/${encodeURIComponent(page.slug || page.id)}`)
            }
            android_ripple={{ color: "rgba(0,0,0,0.06)" }}
            className="flex-row items-center justify-between py-2"
          >
            <Text className="font-ui text-sm uppercase tracking-[0.16em] text-base-content/80 flex-1">
              {page.title || page.name}
            </Text>
            {page.children?.length > 0 ? (
              <ChevronRight
                size={14}
                color="rgba(26,26,32,0.55)"
                strokeWidth={1.75}
              />
            ) : null}
          </Pressable>
          {page.children?.length > 0 ? (
            <View className="border-l-2 border-base-300 ml-2 mb-1">
              {page.children.map((child) => (
                <Pressable
                  key={child.id}
                  onPress={() =>
                    onNavigate(
                      `/pages/${encodeURIComponent(child.slug || child.id)}`
                    )
                  }
                  android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                  className="py-1.5 pl-3"
                >
                  <Text className="font-ui text-sm uppercase tracking-[0.16em] text-base-content/65">
                    {child.title || child.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

// ── PopularCircles ──────────────────────────────────────────────────────────

function CircleAvatar({ circle, baseUrl }) {
  const [failed, setFailed] = useState(false);
  const icon = resolveImageUrl(circle?.icon, baseUrl);
  if (icon && !failed) {
    return (
      <Image
        source={{ uri: icon }}
        style={{ width: 36, height: 36 }}
        className="border-2 border-base-300 bg-base-200"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View
      style={{ width: 36, height: 36 }}
      className="border-2 border-base-300 bg-secondary items-center justify-center"
    >
      <Users size={18} color="rgba(255,244,224,0.7)" strokeWidth={1.75} />
    </View>
  );
}

function PopularCirclesSection({ client, onNavigate }) {
  const [circles, setCircles] = useState([]);
  const baseUrl = client?.http?.baseUrl;

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    client.feeds
      .browseCircles({ sort: "reacts", limit: 5 })
      .then((res) => {
        if (!cancelled) setCircles(res?.orderedItems || res?.items || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [client]);

  if (!circles.length) return null;

  return (
    <View className="border-b-2 border-base-300 pb-5 mb-5">
      <SectionHeader>Popular Circles</SectionHeader>
      {circles.map((circle) => (
        <Pressable
          key={circle.id}
          onPress={() =>
            onNavigate(`/circles/${encodeURIComponent(circle.id)}`)
          }
          android_ripple={{ color: "rgba(0,0,0,0.06)" }}
          className="flex-row items-start py-3 border-t border-base-300"
        >
          <CircleAvatar circle={circle} baseUrl={baseUrl} />
          <View className="flex-1 ml-3 min-w-0">
            <Text
              className="font-ui text-base text-base-content leading-tight"
              numberOfLines={1}
            >
              {circle.name}
            </Text>
            {circle.memberCount > 0 ? (
              <Text className="font-ui text-[11px] uppercase tracking-[0.14em] text-base-content/55 mt-0.5">
                {circle.memberCount} members
              </Text>
            ) : null}
            {circle.summary ? (
              <Text
                className="font-ui text-xs text-base-content/70 leading-snug mt-1"
                numberOfLines={2}
              >
                {stripHtml(circle.summary)}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

// ── PopularPosts ────────────────────────────────────────────────────────────

const MEDIA_COLOR = POST_TYPES.Media?.color || "#009084";

function MediaThumb({ post, baseUrl }) {
  const [failed, setFailed] = useState(false);
  const src = resolveImageUrl(post.featuredImage, baseUrl);
  if (src && !failed) {
    return (
      <Image
        source={{ uri: src }}
        style={{ width: 56, height: 56 }}
        className="border border-base-300 bg-base-200"
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    );
  }
  const mt = post.attachments?.[0]?.mediaType || "";
  const isAudio = mt.startsWith("audio/");
  const isVideo = mt.startsWith("video/");
  if (!isAudio && !isVideo) return null;
  return (
    <View
      style={{
        width: 56,
        height: 56,
        backgroundColor: MEDIA_COLOR + "22",
      }}
      className="items-center justify-center"
    >
      {isAudio ? (
        <Music size={20} color={MEDIA_COLOR} strokeWidth={1.75} />
      ) : (
        <Play size={20} color={MEDIA_COLOR} strokeWidth={1.75} />
      )}
    </View>
  );
}

function PopularPostsSection({ client, onNavigate }) {
  const [posts, setPosts] = useState([]);
  const baseUrl = client?.http?.baseUrl;

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    client.feeds
      .getServerPosts({ limit: 20 })
      .then((res) => {
        if (cancelled) return;
        const items = res?.orderedItems || res?.items || [];
        const sorted = [...items]
          .sort(
            (a, b) =>
              (b.reactCount || 0) +
              (b.replyCount || 0) -
              ((a.reactCount || 0) + (a.replyCount || 0))
          )
          .slice(0, 7);
        setPosts(sorted);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [client]);

  if (!posts.length) return null;

  return (
    <View className="border-b-2 border-base-300 pb-5 mb-5">
      <SectionHeader>Popular Posts</SectionHeader>
      {posts.map((post) => {
        const typeColor = POST_TYPES[post.type]?.color || "#5588B1";
        const showThumb = post.type === "Media";
        return (
          <Pressable
            key={post.id}
            onPress={() => onNavigate(`/post/${encodeURIComponent(post.id)}`)}
            android_ripple={{ color: "rgba(0,0,0,0.06)" }}
            className="flex-row py-3 border-t border-base-300"
          >
            <View
              style={{ width: 3, backgroundColor: typeColor }}
              className="self-stretch mr-3 mt-0.5"
            />
            <View className="flex-1 min-w-0">
              {post.title || post.name ? (
                <Text
                  className="font-ui text-base text-base-content leading-tight"
                  numberOfLines={2}
                >
                  {post.title || post.name}
                </Text>
              ) : null}
              <Text
                className={`font-ui text-base-content/70 leading-snug mt-0.5 ${
                  post.title || post.name ? "text-xs" : "text-sm"
                }`}
                numberOfLines={2}
              >
                {post.textPreview || stripHtml(post.summary)}
              </Text>
              <View className="flex-row items-center justify-between mt-1.5">
                <Text
                  className="font-ui text-[10px] uppercase tracking-[0.14em] text-base-content/65 flex-1 mr-2"
                  numberOfLines={1}
                >
                  {post.actor?.name || post.actor?.id || ""}
                </Text>
                <View className="flex-row items-center">
                  <Smile size={11} color="rgba(26,26,32,0.55)" strokeWidth={1.75} />
                  <Text className="font-ui text-[10px] uppercase tracking-[0.14em] text-base-content/55 ml-1 mr-2.5">
                    {post.reactCount || 0}
                  </Text>
                  <MessageSquare
                    size={11}
                    color="rgba(26,26,32,0.55)"
                    strokeWidth={1.75}
                  />
                  <Text className="font-ui text-[10px] uppercase tracking-[0.14em] text-base-content/55 ml-1">
                    {post.replyCount || 0}
                  </Text>
                </View>
              </View>
            </View>
            {showThumb ? (
              <View className="ml-3">
                <MediaThumb post={post} baseUrl={baseUrl} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

// ── ActiveGroups ────────────────────────────────────────────────────────────

function GroupAvatar({ group, baseUrl }) {
  const [failed, setFailed] = useState(false);
  const icon = resolveImageUrl(group?.icon, baseUrl);
  if (icon && !failed) {
    return (
      <Image
        source={{ uri: icon }}
        style={{ width: 36, height: 36 }}
        className="border-2 border-base-300 bg-base-200"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View
      style={{ width: 36, height: 36 }}
      className="border-2 border-base-300 bg-secondary items-center justify-center"
    >
      <Users size={18} color="rgba(255,244,224,0.7)" strokeWidth={1.75} />
    </View>
  );
}

function ActiveGroupsSection({ client, onNavigate }) {
  const [groups, setGroups] = useState([]);
  const baseUrl = client?.http?.baseUrl;

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    client.feeds
      .getGroups({ limit: 5 })
      .then((res) => {
        if (!cancelled) setGroups(res?.orderedItems || res?.items || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [client]);

  if (!groups.length) return null;

  return (
    <View className="pb-2">
      <SectionHeader>Active Groups</SectionHeader>
      {groups.map((group) => (
        <View key={group.id} className="py-3 border-t border-base-300">
          <Pressable
            onPress={() =>
              onNavigate(`/groups/${encodeURIComponent(group.id)}`)
            }
            android_ripple={{ color: "rgba(0,0,0,0.06)" }}
            className="flex-row items-start"
          >
            <GroupAvatar group={group} baseUrl={baseUrl} />
            <View className="flex-1 ml-3 min-w-0">
              <Text
                className="font-ui text-base text-base-content leading-tight"
                numberOfLines={1}
              >
                {group.name}
              </Text>
              <Text className="font-ui text-[11px] uppercase tracking-[0.14em] text-base-content/55 mt-0.5">
                {(group.memberCount || 0).toLocaleString()} members
              </Text>
            </View>
          </Pressable>
          {group.recentPost ? (
            <View className="mt-2 pl-12">
              <Text
                className="font-ui text-xs text-base-content/75 leading-snug"
                numberOfLines={2}
              >
                {stripHtml(group.recentPost.summary)}
              </Text>
              <Text
                className="font-ui text-[10px] uppercase tracking-[0.14em] text-base-content/55 mt-1"
                numberOfLines={1}
              >
                {group.recentPost.actor?.name || group.recentPost.actor?.id} ·{" "}
                {relativeTime(group.recentPost.published)}
              </Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

// ── LeftDrawer ──────────────────────────────────────────────────────────────

export function LeftDrawer({ visible, onClose }) {
  const router = useRouter();
  const client = useActiveClient();
  const screenWidth = Dimensions.get("window").width;
  const panelWidth = Math.round(screenWidth * DRAWER_WIDTH_PCT);

  function navigate(path) {
    onClose();
    router.push(path);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 flex-row">
        {/* Panel — left-anchored, full height */}
        <SafeAreaView
          edges={["top", "left", "bottom"]}
          style={{ width: panelWidth }}
          className="bg-base-100 border-r-2 border-base-content"
        >
          <View className="flex-row items-center justify-between px-5 pt-2 pb-3 border-b-2 border-base-300">
            <Text className="font-ui uppercase tracking-[0.18em] text-[11px] text-base-content/55">
              Menu
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
            >
              <X size={20} color="rgba(26,26,32,0.7)" strokeWidth={1.75} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <ServerInfoSection client={client} onNavigate={navigate} />
            <PagesMenuSection client={client} onNavigate={navigate} />
            <PopularCirclesSection client={client} onNavigate={navigate} />
            <PopularPostsSection client={client} onNavigate={navigate} />
            <ActiveGroupsSection client={client} onNavigate={navigate} />
          </ScrollView>
        </SafeAreaView>
        {/* Backdrop — fills the remaining width to the right of the panel;
            tap to dismiss. flex-1 inside flex-row gives us a column that
            stretches to the screen edge and the full screen height. */}
        <Pressable onPress={onClose} className="flex-1 bg-black/40" />
      </View>
    </Modal>
  );
}
