// Post detail — stub.
//
// Fetches the single post and shows the author, title and a plain-text
// rendering of the body. Full rich HTML rendering (and applying the user's
// reading-typography prefs) is the next brief — that's the screen where the
// react-native-render-html vs. custom-renderer decision gets made.

import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "../../src/components/posts/Avatar.jsx";
import { Button } from "../../src/components/ui/Button.jsx";
import { Eyebrow } from "../../src/components/ui/Heading.jsx";
import { useActiveClient } from "../../src/lib/useActiveClient.js";
import { timeAgo } from "../../src/lib/timeAgo.js";

function stripHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function PostDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const client = useActiveClient();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!client || !id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await client.feeds.getPost({ postId: String(id) });
        const doc = res?.post || res?.object || res;
        if (!cancelled) setPost(doc);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Couldn't load this post.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, id]);

  const actor = post?.actor || {};
  const body =
    stripHtml(post?.body) ||
    stripHtml(post?.summary) ||
    post?.textPreview ||
    "";

  return (
    <SafeAreaView className="flex-1 bg-base-100">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View className="py-20 items-center">
            <Text className="font-reading text-base text-error text-center mb-4">
              {error}
            </Text>
            <Button label="Back" variant="ghost" onPress={() => router.back()} />
          </View>
        ) : post ? (
          <>
            <Eyebrow>{post.type || "Post"}</Eyebrow>

            {post.title ? (
              <Text className="font-reading text-3xl text-base-content leading-tight mt-2 mb-3">
                {post.title}
              </Text>
            ) : (
              <View className="mb-3" />
            )}

            {/* Author */}
            <View className="flex-row items-center mt-1 mb-5">
              <Avatar actor={actor} size={40} />
              <View className="ml-3 flex-1">
                <Text className="font-ui text-sm text-base-content">
                  {actor.name || actor.id}
                </Text>
                <Text className="font-ui text-xs text-base-content/50">
                  {actor.id} · {timeAgo(post.publishedAt || post.createdAt)}
                </Text>
              </View>
            </View>

            {/* Body — plain text for now */}
            <Text className="font-reading text-base text-base-content leading-7">
              {body}
            </Text>

            <View className="border-t-2 border-base-300 mt-6 pt-3 flex-row">
              <Text className="font-ui text-xs text-base-content/50 mr-5">
                {post.replyCount || 0} replies
              </Text>
              <Text className="font-ui text-xs text-base-content/50">
                {post.reactCount || 0} reactions
              </Text>
            </View>

            <Text className="font-ui text-xs text-base-content/40 mt-6 leading-5">
              Rich formatting, reactions and replies land in the next pass.
            </Text>

            <Button
              label="Back"
              variant="ghost"
              onPress={() => router.back()}
              className="mt-6"
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
