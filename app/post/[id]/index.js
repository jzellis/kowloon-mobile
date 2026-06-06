// Post detail — the reading surface with reactions + replies.
//
// Fetches the post and its replies, applies the user's reading typography to
// the body, and exposes the React + Reply actions inline.

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pencil, Trash2 } from "lucide-react-native";

import { Avatar } from "../../../src/components/posts/Avatar.jsx";
import { BackLink } from "../../../src/components/ui/BackLink.jsx";
import { Button } from "../../../src/components/ui/Button.jsx";
import { Eyebrow } from "../../../src/components/ui/Heading.jsx";
import { PostActionBar } from "../../../src/components/posts/PostActionBar.jsx";
import { PostBody } from "../../../src/components/posts/PostBody.jsx";
import { Reply } from "../../../src/components/posts/Reply.jsx";
import { ReplyComposer } from "../../../src/components/posts/ReplyComposer.jsx";
import { useActiveClient } from "../../../src/lib/useActiveClient.js";
import { useKeyboardInset } from "../../../src/lib/useKeyboardInset.js";
import { useTypography } from "../../../src/lib/TypographyContext.js";
import { timeAgo } from "../../../src/lib/timeAgo.js";

// Same accent palette as the feed card — keep these in sync.
const TYPE_BAR = {
  Note: "bg-post-note",
  Article: "bg-post-article",
  Media: "bg-post-media",
  Link: "bg-post-link",
  Event: "bg-post-event",
};
const TYPE_ACCENT = {
  Note: "text-post-note",
  Article: "text-post-article",
  Media: "text-post-media",
  Link: "text-post-link",
  Event: "text-post-event",
};

export default function PostDetail() {
  const router = useRouter();
  const { id, focusReply } = useLocalSearchParams();
  // `focusReply=1` is appended by PostActionBar when the user taps Reply
  // from a feed card — auto-focuses the composer and pops the keyboard once
  // the post loads.
  const shouldFocusReply = focusReply === "1" || focusReply === "true";
  const client = useActiveClient();
  const { resolved } = useTypography();

  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = client?.auth?.getUser?.() || null;

  const scrollRef = useRef(null);
  const { keyboardInset } = useKeyboardInset();

  // When the keyboard opens, slide the composer (at the bottom of the scroll
  // view) into view. Keep a small breathing margin above the keyboard.
  useEffect(() => {
    if (keyboardInset > 0 && scrollRef.current) {
      // setTimeout lets the contentContainer's padding update before we ask
      // the scroll view for its new max offset.
      const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
      return () => clearTimeout(t);
    }
  }, [keyboardInset]);

  const load = useCallback(async () => {
    if (!client || !id) return;
    setLoading(true);
    setError(null);
    try {
      const [postRes, repliesRes] = await Promise.all([
        client.feeds.getPost({ postId: String(id) }),
        client.feeds.getReplies({ postId: String(id) }).catch(() => null),
      ]);
      const doc = postRes?.post || postRes?.object || postRes;
      setPost(doc);
      setReplies(repliesRes?.orderedItems || repliesRes?.items || []);
    } catch (e) {
      setError(e?.message || "Couldn't load this post.");
    } finally {
      setLoading(false);
    }
  }, [client, id]);

  useEffect(() => {
    load();
  }, [load]);

  const actor = post?.actor || {};
  const ownerId = post?.actorId || post?.actor?.id;
  const isOwner = !!currentUser?.id && ownerId === currentUser.id;
  const type = post?.type || "Note";
  const typeBar = TYPE_BAR[type] || TYPE_BAR.Note;
  const typeAccent = TYPE_ACCENT[type] || TYPE_ACCENT.Note;
  const [deleting, setDeleting] = useState(false);

  function confirmDelete() {
    Alert.alert(
      "Delete post?",
      "This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: handleDelete },
      ],
      { cancelable: true }
    );
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await client.activities.deletePost({ postId: String(id) });
      router.back();
    } catch (e) {
      setDeleting(false);
      Alert.alert("Couldn't delete", e?.message || "Please try again.");
    }
  }

  const typography = {
    fonts: {
      regular: resolved.regularFamily,
      bold: resolved.boldFamily,
      italic: resolved.italicFamily,
    },
    fontSize: resolved.fontSize,
    lineHeight: resolved.lineHeight,
  };

  return (
    <SafeAreaView
      className="flex-1 bg-base-100"
      edges={keyboardInset > 0 ? ["top", "left", "right"] : ["top", "left", "right", "bottom"]}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 48 + keyboardInset }}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View className="py-20 items-center px-6">
            <Text className="font-reading text-base text-error text-center mb-4">
              {error}
            </Text>
            <Button label="Back" variant="ghost" onPress={() => router.back()} />
          </View>
        ) : post ? (
          <>
            {/* Type accent bar */}
            <View className={`h-[3px] ${typeBar}`} />

            <View className="px-5 pt-3">
              <BackLink />
            </View>

            {/* Header */}
            <View className="px-5 pt-4">
              <View className="flex-row items-center justify-between mb-3">
                <Eyebrow className={typeAccent}>{type}</Eyebrow>
                <Text className="font-ui text-xs text-base-content/50">
                  {timeAgo(post.publishedAt || post.createdAt)}
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  if (actor.id)
                    router.push(`/user/${encodeURIComponent(actor.id)}`);
                }}
                android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                className="flex-row items-center mb-5"
              >
                <Avatar actor={actor} size={40} baseUrl={client?.http?.baseUrl} />
                <View className="ml-3 flex-1">
                  <Text
                    className="font-ui text-sm font-bold text-base-content"
                    numberOfLines={1}
                  >
                    {actor.name || actor.id}
                  </Text>
                  <Text
                    className="font-ui text-xs text-base-content/55"
                    numberOfLines={1}
                  >
                    {actor.id}
                  </Text>
                </View>
              </Pressable>

            </View>

            {/* Body — typography-aware padding for the column width */}
            <View style={{ paddingHorizontal: resolved.paddingHorizontal }}>
              <PostBody post={post} typography={typography} />
            </View>

            {/* Action bar — reply / react / repost / share / bookmark */}
            <View className="px-5 pt-5">
              <View className="border-t-2 border-base-300 pt-4">
                <PostActionBar
                  post={post}
                  client={client}
                  currentUser={currentUser}
                  onReply={() => {
                    // Already on the detail page — scroll to the composer.
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }}
                  onReacted={load}
                />
              </View>

              {/* Owner actions */}
              {isOwner ? (
                <View className="flex-row items-center mt-4" style={{ gap: 8 }}>
                  <Pressable
                    onPress={() =>
                      router.push(
                        `/post/${encodeURIComponent(String(id))}/edit`
                      )
                    }
                    android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                    className="flex-row items-center border-2 border-base-content px-3 py-2"
                  >
                    <Pencil
                      size={13}
                      color="rgba(26,26,32,0.85)"
                      strokeWidth={1.75}
                    />
                    <Text className="font-ui uppercase tracking-[0.14em] text-[11px] text-base-content ml-1.5">
                      Edit
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={confirmDelete}
                    disabled={deleting}
                    android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                    className="flex-row items-center border-2 border-error px-3 py-2"
                  >
                    <Trash2 size={13} color="#CC272E" strokeWidth={1.75} />
                    <Text className="font-ui uppercase tracking-[0.14em] text-[11px] text-error ml-1.5">
                      {deleting ? "Deleting…" : "Delete"}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            {/* Replies */}
            <View className="px-5 pt-2">
              {replies.length > 0
                ? replies.map((reply) => (
                    <Reply
                      key={reply.id}
                      reply={reply}
                      client={client}
                      currentUserId={currentUser?.id}
                      onUpdated={(next) =>
                        setReplies((arr) =>
                          arr.map((r) => (r.id === next.id ? next : r))
                        )
                      }
                      onDeleted={(rid) =>
                        setReplies((arr) => arr.filter((r) => r.id !== rid))
                      }
                    />
                  ))
                : null}

              <ReplyComposer
                postId={String(id)}
                client={client}
                currentUser={
                  currentUser
                    ? {
                        id: currentUser.id,
                        name: currentUser.profile?.name,
                        icon: currentUser.profile?.icon,
                      }
                    : null
                }
                canReply={post.canReply}
                autoFocus={shouldFocusReply && !loading && !!post}
                onSubmitted={({ duplicated }) => {
                  if (!duplicated) load();
                }}
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
