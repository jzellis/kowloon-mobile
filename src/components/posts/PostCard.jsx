// Feed post card — editorial, type-aware. Renders a preview (title + plain
// text), never the full HTML body; tapping opens the post detail screen.
//
// Post types: Note, Article, Media, Link, Event. Each gets an accent color
// and type-appropriate treatment.

import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Avatar } from "./Avatar.jsx";
import { HtmlContent } from "../HtmlContent.jsx";
import { timeAgo } from "../../lib/timeAgo.js";

// Static class strings — NativeWind needs the full class name at build time,
// so we can't interpolate `text-post-${type}`.
const TYPE_META = {
  Note: { label: "Note", accent: "text-post-note", bar: "bg-post-note" },
  Article: { label: "Article", accent: "text-post-article", bar: "bg-post-article" },
  Media: { label: "Media", accent: "text-post-media", bar: "bg-post-media" },
  Link: { label: "Link", accent: "text-post-link", bar: "bg-post-link" },
  Event: { label: "Event", accent: "text-post-event", bar: "bg-post-event" },
};

function hostOf(url) {
  if (!url) return "";
  return String(url)
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "");
}

export function PostCard({ post }) {
  const router = useRouter();
  const meta = TYPE_META[post?.type] || TYPE_META.Note;

  const actor = post?.actor || {};
  const handle = actor.id || post?.actorId || "";
  const name = actor.name || handle.replace(/^@/, "");

  const title = post?.title?.trim();
  // Articles carry a generated `summary`; Notes don't — their `body` is the
  // whole (short) post, so fall back to it.
  const previewHtml = (post?.summary || post?.body || "").trim();
  const plainPreview = post?.textPreview?.trim();
  const image = post?.featuredImage || post?.image || null;
  const linkHost = post?.type === "Link" ? hostOf(post?.url) : "";

  function open() {
    router.push(`/post/${encodeURIComponent(post.id)}`);
  }

  return (
    <Pressable
      onPress={open}
      android_ripple={{ color: "rgba(0,0,0,0.04)" }}
      className="border-b-2 border-base-300 bg-base-100"
    >
      {/* Type accent bar */}
      <View className={`h-[3px] ${meta.bar}`} />

      <View className="px-5 py-4">
        {/* Author row */}
        <View className="flex-row items-center mb-3">
          <Avatar actor={actor} size={38} />
          <View className="flex-1 ml-3">
            <Text
              className="font-ui text-sm text-base-content"
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text
              className="font-ui text-xs text-base-content/50"
              numberOfLines={1}
            >
              {handle}
            </Text>
          </View>
          <View className="items-end">
            <Text
              className={`font-ui text-[10px] uppercase tracking-[0.16em] ${meta.accent}`}
            >
              {meta.label}
            </Text>
            <Text className="font-ui text-xs text-base-content/50 mt-0.5">
              {timeAgo(post?.publishedAt || post?.createdAt)}
            </Text>
          </View>
        </View>

        {/* Title — types that carry one */}
        {title ? (
          <Text className="font-reading text-xl text-base-content leading-tight mb-1.5">
            {title}
          </Text>
        ) : null}

        {/* Link host */}
        {linkHost ? (
          <Text className={`font-ui text-xs mb-1.5 ${meta.accent}`}>
            {linkHost}
          </Text>
        ) : null}

        {/* Preview — rich HTML excerpt */}
        {previewHtml ? (
          <HtmlContent html={previewHtml} fontSize={15} />
        ) : plainPreview ? (
          <Text
            className="font-reading text-[15px] text-base-content/80 leading-6"
            numberOfLines={title ? 3 : 5}
          >
            {plainPreview}
          </Text>
        ) : null}

        {/* Media image */}
        {image ? (
          <Image
            source={{ uri: image }}
            className="w-full h-48 mt-3 border-2 border-base-300 bg-base-200"
            resizeMode="cover"
          />
        ) : null}

        {/* Footer counts */}
        <View className="flex-row mt-3">
          <Text className="font-ui text-xs text-base-content/50 mr-5">
            {post?.replyCount || 0} replies
          </Text>
          <Text className="font-ui text-xs text-base-content/50">
            {post?.reactCount || 0} reactions
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
