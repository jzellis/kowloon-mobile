// Create a circle. Uploads the icon (if picked), creates the circle, then
// batch-adds any chosen members. Navigates to the new circle on success.

import { useState } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackLink } from "../../src/components/ui/BackLink.jsx";
import { CircleForm } from "../../src/components/circles/CircleForm.jsx";
import { useActiveClient } from "../../src/lib/useActiveClient.js";
import { uploadFile } from "../../src/lib/uploadFile.js";
import { extractCircleId } from "../../src/lib/circles.js";

export default function NewCircle() {
  const router = useRouter();
  const client = useActiveClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit({ name, description, to, iconAsset, members }) {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // 1. Upload a freshly-picked icon, if any.
      let iconUrl;
      if (iconAsset?.uri) {
        const up = await uploadFile(client, {
          uri: iconAsset.uri,
          name: iconAsset.name,
          mimeType: iconAsset.mimeType,
          to,
          generateThumbnail: true,
        });
        iconUrl = up?.file?.url;
      }

      // 2. Create the circle.
      const res = await client.activities.createCircle({
        name,
        description: description || undefined,
        icon: iconUrl || undefined,
        to,
      });
      const newId = extractCircleId(res);

      // 3. Batch-add members.
      if (newId && members.length) {
        await client.activities.addToCircle({ circleId: newId, members });
      }

      if (newId) {
        router.replace(`/circle/${encodeURIComponent(newId)}`);
      } else {
        router.back();
      }
    } catch (e) {
      setError(e?.message || "Couldn't create the circle.");
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["top", "left", "right"]}>
      <View className="px-5 pt-3 pb-3 border-b-2 border-base-content">
        <BackLink />
        <Text className="font-reading text-3xl text-base-content mt-2">
          New Circle
        </Text>
      </View>
      <CircleForm
        mode="create"
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </SafeAreaView>
  );
}
