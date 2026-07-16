// PostBody — the reading surface for a single post.
//
// Renders the full HTML body (no truncation, no "continue reading"), with
// type-specific chrome:
//   Note     — body only (location displayed by the caller above the body)
//   Article  — featured image + body
//   Media    — caption + attachment gallery (image grid, audio rows, video rows)
//   Link     — external title link + host + image + description body
//   Event    — start/end date+time + body (location displayed by the caller)
//
// Reading typography (font family, size, line-height) is passed in via `fonts`/
// `fontSize`/`lineHeight` so the detail screen can apply the user's prefs.

import { Image, Linking, Pressable, Text, View } from "react-native";

import { AudioAttachment } from "./AudioAttachment.jsx";
import { VideoAttachment } from "./VideoAttachment.jsx";
import { LocationLine } from "./LocationLine.jsx";
import { HtmlContent } from "../HtmlContent.jsx";

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

function hostOf(url) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return String(url)
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "");
  }
}

function formatEventRange(post) {
  const start = post?.event?.startDate || post?.startTime;
  const end = post?.event?.endDate || post?.endTime;
  if (!start) return null;

  const startD = new Date(start);
  if (Number.isNaN(startD.getTime())) return null;
  const endD = end ? new Date(end) : null;

  const dateFmt = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const sDate = dateFmt.format(startD);
  const sTime = timeFmt.format(startD);

  if (!endD || Number.isNaN(endD.getTime())) {
    return { primary: sDate, secondary: sTime };
  }

  // Same calendar day → "Friday, May 30 · 7:00 PM – 10:00 PM"
  const sameDay =
    startD.getFullYear() === endD.getFullYear() &&
    startD.getMonth() === endD.getMonth() &&
    startD.getDate() === endD.getDate();
  if (sameDay) {
    return {
      primary: sDate,
      secondary: `${sTime} – ${timeFmt.format(endD)}`,
    };
  }
  return {
    primary: `${sDate}, ${sTime}`,
    secondary: `Until ${dateFmt.format(endD)}, ${timeFmt.format(endD)}`,
  };
}

// 2-column image grid identical to the feed card, but without the 2-row cap.
function ImageGrid({ images }) {
  if (images.length === 0) return null;
  if (images.length === 1) {
    return (
      <Image
        source={{ uri: images[0].url }}
        className="w-full h-80 mb-3   bg-base-200"
        resizeMode="cover"
      />
    );
  }
  return (
    <View className="flex-row flex-wrap mb-2" style={{ gap: 4 }}>
      {images.map((img, i) => {
        const lastOdd = images.length % 2 === 1 && i === images.length - 1;
        return (
          <View
            key={`${img.url}-${i}`}
            style={{ width: lastOdd ? "100%" : "49%" }}
          >
            <Image
              source={{ uri: img.url }}
              className="w-full h-48   bg-base-200"
              resizeMode="cover"
            />
          </View>
        );
      })}
    </View>
  );
}

function MediaAttachments({ attachments }) {
  if (!Array.isArray(attachments) || attachments.length === 0) return null;
  const images = attachments.filter((a) => attachmentKind(a) === "image");
  const others = attachments.filter((a) => attachmentKind(a) !== "image");
  return (
    <View>
      <ImageGrid images={images} />
      {others.map((att, i) => {
        const kind = attachmentKind(att);
        const key = `${att.url}-${i}`;
        if (kind === "video") return <VideoAttachment key={key} att={att} />;
        return <AudioAttachment key={key} att={att} />;
      })}
    </View>
  );
}

export function PostBody({ post, typography }) {
  const title = post?.title || post?.name;
  const html = post?.body || "";
  const fonts = typography?.fonts;
  const fontSize = typography?.fontSize ?? 17;
  const lineHeight = typography?.lineHeight;

  const type = post?.type;
  const eventRange = type === "Event" ? formatEventRange(post) : null;
  const hero =
    type === "Media"
      ? null
      : post?.featuredImage || (type === "Link" ? post?.image : null);

  async function openHref() {
    const href = post?.href;
    if (!href) return;
    try {
      await Linking.openURL(href);
    } catch {
      // no-op
    }
  }

  const hasLocation = !!post?.location?.name;
  const locationProminent = type === "Event";

  return (
    <View>
      {/* Title — Link gets its own treatment (external link, with host below) */}
      {type === "Link" ? (
        <>
          {title ? (
            <Pressable onPress={openHref}>
              <Text className="font-ui text-3xl text-post-link leading-tight mb-2">
                {title}
              </Text>
            </Pressable>
          ) : null}
          {post?.href ? (
            <Pressable onPress={openHref}>
              <Text className="font-ui uppercase tracking-[0.18em] text-xs text-base-content/55 mb-2">
                {hostOf(post.href)}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : title ? (
        <Text className="font-ui text-3xl text-base-content leading-tight mb-3">
          {title}
        </Text>
      ) : null}

      {/* Location — below the title (Article/Media/Link), prominent for Events,
          and between author row + body for Notes (which have no title). */}
      {hasLocation ? (
        <LocationLine
          location={post.location}
          prominent={locationProminent}
          className={locationProminent ? "mb-4" : "mb-3"}
        />
      ) : null}

      {/* Event details — date/time block. */}
      {type === "Event" && eventRange ? (
        <View className="  pl-4 mb-5">
          <Text className="font-ui uppercase tracking-[0.16em] text-[10px] text-base-content/55 mb-1">
            When
          </Text>
          <Text className="font-ui text-lg font-bold text-base-content leading-snug">
            {eventRange.primary}
          </Text>
          {eventRange.secondary ? (
            <Text className="font-ui text-base text-base-content/75 leading-snug mt-0.5">
              {eventRange.secondary}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Hero image — Article, Event, or Link. Media uses the attachment
          gallery as its content. On Link posts the image is part of the
          clickable external surface (matching the title + host). */}
      {hero ? (
        type === "Link" && post?.href ? (
          <Pressable onPress={openHref}>
            <Image
              source={{ uri: hero }}
              className="w-full h-72 mb-5   bg-base-200"
              resizeMode="cover"
            />
          </Pressable>
        ) : (
          <Image
            source={{ uri: hero }}
            className="w-full h-72 mb-5   bg-base-200"
            resizeMode="cover"
          />
        )
      ) : null}

      {/* Media gallery */}
      {type === "Media" ? (
        <View className="mb-3">
          <MediaAttachments attachments={post?.attachments} />
        </View>
      ) : null}

      {/* Body */}
      {html ? (
        <HtmlContent
          html={html}
          fonts={fonts}
          fontSize={fontSize}
          lineHeight={lineHeight}
          selectable
        />
      ) : !title ? (
        <Text className="font-ui text-base text-base-content/50">
          No content.
        </Text>
      ) : null}

      {/* Non-Media attachments (Articles/Events occasionally ship with a
          downloadable file). Audio/video render inline; images get the
          grid treatment. */}
      {type !== "Media" && Array.isArray(post?.attachments) && post.attachments.length > 0 ? (
        <View className="mt-4">
          <MediaAttachments attachments={post.attachments} />
        </View>
      ) : null}
    </View>
  );
}
