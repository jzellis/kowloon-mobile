// Compose a post.
//
// Layout: post-type picker across the top, then the editor — a bordered box
// with the 10tap formatting toolbar on top of it (like the web composer) and
// the editing area filling the rest — then the audience selector + Cancel/
// Post below. A top toolbar is always visible, so formatting never depends on
// keyboard position. The bottom controls clear the keyboard via an explicit
// measured inset.
//
// Note + Article are composable today; Media/Link/Event show in the picker
// but their input UI isn't built, so selecting one shows a placeholder.
//
// On submit: pull the editor's ProseMirror JSON, convert to Markdown (the
// server stores Markdown source), createPost() via @kowloon/client.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  RichText,
  Toolbar,
  useBridgeState,
  useEditorBridge,
} from "@10play/tentap-editor";

import * as ImagePicker from "expo-image-picker";

import { PostTypeSelector } from "../src/components/posts/PostTypeSelector.jsx";
import { PostTypeIcon } from "../src/components/posts/PostTypeIcon.jsx";
import { AudienceSelector } from "../src/components/posts/AudienceSelector.jsx";
import { useActiveClient } from "../src/lib/useActiveClient.js";
import { useKeyboardInset } from "../src/lib/useKeyboardInset.js";
import { kowloonPostIdFromUrl } from "../src/lib/parseKowloonUrl.js";
import { pmToMarkdown } from "../src/lib/pmToMarkdown.js";
import { uploadFile } from "../src/lib/uploadFile.js";
import { COMPOSABLE_TYPES, POST_TYPES } from "../src/lib/postTypes.js";

const TOOLBAR_HEIGHT = 44;

export default function Compose() {
  const router = useRouter();
  const client = useActiveClient();

  const [type, setType] = useState("Note");
  const [title, setTitle] = useState("");
  const [linkHref, setLinkHref] = useState("");
  const [linkPreview, setLinkPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [audience, setAudience] = useState("@public");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  // Article featuredImage — local URI from the picker, uploaded at submit
  // time. Reused later by Event composer (Phase 4) and the same upload
  // helper will power Media attachments (Phase 3).
  const [featuredImage, setFeaturedImage] = useState(null); // { uri, name, mimeType } | null

  async function pickFeaturedImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setFeaturedImage({
        uri: asset.uri,
        name: asset.fileName || `image-${Date.now()}.jpg`,
        mimeType: asset.mimeType || "image/jpeg",
      });
    } catch (e) {
      setError(e?.message || "Couldn't open the photo library.");
    }
  }

  // The Android window doesn't reliably resize for the keyboard under Expo
  // Go, so the content area is padded at the bottom by the measured keyboard
  // inset; keyboard down, it clears the nav-bar safe-area inset instead.
  const { isKeyboardUp, keyboardInset } = useKeyboardInset();
  const insets = useSafeAreaInsets();
  const bottomPad = isKeyboardUp ? keyboardInset : insets.bottom;

  // Stable idempotency key for this composing session.
  const dedupeKey = useRef(
    `m-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  ).current;

  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent: "",
  });
  const editorState = useBridgeState(editor);
  const handedOff = useRef(false);

  // Keyboard handoff: a hidden focusable TextInput (rendered below) auto-
  // focuses on mount and raises the soft keyboard. Once the editor's WebView
  // reports ready, move focus into it — the keyboard stays up across the
  // handoff since focus passes straight from one text input to another.
  useEffect(() => {
    if (editorState.isReady && !handedOff.current) {
      handedOff.current = true;
      editor.focus();
    }
  }, [editorState.isReady, editor]);

  // Link preview: when the user types/pastes a URL in the Link composer, fetch
  // its OG metadata from the server (debounced) and auto-populate the title
  // if blank. The image (if any) is held in state and sent as featuredImage.
  useEffect(() => {
    if (type !== "Link" || !client) {
      setLinkPreview(null);
      return;
    }
    const href = linkHref.trim();
    if (!href) {
      setLinkPreview(null);
      return;
    }
    try {
      new URL(href);
    } catch {
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setPreviewing(true);
      try {
        const meta = await client.feeds.getLinkPreview({ url: href });
        if (cancelled) return;
        setLinkPreview(meta || null);
        if (meta?.title && !title) setTitle(meta.title);

        // Auto-populate the editor body with the preview summary if the
        // editor is currently empty. (Matches the web composer's behaviour.)
        if (meta?.summary) {
          try {
            const current = (await editor.getText()) || "";
            if (!cancelled && !current.trim()) {
              const escaped = meta.summary
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\n+/g, "<br>");
              editor.setContent(`<p>${escaped}</p>`);
            }
          } catch {
            // editor not ready or unreachable — skip silently
          }
        }
      } catch {
        // Non-fatal — preview is enhancement-only.
      } finally {
        if (!cancelled) setPreviewing(false);
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // title intentionally not in deps: we only auto-populate it ONCE when
    // preview first arrives; subsequent edits stay the user's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkHref, type, client]);

  const composable = COMPOSABLE_TYPES.includes(type);

  async function handlePost() {
    setError(null);
    if (type === "Article" && !title.trim()) {
      setError("Articles need a title.");
      return;
    }
    if (type === "Link") {
      const href = linkHref.trim();
      if (!href) {
        setError("Add a link URL.");
        return;
      }
      try {
        new URL(href);
      } catch {
        setError("That doesn't look like a valid URL.");
        return;
      }
    }

    let markdown = "";
    try {
      markdown = pmToMarkdown(await editor.getJSON());
    } catch {
      setError("Couldn't read the editor content.");
      return;
    }
    // Notes require content; other types may have title/href/attachments only.
    if (type === "Note" && !markdown.trim()) {
      setError("Write something first.");
      return;
    }

    // Auto-target: if the Link's href is a Kowloon post URL, mark it as a
    // first-class share so the feed can render an embedded preview rather
    // than a generic link card. (See parseKowloonUrl.)
    let target;
    if (type === "Link") {
      const id = kowloonPostIdFromUrl(linkHref.trim());
      if (id) target = id;
    }

    setPosting(true);
    try {
      // Upload Article's featured image first (if any). The returned file ID
      // is what gets stored on the post — the server presigns a serve URL
      // at read time.
      let articleFeaturedFileId;
      if (type === "Article" && featuredImage?.uri) {
        try {
          const res = await uploadFile(client, {
            uri: featuredImage.uri,
            name: featuredImage.name,
            mimeType: featuredImage.mimeType,
            to: audience,
            generateThumbnail: true,
          });
          articleFeaturedFileId = res?.file?.id;
        } catch (e) {
          setError(`Featured image upload failed: ${e?.message || "unknown"}`);
          setPosting(false);
          return;
        }
      }

      await client.activities.createPost({
        type,
        title:
          type === "Article" || type === "Link"
            ? title.trim() || undefined
            : undefined,
        href: type === "Link" ? linkHref.trim() : undefined,
        target,
        // featuredImage source per type:
        //   Article — the just-uploaded file ID
        //   Link    — the OG image URL from the preview fetch (server
        //             downloads and stores it via proxyExternalImage)
        featuredImage:
          type === "Article"
            ? articleFeaturedFileId || undefined
            : type === "Link"
            ? linkPreview?.image || undefined
            : undefined,
        content: markdown.trim() || undefined,
        to: audience,
        dedupeKey,
      });
      router.back();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to post.");
      setPosting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["top"]}>
      {/* Content area shrinks to clear the keyboard. */}
      <View className="flex-1" style={{ paddingBottom: bottomPad }}>
        {/* Post type picker — across the top */}
        <PostTypeSelector value={type} onChange={setType} />

        {composable ? (
          <>
            {/* Hidden keyboard-kicker — a real focusable input that raises the
                soft keyboard on mount; the handoff effect above then moves
                focus into the editor once its WebView is ready. */}
            <TextInput
              autoFocus
              style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
            />

            {type === "Link" ? (
              <View className="px-4 pt-3">
                <TextInput
                  value={linkHref}
                  onChangeText={setLinkHref}
                  placeholder="https://example.com/article"
                  placeholderTextColor="rgba(26,26,32,0.35)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  className="border-2 border-base-300 bg-white px-3 py-3 font-ui text-base text-base-content"
                />
                {/* Link preview — auto-fetched from /preview when href changes */}
                {previewing || linkPreview ? (
                  <View className="flex-row mt-2 border-2 border-base-300 bg-white p-2">
                    {previewing ? (
                      <View className="w-16 h-16 mr-3 border-2 border-base-300 bg-base-200 items-center justify-center">
                        <ActivityIndicator />
                      </View>
                    ) : linkPreview?.image ? (
                      <Image
                        source={{ uri: linkPreview.image }}
                        className="w-16 h-16 mr-3 border-2 border-base-300 bg-base-200"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-16 h-16 mr-3 border-2 border-base-300 bg-base-200" />
                    )}
                    <View className="flex-1">
                      <Text className="font-ui text-[10px] uppercase tracking-[0.14em] text-base-content/45 mb-0.5">
                        Preview
                      </Text>
                      <Text
                        className="font-reading text-sm text-base-content"
                        numberOfLines={2}
                      >
                        {linkPreview?.title || (previewing ? "Loading…" : "Untitled")}
                      </Text>
                      {linkPreview?.summary ? (
                        <Text
                          className="font-ui text-xs text-base-content/55 mt-0.5"
                          numberOfLines={2}
                        >
                          {linkPreview.summary}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}

            {type === "Article" || type === "Link" ? (
              <View className="px-4 pt-3">
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={
                    type === "Article"
                      ? "Article title"
                      : "Optional title for this link"
                  }
                  placeholderTextColor="rgba(26,26,32,0.35)"
                  className="border-2 border-base-300 bg-white px-3 py-3 font-reading text-lg text-base-content"
                />
              </View>
            ) : null}

            {type === "Article" ? (
              <View className="px-4 pt-3">
                {featuredImage ? (
                  <View className="border-2 border-base-300 bg-white">
                    <Image
                      source={{ uri: featuredImage.uri }}
                      className="w-full h-40"
                      resizeMode="cover"
                    />
                    <Pressable
                      onPress={() => setFeaturedImage(null)}
                      hitSlop={6}
                      className="absolute top-1.5 right-1.5 bg-black/65 px-2 py-1"
                    >
                      <Text className="font-ui uppercase tracking-[0.14em] text-[10px] text-white">
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={pickFeaturedImage}
                    android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                    className="border-2 border-base-300 bg-white py-5 items-center"
                  >
                    <Text className="font-ui uppercase tracking-[0.14em] text-xs text-base-content/55">
                      + Add featured image
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : null}

            {error ? (
              <Text className="font-ui text-sm text-error px-4 pt-3">
                {error}
              </Text>
            ) : null}

            {/* Editor — bordered box: formatting toolbar on top (always
                visible, like the web composer), editing area filling below.
                `hidden={false}` overrides 10tap's keyboard-accessory hiding. */}
            <View className="flex-1 mx-4 mt-3 border-2 border-base-300">
              <View
                style={{ height: TOOLBAR_HEIGHT }}
                className="border-b-2 border-base-300"
              >
                <Toolbar editor={editor} hidden={false} />
              </View>
              <View className="flex-1">
                <RichText editor={editor} />
              </View>
            </View>

            {/* Audience + Cancel/Post — below the editor body */}
            <View className="flex-row items-stretch px-4 py-3">
              <View className="flex-1 mr-2">
                <AudienceSelector value={audience} onChange={setAudience} />
              </View>
              <Pressable
                onPress={() => router.back()}
                disabled={posting}
                className="border-2 border-base-content px-4 justify-center mr-2"
                android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              >
                <Text className="font-ui uppercase tracking-[0.14em] text-[11px] text-base-content">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handlePost}
                disabled={posting}
                className={`border-2 border-primary px-5 justify-center ${
                  posting ? "bg-primary/60" : "bg-primary"
                }`}
                android_ripple={{ color: "rgba(255,255,255,0.15)" }}
              >
                {posting ? (
                  <ActivityIndicator color="#FAF4E8" />
                ) : (
                  <Text className="font-ui uppercase tracking-[0.14em] text-[11px] text-primary-content">
                    Post
                  </Text>
                )}
              </Pressable>
            </View>
          </>
        ) : (
          /* Media / Link / Event — picker shows them, input UI not built yet */
          <View className="flex-1 px-8 items-center justify-center">
            <PostTypeIcon type={type} size={64} />
            <Text className="font-reading text-2xl text-base-content mt-4 mb-2">
              {POST_TYPES[type]?.label} posts
            </Text>
            <Text className="font-reading text-base text-base-content/60 text-center leading-6 mb-8">
              The {POST_TYPES[type]?.label.toLowerCase()} composer is coming in a
              later pass. For now you can post Notes and Articles.
            </Text>
            <Pressable
              onPress={() => setType("Note")}
              className="border-2 border-base-content px-5 py-2.5 mb-3"
              android_ripple={{ color: "rgba(0,0,0,0.06)" }}
            >
              <Text className="font-ui uppercase tracking-[0.14em] text-xs text-base-content">
                Write a Note instead
              </Text>
            </Pressable>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text className="font-ui uppercase tracking-[0.14em] text-xs text-base-content/50">
                Cancel
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
