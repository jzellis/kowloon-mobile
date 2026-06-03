// Create a group. Uploads the icon (if picked), creates the group, and
// navigates to it on success.

import { useState } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackLink } from "../../src/components/ui/BackLink.jsx";
import { GroupForm } from "../../src/components/groups/GroupForm.jsx";
import { useActiveClient } from "../../src/lib/useActiveClient.js";
import { uploadFile } from "../../src/lib/uploadFile.js";

function extractGroupId(res) {
  return (
    res?.createdId ||
    res?.created?.id ||
    res?.result?.created?.id ||
    res?.result?.id ||
    res?.activity?.object?.id ||
    res?.id ||
    null
  );
}

export default function NewGroup() {
  const router = useRouter();
  const client = useActiveClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit({
    name,
    description,
    location,
    to,
    rsvpPolicy,
    iconAsset,
  }) {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
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

      const res = await client.activities.createGroup({
        name,
        description: description || undefined,
        location: location || undefined,
        icon: iconUrl || undefined,
        to,
        membershipPolicy: rsvpPolicy,
      });
      const newId = extractGroupId(res);

      if (newId) {
        router.replace(`/group/${encodeURIComponent(newId)}`);
      } else {
        router.back();
      }
    } catch (e) {
      setError(e?.message || "Couldn't create the group.");
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["top", "left", "right"]}>
      <View className="px-5 pt-3 pb-3 border-b-2 border-base-content">
        <BackLink />
        <Text className="font-reading text-3xl text-base-content mt-2">
          New Group
        </Text>
      </View>
      <GroupForm
        mode="create"
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </SafeAreaView>
  );
}
