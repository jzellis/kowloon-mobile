// Post detail — the reading surface with reactions + replies.
//
// Fetches the post and its replies, applies the user's reading typography to
// the body, and exposes the React + Reply actions inline.

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "../../../src/components/posts/Avatar.jsx";
import { AppHeader } from "../../../src/components/nav/AppHeader.jsx";
import { Button } from "../../../src/components/ui/Button.jsx";
import { Eyebrow } from "../../../src/components/ui/Heading.jsx";
import { PostActionBar } from "../../../src/components/posts/PostActionBar.jsx";
import { PostBody } from "../../../src/components/posts/PostBody.jsx";
import { ReactsBar } from "../../../src/components/posts/ReactsBar.jsx";
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

  // Refresh just the replies list, WITHOUT toggling the top-level `loading`
  // state — a full load() collapses the screen to a spinner and resets scroll
  // to the top. Used after posting a reply so we can land on the new reply.
  // Reconcile with the server WITHOUT dropping a just-posted reply that the read
  // path hasn't caught up to yet — a full replace made new replies vanish until
  // you left and re-entered (#66). Keep any still-pending optimistic replies the
  // server list doesn't yet contain (matched by author + content).
  const reconcileReplies = useCallback(async () => {
    if (!client || !id) return;
    try {
      const res = await client.feeds.getReplies({ postId: String(id) });
      const server = res?.orderedItems || res?.items || [];
      const contentOf = (r) => String(r?.body || r?.source?.content || "").trim();
      setReplies((prev) => {
        const seen = new Set(server.map((r) => `${r.actorId}|${contentOf(r)}`));
        const stillPending = prev.filter(
          (r) => r.__optimistic && !seen.has(`${r.actorId}|${contentOf(r)}`)
        );
        return [...server, ...stillPending];
      });
    } catch {
      // keep the existing replies on a transient error
    }
  }, [client, id]);

  const actor = post?.actor || {};
  const type = post?.type || "Note";
  const typeBar = TYPE_BAR[type] || TYPE_BAR.Note;
  const typeAccent = TYPE_ACCENT[type] || TYPE_ACCENT.Note;

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
      edges={keyboardInset > 0 ? ["left", "right"] : ["left", "right", "bottom"]}
    >
      <AppHeader back title="Post" />
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
            <Text className="font-ui text-base text-error text-center mb-4">
              {error}
            </Text>
            <Button label="Back" variant="ghost" onPress={() => router.back()} />
          </View>
        ) : post ? (
          <>
            {/* Type accent bar */}
            <View className={`h-[3px] ${typeBar}`} />

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

            {/* Reactions summary (read-only) */}
            <ReactsBar reactCounts={post.reactCounts} />

            {/* Action bar — reply / react / repost / share / bookmark / more */}
            <View className="px-5 pt-5">
              <View className="  pt-4">
                <PostActionBar
                  post={post}
                  client={client}
                  currentUser={currentUser}
                  onReply={() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }}
                  onReacted={load}
                  onDeleted={() => router.back()}
                />
              </View>
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
                : (
                  <Text className="font-ui text-sm text-base-content/40 py-4">
                    No replies yet. Be the first.
                  </Text>
                )}

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
                onSubmitted={({ duplicated, content }) => {
                  if (duplicated) return;
                  // Show the reply instantly (optimistic), then reconcile with
                  // the server a beat later — the read path lags the write, so a
                  // plain refetch returned before the reply was queryable (#66).
                  const optimistic = {
                    id: `pending-${Date.now()}`,
                    __optimistic: true,
                    actorId: currentUser?.id,
                    actor: {
                      id: currentUser?.id,
                      name: currentUser?.profile?.name,
                      icon: currentUser?.profile?.icon,
                    },
                    source: { content },
                    body: "",
                    publishedAt: new Date().toISOString(),
                  };
                  setReplies((arr) => [...arr, optimistic]);
                  setTimeout(
                    () => scrollRef.current?.scrollToEnd({ animated: true }),
                    120
                  );
                  // Reconcile a couple of times to absorb the read-lag window.
                  setTimeout(() => reconcileReplies(), 800);
                  setTimeout(() => reconcileReplies(), 2500);
                }}
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
