// Post detail — the reading surface.
//
// Fetches the single post and renders its body as rich HTML, styled with the
// user's reading-typography prefs (font, size, line spacing, margins).

import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "../../src/components/posts/Avatar.jsx";
import { HtmlContent } from "../../src/components/HtmlContent.jsx";
import { Button } from "../../src/components/ui/Button.jsx";
import { Eyebrow } from "../../src/components/ui/Heading.jsx";
import { useActiveClient } from "../../src/lib/useActiveClient.js";
import { useTypography } from "../../src/lib/TypographyContext.js";
import { timeAgo } from "../../src/lib/timeAgo.js";

export default function PostDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const client = useActiveClient();
  const { resolved } = useTypography();

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
  const bodyHtml = post?.body || post?.summary || "";

  return (
    <SafeAreaView className="flex-1 bg-base-100">
      <ScrollView contentContainerStyle={{ paddingVertical: 24, paddingBottom: 48 }}>
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
            {/* Header — fixed chrome margins */}
            <View className="px-6">
              <Eyebrow>{post.type || "Post"}</Eyebrow>

              {post.title ? (
                <Text className="font-reading text-3xl text-base-content leading-tight mt-2 mb-3">
                  {post.title}
                </Text>
              ) : (
                <View className="mb-3" />
              )}

              <View className="flex-row items-center mt-1 mb-5">
                <Avatar actor={actor} size={40} baseUrl={client?.http?.baseUrl} />
                <View className="ml-3 flex-1">
                  <Text className="font-ui text-sm text-base-content">
                    {actor.name || actor.id}
                  </Text>
                  <Text className="font-ui text-xs text-base-content/50">
                    {actor.id} · {timeAgo(post.publishedAt || post.createdAt)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Body — rich HTML, reading-typography applied. Horizontal
                padding comes from the user's column-width preference. */}
            <View style={{ paddingHorizontal: resolved.paddingHorizontal }}>
              {bodyHtml ? (
                <HtmlContent
                  html={bodyHtml}
                  fonts={{
                    regular: resolved.regularFamily,
                    bold: resolved.boldFamily,
                    italic: resolved.italicFamily,
                  }}
                  fontSize={resolved.fontSize}
                  lineHeight={resolved.lineHeight}
                  selectable
                />
              ) : (
                <Text className="font-reading text-base text-base-content/50">
                  {post.textPreview || "No content."}
                </Text>
              )}
            </View>

            {/* Footer */}
            <View className="px-6">
              <View className="border-t-2 border-base-300 mt-6 pt-3 flex-row">
                <Text className="font-ui text-xs text-base-content/50 mr-5">
                  {post.replyCount || 0} replies
                </Text>
                <Text className="font-ui text-xs text-base-content/50">
                  {post.reactCount || 0} reactions
                </Text>
              </View>

              <Text className="font-ui text-xs text-base-content/40 mt-6 leading-5">
                Reactions and replies land in the next pass.
              </Text>

              <Button
                label="Back"
                variant="ghost"
                onPress={() => router.back()}
                className="mt-6"
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
