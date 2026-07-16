// Post edit — focused on the fields people actually fix after posting:
// body, title (for non-Note types), and Event start/end times. Author-only.
//
// Out of scope for now: changing audience, attachments, featured image, href,
// or post type. Those would land in a heavier compose-style screen later.

import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

import { AppHeader } from "../../../src/components/nav/AppHeader.jsx";
import { Button } from "../../../src/components/ui/Button.jsx";
import { DateTimeField } from "../../../src/components/posts/DateTimeField.jsx";
import { useActiveClient } from "../../../src/lib/useActiveClient.js";
import { useKeyboardInset } from "../../../src/lib/useKeyboardInset.js";
import { selectActiveAccount } from "../../../src/state/accountsSlice.js";

const pad = (n) => String(n).padStart(2, "0");

// Split an ISO datetime into the YYYY-MM-DD / HH:MM parts the DateTimeField expects.
function splitDateTime(iso) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}

function joinDateTime(date, time) {
  if (!date) return undefined;
  return time ? `${date}T${time}` : date;
}

function FieldLabel({ children }) {
  return (
    <Text className="font-ui uppercase tracking-[0.16em] text-[11px] text-base-content/55 mb-1.5">
      {children}
    </Text>
  );
}

export default function EditPost() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const client = useActiveClient();
  const account = useSelector(selectActiveAccount);
  const { keyboardInset } = useKeyboardInset();
  const insets = useSafeAreaInsets();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  const load = useCallback(async () => {
    if (!client || !id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await client.feeds.getPost({ postId: String(id) });
      const doc = res?.post || res?.object || res;
      setPost(doc);
      setTitle(doc?.title || doc?.name || "");
      // Server stores the editable markdown source at source.content; body is
      // the rendered HTML. We edit the source.
      setContent(doc?.source?.content || "");
      if (doc?.event?.startDate || doc?.startTime) {
        const s = splitDateTime(doc.event?.startDate || doc.startTime);
        setStartDate(s.date);
        setStartTime(s.time);
      }
      if (doc?.event?.endDate || doc?.endTime) {
        const e = splitDateTime(doc.event?.endDate || doc.endTime);
        setEndDate(e.date);
        setEndTime(e.time);
      }
    } catch (e) {
      setLoadError(e?.message || "Couldn't load this post.");
    } finally {
      setLoading(false);
    }
  }, [client, id]);

  useEffect(() => {
    load();
  }, [load]);

  const type = post?.type || "Note";
  const ownerId = post?.actorId || post?.actor?.id;
  const isOwner = !!account?.id && ownerId === account.id;
  const hasTitleField = type !== "Note";
  const isEvent = type === "Event";

  async function handleSubmit() {
    if (submitting) return;
    const trimmedContent = content.trim();
    const trimmedTitle = title.trim();
    if (!trimmedContent && !(hasTitleField && trimmedTitle) && !isEvent) {
      setError("There's nothing to save.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updates = { content: trimmedContent };
      if (hasTitleField) updates.title = trimmedTitle || "";
      if (isEvent) {
        updates.startTime = joinDateTime(startDate, startTime);
        updates.endTime = joinDateTime(endDate, endTime) || "";
      }
      await client.activities.updatePost({
        postId: String(id),
        updates,
      });
      router.back();
    } catch (e) {
      setError(e?.message || "Couldn't save changes.");
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["left", "right"]}>
      <AppHeader back title={`Edit ${type}`} />

      {loading ? (
        <View className="py-20 items-center">
          <ActivityIndicator />
        </View>
      ) : loadError ? (
        <View className="py-20 items-center px-6">
          <Text className="font-ui text-base text-error text-center mb-4">
            {loadError}
          </Text>
          <Button label="Back" variant="ghost" onPress={() => router.back()} />
        </View>
      ) : !isOwner ? (
        <View className="py-20 items-center px-6">
          <Text className="font-ui text-base text-base-content/70 text-center mb-4">
            You can only edit your own posts.
          </Text>
          <Button label="Back" variant="ghost" onPress={() => router.back()} />
        </View>
      ) : post ? (
        <>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: 20,
              paddingBottom: 20 + keyboardInset,
            }}
          >
            {hasTitleField ? (
              <View className="mb-5">
                <FieldLabel>Title</FieldLabel>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={`${type} title`}
                  placeholderTextColor="rgba(26,26,32,0.35)"
                  className="  bg-white px-3 py-2.5 font-ui text-base text-base-content"
                />
              </View>
            ) : null}

            <View className="mb-5">
              <FieldLabel>{type === "Note" ? "Body" : "Content"}</FieldLabel>
              <TextInput
                value={content}
                onChangeText={setContent}
                multiline
                placeholder="Write your post…"
                placeholderTextColor="rgba(26,26,32,0.35)"
                className="  bg-white px-3 py-2.5 font-ui text-base text-base-content"
                style={{ minHeight: 200, textAlignVertical: "top" }}
              />
            </View>

            {isEvent ? (
              <>
                <View className="mb-3">
                  <DateTimeField
                    label="Starts"
                    dateValue={startDate}
                    timeValue={startTime}
                    onDateChange={setStartDate}
                    onTimeChange={setStartTime}
                  />
                </View>
                <View className="mb-5">
                  <DateTimeField
                    label="Ends (optional)"
                    dateValue={endDate}
                    timeValue={endTime}
                    onDateChange={setEndDate}
                    onTimeChange={setEndTime}
                  />
                </View>
              </>
            ) : null}

            {error ? (
              <Text className="font-ui text-xs text-error mb-3">{error}</Text>
            ) : null}
          </ScrollView>

          <View
            className="flex-row items-center justify-end px-5 pt-3  "
            style={{
              paddingBottom: (keyboardInset > 0 ? 0 : insets.bottom) + 12,
            }}
          >
            <Pressable
              onPress={() => router.back()}
              hitSlop={6}
              className="px-4 py-2.5 mr-2"
            >
              <Text className="font-ui uppercase tracking-[0.16em] text-[11px] text-base-content/55">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              android_ripple={{ color: "rgba(0,0,0,0.08)" }}
              className={`flex-row items-center px-5 py-2.5 bg-primary ${
                submitting ? "opacity-40" : ""
              }`}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FAF4E8" />
              ) : (
                <Text className="font-ui uppercase tracking-[0.16em] text-[11px] text-primary-content">
                  Save Changes
                </Text>
              )}
            </Pressable>
          </View>
        </>
      ) : null}
    </SafeAreaView>
  );
}
