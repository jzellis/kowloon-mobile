// PostActionBar — Reply / React / Repost / Share / Bookmark row.
//
// Used in two places:
//   - Timeline card  — Reply taps navigate to the post detail.
//   - Detail screen  — Reply scrolls to + focuses the composer.
//
// React uses the existing ReactButton (which carries the picker + optimistic
// count). The other actions take callbacks or do their own thing inline.

import { Alert, Pressable, Share, Text, View } from "react-native";
import {
  Bookmark,
  MessageCircle,
  Repeat2,
  Share2,
  Smile,
} from "lucide-react-native";
import { useRouter } from "expo-router";

import { ReactButton } from "./ReactButton.jsx";

const ICON_COLOR = "rgba(26,26,32,0.55)";
const ICON_STROKE = 1.75;

function CountIcon({ Icon, count, onPress, label, size = "md", disabled }) {
  const iconSize = size === "sm" ? 16 : 20;
  const countSize = size === "sm" ? "text-[11px]" : "text-xs";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      hitSlop={8}
      android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
      className={`flex-row items-center ${disabled ? "opacity-30" : ""}`}
    >
      <Icon size={iconSize} color={ICON_COLOR} strokeWidth={ICON_STROKE} />
      {typeof count === "number" && count > 0 ? (
        <Text className={`font-ui ${countSize} text-base-content/55 ml-1.5`}>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}

// Public posts are shareable to the OS; private ones aren't, so we render the
// share icon disabled with an explanatory alert on tap.
function isPublicPost(post) {
  return (
    post?.to === "@public" ||
    post?.to === "public" ||
    post?.visibility === "Public" ||
    post?.visibility === "public"
  );
}

// Lightweight HTML strip for the repost-quote prefill. textPreview is usually
// already plain text, but the body/summary fallback might carry tags. Not a
// sanitizer — purely for plain-text excerpt extraction.
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
    .replace(/&#39;/g, "'");
}

function postShareUrl(client, post) {
  // Use the post's canonical URL when present; otherwise fall back to a
  // kwln://post/<id> deep link the server can resolve. Always prefer the
  // public canonical link — that's what people send to friends.
  if (post?.url) return post.url;
  const baseUrl = client?.http?.baseUrl;
  const id = post?.id;
  if (!baseUrl || !id) return null;
  return `${baseUrl.replace(/\/$/, "")}/posts/${encodeURIComponent(id)}`;
}

export function PostActionBar({
  post,
  client,
  currentUser,
  onReply,
  onReacted,
  size = "md",
  className = "",
}) {
  const router = useRouter();
  const shareUrl = postShareUrl(client, post);
  const canShare = !!shareUrl && isPublicPost(post);

  function handleReply() {
    if (onReply) return onReply();
    if (post?.id) {
      router.push(`/post/${encodeURIComponent(post.id)}?focusReply=1`);
    }
  }

  function handleRepost() {
    if (!currentUser) return;
    if (!shareUrl) return;
    // Carry the original's identity into the new draft so the reshare uses
    // the same hero image and quotes the source — compose.js prefills these
    // from params (see Repost prefill block there).
    const title = post?.title || post?.name || "";
    const featuredImage = post?.featuredImage || post?.image || "";
    const quote = (post?.textPreview || stripHtml(post?.summary || post?.body || "")).trim();
    router.push({
      pathname: "/compose",
      params: {
        type: "Link",
        href: shareUrl,
        title,
        featuredImage,
        quote,
      },
    });
  }


  async function handleShare() {
    if (!shareUrl) return;
    if (!isPublicPost(post)) {
      Alert.alert("Private post", "This post is private — it can't be shared.");
      return;
    }
    const title = post?.title || post?.name || "";
    try {
      await Share.share({
        url: shareUrl,
        message: title ? `${title}\n${shareUrl}` : shareUrl,
        title,
      });
    } catch {
      // user cancelled or sheet failed; no-op
    }
  }

  function handleBookmark() {
    if (!currentUser) return;
    // BookmarkComposer mobile screen isn't built yet — see CLAUDE.md TODO.
    Alert.alert(
      "Bookmarks",
      "Bookmark composer coming soon. For now use the web frontend to bookmark posts."
    );
  }

  return (
    <View
      className={`flex-row items-center ${className}`}
      style={{ gap: size === "sm" ? 20 : 24 }}
    >
      <CountIcon
        Icon={MessageCircle}
        count={post?.replyCount}
        onPress={handleReply}
        label="Reply"
        size={size}
      />

      {currentUser && post?.canReact !== "@none" && post?.canReact !== "none" ? (
        <ReactButton
          client={client}
          post={post}
          onReacted={onReacted}
          size={size}
        />
      ) : (
        <CountIcon
          Icon={Smile}
          count={post?.reactCount}
          onPress={() => {}}
          label="React"
          size={size}
          disabled
        />
      )}

      {currentUser ? (
        <CountIcon
          Icon={Repeat2}
          onPress={handleRepost}
          label="Repost"
          size={size}
          disabled={!shareUrl}
        />
      ) : null}

      <CountIcon
        Icon={Share2}
        onPress={handleShare}
        label="Share"
        size={size}
        disabled={!canShare}
      />

      {currentUser ? (
        <CountIcon
          Icon={Bookmark}
          onPress={handleBookmark}
          label="Bookmark"
          size={size}
        />
      ) : null}
    </View>
  );
}

