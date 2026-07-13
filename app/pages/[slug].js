// Page detail — server-authored content page (about, rules, etc.).
//
// Linked from the LeftDrawer's PagesMenu. Reading typography applies to the
// body the same way it does on a post detail.

import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookOpen, Tag } from "lucide-react-native";

import { Avatar } from "../../src/components/posts/Avatar.jsx";
import { AppHeader } from "../../src/components/nav/AppHeader.jsx";
import { Button } from "../../src/components/ui/Button.jsx";
import { Eyebrow } from "../../src/components/ui/Heading.jsx";
import { HtmlContent } from "../../src/components/HtmlContent.jsx";
import { useActiveClient } from "../../src/lib/useActiveClient.js";
import { useTypography } from "../../src/lib/TypographyContext.js";
import { timeAgo } from "../../src/lib/timeAgo.js";

// Resolve the page's `image` field to a displayable URL — handles file IDs
// (`file:abc@domain`), absolute /files/ paths, and full URLs.
function resolvePageImage(img, client) {
  if (!img) return null;
  if (typeof img !== "string") return null;
  if (img.startsWith("file:")) return client?.files?.serveUrl?.(img) || null;
  const m = img.match(/\/files\/(file:[^?#]+)/);
  if (m) return client?.files?.serveUrl?.(decodeURIComponent(m[1])) || img;
  if (/^https?:\/\//i.test(img)) return img;
  const baseUrl = client?.http?.baseUrl;
  if (baseUrl) return `${baseUrl.replace(/\/$/, "")}/${img.replace(/^\//, "")}`;
  return img;
}

export default function PageDetail() {
  const router = useRouter();
  const { slug } = useLocalSearchParams();
  const client = useActiveClient();
  const { resolved } = useTypography();

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!client || !slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await client.feeds.getPage({
        pageId: decodeURIComponent(String(slug)),
      });
      setPage(res?.item || res?.page || res || null);
    } catch (e) {
      setError(e?.message || "Couldn't load this page.");
    } finally {
      setLoading(false);
    }
  }, [client, slug]);

  useEffect(() => {
    load();
  }, [load]);

  const author = page?.actor || null;
  const imageSrc = resolvePageImage(page?.image, client);
  const updatedAt = page?.updatedAt && page.updatedAt !== page.createdAt
    ? page.updatedAt
    : null;

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
    <SafeAreaView className="flex-1 bg-base-100" edges={["left", "right"]}>
      <AppHeader back title={page?.title || page?.name} />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
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
        ) : page ? (
          <>
            {/* Header */}
            <View className="px-5 pt-5">
              <Eyebrow>Page</Eyebrow>
              <Text className="font-ui text-3xl text-base-content leading-tight mt-2 mb-3">
                {page.title || page.name}
              </Text>

              {imageSrc ? (
                <Image
                  source={{ uri: imageSrc }}
                  className="w-full h-64 mb-4 border-2 border-base-300 bg-base-200"
                  resizeMode="cover"
                />
              ) : null}

              {page.summary ? (
                <Text className="font-ui italic text-lg text-base-content/75 leading-snug mb-4">
                  {page.summary}
                </Text>
              ) : null}

              {/* Author + updated/created + word count */}
              <View className="flex-row items-center mb-3 border-b-2 border-base-300 pb-4">
                {author ? (
                  <>
                    <Avatar
                      actor={author}
                      size={36}
                      baseUrl={client?.http?.baseUrl}
                    />
                    <View className="ml-3 flex-1">
                      <Text
                        className="font-ui text-sm font-bold text-base-content"
                        numberOfLines={1}
                      >
                        {author.name || author.id}
                      </Text>
                      <Text
                        className="font-ui text-[11px] uppercase tracking-[0.14em] text-base-content/55"
                        numberOfLines={1}
                      >
                        {updatedAt
                          ? `Updated · ${timeAgo(updatedAt)}`
                          : timeAgo(page.createdAt || page.publishedAt)}
                      </Text>
                    </View>
                  </>
                ) : (
                  <View className="flex-1" />
                )}
                {page.wordCount > 0 ? (
                  <View className="flex-row items-center">
                    <BookOpen
                      size={12}
                      color="rgba(26,26,32,0.45)"
                      strokeWidth={1.75}
                    />
                    <Text className="font-ui text-[11px] uppercase tracking-[0.14em] text-base-content/45 ml-1.5">
                      {page.wordCount} words
                    </Text>
                  </View>
                ) : null}
              </View>

              {page.tags?.length > 0 ? (
                <View className="flex-row items-center flex-wrap mb-3">
                  <Tag
                    size={11}
                    color="rgba(26,26,32,0.45)"
                    strokeWidth={1.75}
                  />
                  {page.tags.map((tag) => (
                    <Text
                      key={tag}
                      className="font-ui text-[11px] uppercase tracking-[0.16em] text-base-content/55 ml-2"
                    >
                      {tag}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>

            {/* Body — typography-aware padding for column width */}
            <View
              style={{ paddingHorizontal: resolved.paddingHorizontal, paddingTop: 8 }}
            >
              {page.body ? (
                <HtmlContent
                  html={page.body}
                  fonts={typography.fonts}
                  fontSize={typography.fontSize}
                  lineHeight={typography.lineHeight}
                  selectable
                />
              ) : (
                <Text className="font-ui text-base text-base-content/50">
                  No content.
                </Text>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
