// Circle detail — view a circle, its members, and (for the owner) manage it.
//
// Owner sees Edit / Delete and can remove members inline. Any logged-in user
// can copy the circle (copy-as-new or add its members to one of their own).

import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { Pencil, Trash2, X } from "lucide-react-native";

import { Avatar } from "../../../src/components/posts/Avatar.jsx";
import { BackLink } from "../../../src/components/ui/BackLink.jsx";
import { Button } from "../../../src/components/ui/Button.jsx";
import { CircleAvatar } from "../../../src/components/circles/CircleAvatar.jsx";
import { CopyCircleMenu } from "../../../src/components/circles/CopyCircleMenu.jsx";
import { useActiveClient } from "../../../src/lib/useActiveClient.js";
import { circleVisibilityLabel } from "../../../src/lib/circles.js";
import { selectActiveAccount } from "../../../src/state/accountsSlice.js";

function memberView(m) {
  return {
    id: m?.id,
    name: m?.name || m?.displayName || m?.id,
    icon: m?.icon || m?.profile?.icon || null,
  };
}

export default function CircleDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const client = useActiveClient();
  const account = useSelector(selectActiveAccount);

  const [circle, setCircle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const load = useCallback(async () => {
    if (!client || !id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await client.feeds.getCircle({ circleId: String(id) });
      setCircle(res?.item || res?.circle || res || null);
    } catch (e) {
      setError(e?.message || "Couldn't load this circle.");
    } finally {
      setLoading(false);
    }
  }, [client, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const ownerId = circle?.actorId || circle?.actor?.id;
  const isOwner = !!account?.id && ownerId === account.id;
  const members = Array.isArray(circle?.members)
    ? circle.members.map(memberView)
    : [];
  const visibility = circleVisibilityLabel(circle?.to, account?.server);

  function confirmDelete() {
    Alert.alert(
      "Delete circle?",
      `"${circle?.name}" will be removed. This can't be undone.`,
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
      await client.activities.deleteCircle({ circleId: String(id) });
      router.back();
    } catch (e) {
      setDeleting(false);
      Alert.alert("Couldn't delete", e?.message || "Please try again.");
    }
  }

  async function removeMember(memberId) {
    if (removingId) return;
    setRemovingId(memberId);
    try {
      await client.activities.removeFromCircle({
        circleId: String(id),
        memberId,
      });
      setCircle((c) =>
        c
          ? {
              ...c,
              members: (c.members || []).filter((m) => m.id !== memberId),
              memberCount: Math.max(0, (c.memberCount || 1) - 1),
            }
          : c
      );
    } catch (e) {
      Alert.alert("Couldn't remove member", e?.message || "Please try again.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-3">
          <BackLink />
        </View>

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
        ) : circle ? (
          <>
            {/* Header */}
            <View className="px-5 pt-4 pb-5 border-b-2 border-base-300">
              <View className="flex-row items-center">
                <CircleAvatar
                  circle={circle}
                  size={60}
                  baseUrl={account?.baseUrl}
                />
                <View className="flex-1 ml-4 min-w-0">
                  <Text className="font-reading text-2xl text-base-content leading-tight">
                    {circle.name}
                  </Text>
                  <Text className="font-ui text-[11px] uppercase tracking-[0.16em] text-base-content/55 mt-1">
                    {visibility}
                    {typeof circle.memberCount === "number"
                      ? ` · ${circle.memberCount} ${
                          circle.memberCount === 1 ? "member" : "members"
                        }`
                      : ""}
                  </Text>
                </View>
              </View>

              {circle.summary ? (
                <Text className="font-reading text-base text-base-content/80 leading-relaxed mt-4">
                  {circle.summary}
                </Text>
              ) : null}

              {/* Actions */}
              <View className="flex-row items-center mt-5" style={{ gap: 10 }}>
                {isOwner ? (
                  <>
                    <Pressable
                      onPress={() =>
                        router.push(
                          `/circle/${encodeURIComponent(String(id))}/edit`
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
                  </>
                ) : null}
                {account?.id ? (
                  <CopyCircleMenu circle={circle} />
                ) : null}
              </View>
            </View>

            {/* Members */}
            <View className="px-5 pt-5">
              <Text className="font-ui uppercase tracking-[0.18em] text-[11px] text-base-content/50 mb-3">
                {isOwner || members.length > 0
                  ? `Members${members.length ? ` (${members.length})` : ""}`
                  : "Members"}
              </Text>

              {members.length === 0 ? (
                <Text className="font-reading text-sm text-base-content/55 leading-6">
                  {isOwner
                    ? "No members yet. Edit the circle to add people."
                    : "This circle's members are private to its owner."}
                </Text>
              ) : (
                members.map((m) => (
                  <View
                    key={m.id}
                    className="flex-row items-center py-3 border-b border-base-300"
                  >
                    <Avatar actor={m} size={36} baseUrl={account?.baseUrl} />
                    <View className="flex-1 ml-3 min-w-0">
                      <Text
                        className="font-ui text-sm font-bold text-base-content"
                        numberOfLines={1}
                      >
                        {m.name}
                      </Text>
                      <Text
                        className="font-ui text-xs text-base-content/55"
                        numberOfLines={1}
                      >
                        {m.id}
                      </Text>
                    </View>
                    {isOwner ? (
                      <Pressable
                        onPress={() => removeMember(m.id)}
                        disabled={removingId === m.id}
                        hitSlop={8}
                        android_ripple={{
                          color: "rgba(0,0,0,0.06)",
                          borderless: true,
                        }}
                        className="ml-2 p-1"
                      >
                        {removingId === m.id ? (
                          <ActivityIndicator size="small" />
                        ) : (
                          <X
                            size={18}
                            color="rgba(26,26,32,0.45)"
                            strokeWidth={1.75}
                          />
                        )}
                      </Pressable>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
