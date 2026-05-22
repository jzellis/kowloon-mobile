// Compose a post — Note or Article.
//
// Both are text posts: one 10tap (TipTap-in-WebView) editor, with a title
// field added for Article. On submit we pull the editor's ProseMirror JSON,
// convert it to Markdown (the server stores Markdown source and renders the
// HTML itself), and createPost() through @kowloon/client.

import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RichText, Toolbar, useEditorBridge } from "@10play/tentap-editor";

import { SegmentedControl } from "../src/components/ui/SegmentedControl.jsx";
import { useActiveClient } from "../src/lib/useActiveClient.js";
import { pmToMarkdown } from "../src/lib/pmToMarkdown.js";
import { selectActiveAccount } from "../src/state/accountsSlice.js";

const TYPE_OPTIONS = [
  { value: "Note", label: "Note" },
  { value: "Article", label: "Article" },
];

export default function Compose() {
  const router = useRouter();
  const client = useActiveClient();
  const account = useSelector(selectActiveAccount);

  const [type, setType] = useState("Note");
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("@public");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  // Stable idempotency key for this composing session — survives a retry
  // after a failed submit so the server can dedupe a double-delivered post.
  const dedupeKey = useRef(
    `m-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  ).current;

  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent: "",
  });

  const serverAudience = account?.server ? `@${account.server}` : "@public";
  const audienceOptions = [
    { value: "@public", label: "Public" },
    { value: serverAudience, label: "Server" },
  ];

  async function handlePost() {
    setError(null);
    if (type === "Article" && !title.trim()) {
      setError("Articles need a title.");
      return;
    }

    let markdown = "";
    try {
      const doc = await editor.getJSON();
      markdown = pmToMarkdown(doc);
    } catch {
      setError("Couldn't read the editor content.");
      return;
    }
    if (!markdown.trim()) {
      setError("Write something first.");
      return;
    }

    setPosting(true);
    try {
      await client.activities.createPost({
        type,
        title: type === "Article" ? title.trim() : undefined,
        content: markdown,
        to: audience,
        dedupeKey,
      });
      // Pop back to the feed — its useFocusEffect refreshes, so the new post
      // appears at the top.
      router.back();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to post.");
      setPosting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["top"]}>
      {/* Top bar */}
      <View className="px-4 pt-1 pb-2 flex-row items-center justify-between border-b-2 border-base-content">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          disabled={posting}
        >
          <Text className="font-ui uppercase tracking-[0.14em] text-xs text-base-content/70">
            Cancel
          </Text>
        </Pressable>

        <View className="w-44">
          <SegmentedControl
            options={TYPE_OPTIONS}
            value={type}
            onChange={setType}
          />
        </View>

        <Pressable onPress={handlePost} hitSlop={8} disabled={posting}>
          {posting ? (
            <ActivityIndicator />
          ) : (
            <Text className="font-ui uppercase tracking-[0.14em] text-xs text-primary">
              Post
            </Text>
          )}
        </Pressable>
      </View>

      {/* Audience */}
      <View className="px-4 pt-3">
        <SegmentedControl
          options={audienceOptions}
          value={audience}
          onChange={setAudience}
        />
      </View>

      {/* Title — Article only */}
      {type === "Article" ? (
        <View className="px-4 pt-3">
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Article title"
            placeholderTextColor="rgba(26,26,32,0.35)"
            className="border-2 border-base-300 bg-base-100 px-3 py-3 font-reading text-lg text-base-content"
          />
        </View>
      ) : null}

      {error ? (
        <Text className="font-ui text-sm text-error px-4 pt-3">{error}</Text>
      ) : null}

      {/* Editor */}
      <View className="flex-1 mt-3 mx-4 border-2 border-base-300">
        <RichText editor={editor} />
      </View>

      {/* 10tap keyboard-aware toolbar */}
      <Toolbar editor={editor} />
    </SafeAreaView>
  );
}
