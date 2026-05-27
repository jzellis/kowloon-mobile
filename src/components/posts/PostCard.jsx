// Feed post card — editorial, type-aware. Renders a preview (title + plain
// text), never the full HTML body; tapping opens the post detail screen.
//
// Post types: Note, Article, Media, Link, Event. Each gets an accent color
// and type-appropriate treatment.

import { Image, Linking, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Avatar } from "./Avatar.jsx";
import { AudioAttachment } from "./AudioAttachment.jsx";
import { VideoAttachment } from "./VideoAttachment.jsx";
import { LocationLine } from "./LocationLine.jsx";
import { PostActionBar } from "./PostActionBar.jsx";
import { HtmlContent } from "../HtmlContent.jsx";
import { useActiveClient } from "../../lib/useActiveClient.js";
import { kowloonPostIdFromUrl } from "../../lib/parseKowloonUrl.js";
import { timeAgo } from "../../lib/timeAgo.js";

// Classify an attachment by mediaType, with a fallback for `.m4a` files
// which Android sometimes labels `video/mp4` even though they're audio.
function attachmentKind(att) {
  const mime = (att?.mediaType || "").toLowerCase();
  const name = (att?.name || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (name.endsWith(".m4a") || name.endsWith(".aac") || name.endsWith(".mp3")) {
    return "audio";
  }
  if (mime.startsWith("video/")) return "video";
  return "other";
}

function decodeEntities(s) {
  if (!s) return "";
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

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
  const client = useActiveClient();
  const currentUser = client?.auth?.getUser?.() || null;
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
  // For Link posts the host shown is the *external* URL's host (post.href),
  // not the Kowloon canonical post URL (post.url) — those are always our own
  // domain.
  const linkHost = post?.type === "Link" ? hostOf(post?.href) : "";

  function open() {
    router.push(`/post/${encodeURIComponent(post.id)}`);
  }

  async function openExternal() {
    const href = post?.href;
    if (!href) return;
    // Kowloon post URL → open in-app instead of the browser.
    const kowloonId = kowloonPostIdFromUrl(href);
    if (kowloonId) {
      router.push(`/post/${encodeURIComponent(kowloonId)}`);
      return;
    }
    try {
      await Linking.openURL(href);
    } catch {
      // some URLs may not be supported by the OS; silently no-op
    }
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

        {post?.type === "Media" ? (
          /* Media: optional title, then caption, then each attachment as a
             tile. Images render in a 2-col grid; videos and audio render as
             full-width rows below. Falls back to the legacy single `image`
             field for older posts that pre-date attachments. */
          <>
            {title ? (
              <Text className="font-reading text-xl text-base-content leading-tight mb-1.5">
                {title}
              </Text>
            ) : null}
            <LocationLine location={post?.location} />
            {plainPreview ? (
              <Text className="font-reading text-[15px] text-base-content/80 leading-6 mb-3">
                {decodeEntities(plainPreview)}
              </Text>
            ) : null}
            {Array.isArray(post.attachments) && post.attachments.length > 0 ? (
              <View>
                {/* Images: 2-column grid. Single image stays full width; an
                    odd-count final image spans both columns so the bottom
                    edge stays flush. */}
                {(() => {
                  const imgs = post.attachments.filter(
                    (a) => attachmentKind(a) === "image"
                  );
                  if (imgs.length === 0) return null;
                  if (imgs.length === 1) {
                    return (
                      <Image
                        source={{ uri: imgs[0].url }}
                        className="w-full h-72 mb-2 border-2 border-base-300 bg-base-200"
                        resizeMode="cover"
                      />
                    );
                  }
                  return (
                    <View className="flex-row flex-wrap mb-1" style={{ gap: 4 }}>
                      {imgs.map((img, i) => {
                        const lastOdd =
                          imgs.length % 2 === 1 && i === imgs.length - 1;
                        return (
                          <View
                            key={`${img.url}-${i}`}
                            style={{ width: lastOdd ? "100%" : "49%" }}
                          >
                            <Image
                              source={{ uri: img.url }}
                              className="w-full h-40 border-2 border-base-300 bg-base-200"
                              resizeMode="cover"
                            />
                          </View>
                        );
                      })}
                    </View>
                  );
                })()}

                {/* Videos and audio render as full-width rows below the grid,
                    each with its own player. */}
                {post.attachments
                  .filter((a) => attachmentKind(a) !== "image")
                  .map((att, i) => {
                    const kind = attachmentKind(att);
                    const key = `${att.url}-${i}`;
                    if (kind === "video") {
                      return <VideoAttachment key={key} att={att} />;
                    }
                    return <AudioAttachment key={key} att={att} />;
                  })}
              </View>
            ) : image ? (
              <Image
                source={{ uri: image }}
                className="w-full h-72 mb-3 border-2 border-base-300 bg-base-200"
                resizeMode="cover"
              />
            ) : null}
          </>
        ) : post?.type === "Link" ? (
          /* Image-first link card: image on top, then the link title, then
             the description. Image and title open the external URL; tapping
             elsewhere on the card still opens the post detail. */
          <>
            {image ? (
              <Pressable onPress={openExternal} className="mb-3">
                <Image
                  source={{ uri: image }}
                  className="w-full h-48 border-2 border-base-300 bg-base-200"
                  resizeMode="cover"
                />
              </Pressable>
            ) : null}
            {title ? (
              <Pressable onPress={openExternal}>
                <Text className={`font-reading text-xl ${meta.accent} leading-tight mb-1`}>
                  {title}
                </Text>
              </Pressable>
            ) : null}
            <LocationLine location={post?.location} />
            {linkHost ? (
              <Text className="font-ui text-xs text-base-content/45 mb-2">
                {linkHost}
              </Text>
            ) : null}
            {plainPreview ? (
              <Text className="font-reading text-[15px] text-base-content/80 leading-6">
                {decodeEntities(plainPreview)}
              </Text>
            ) : null}
          </>
        ) : (
          /* Default body — title + HTML preview + optional hero image. Used
             for Note, Article, and Event. */
          <>
            {title ? (
              <Text className="font-reading text-xl text-base-content leading-tight mb-1.5">
                {title}
              </Text>
            ) : null}

            {/* Notes have no title, so the LocationLine here sits directly
                between the author row and the body. Articles get a tiny
                line under the title; Events get the prominent treatment. */}
            <LocationLine location={post?.location} prominent={post?.type === "Event"} />

            {linkHost ? (
              <Text className={`font-ui text-xs mb-1.5 ${meta.accent}`}>
                {linkHost}
              </Text>
            ) : null}

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

            {/* Server only emits `summary` when the body needed truncating
                (>2 paragraphs or any paragraph >1000 chars — see Post.js
                `generateSummary`). When it's present, signal that the card
                is showing an excerpt. */}
            {post?.summary ? (
              <Text className="font-reading italic text-base-content/45 mt-2 text-right">
                Continue reading…
              </Text>
            ) : null}

            {image ? (
              <Image
                source={{ uri: image }}
                className="w-full h-48 mt-3 border-2 border-base-300 bg-base-200"
                resizeMode="cover"
              />
            ) : null}
          </>
        )}

        {/* Action bar — reply / react / repost / share / bookmark */}
        <View className="mt-3 pt-3 border-t border-base-300">
          <PostActionBar
            post={post}
            client={client}
            currentUser={currentUser}
            size="sm"
          />
        </View>
      </View>
    </Pressable>
  );
}
