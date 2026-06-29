// Group detail — info, members preview, and the actions (View posts, Join/
// Leave/Request, owner Edit/Delete). The post feed itself lives on /feed
// with ?view=group:<id> — that's where "View posts" goes.

import { useCallback, useMemo, useState } from "react";
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
import {
  Inbox,
  LogIn,
  LogOut,
  MapPin,
  Pencil,
  Newspaper,
  Trash2,
} from "lucide-react-native";

import { Avatar } from "../../../src/components/posts/Avatar.jsx";
import { BackLink } from "../../../src/components/ui/BackLink.jsx";
import { Button } from "../../../src/components/ui/Button.jsx";
import { GroupAvatar } from "../../../src/components/groups/GroupAvatar.jsx";
import { useActiveClient } from "../../../src/lib/useActiveClient.js";
import {
  groupVisibilityLabel,
  joinNeedsApproval,
  rsvpPolicyLabel,
} from "../../../src/lib/groups.js";
import { selectActiveAccount } from "../../../src/state/accountsSlice.js";

function memberView(m) {
  return {
    id: m?.id,
    name: m?.name || m?.displayName || m?.id,
    icon: m?.icon || m?.profile?.icon || null,
  };
}

function isLocalToServer(userId, serverDomain) {
  if (!userId || !serverDomain) return false;
  return userId.endsWith(`@${serverDomain}`);
}

const MEMBERS_PREVIEW = 5;

export default function GroupDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const client = useActiveClient();
  const account = useSelector(selectActiveAccount);

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!client || !id) return;
    setLoading(true);
    setError(null);
    try {
      const [groupRes, membersRes] = await Promise.all([
        client.feeds.getGroup({ groupId: String(id) }),
        client.feeds
          .getGroupMembers({ groupId: String(id) })
          .catch(() => null),
      ]);
      setGroup(groupRes?.item || groupRes?.group || groupRes || null);
      const mlist =
        membersRes?.orderedItems ||
        membersRes?.items ||
        membersRes?.members ||
        [];
      setMembers(mlist.map(memberView));
    } catch (e) {
      setError(e?.message || "Couldn't load this group.");
    } finally {
      setLoading(false);
    }
  }, [client, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const ownerId = group?.actorId || group?.actor?.id;
  const isOwner = !!account?.id && ownerId === account.id;
  const isMember = useMemo(
    () => !!account?.id && members.some((m) => m.id === account.id),
    [members, account?.id]
  );
  const visibility = groupVisibilityLabel(group?.to, account?.server);
  const viewerIsLocal = isLocalToServer(account?.id, account?.server);
  const needsApproval = joinNeedsApproval(group?.rsvpPolicy, viewerIsLocal);

  async function handleJoin() {
    if (busy) return;
    setBusy(true);
    try {
      await client.activities.joinGroup({ groupId: String(id) });
      await load();
    } catch (e) {
      Alert.alert(
        needsApproval ? "Couldn't request to join" : "Couldn't join",
        e?.message || "Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    if (busy) return;
    Alert.alert(
      "Leave group?",
      `You'll stop seeing posts from "${group?.name}".`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await client.activities.leaveGroup({ groupId: String(id) });
              await load();
            } catch (e) {
              Alert.alert("Couldn't leave", e?.message || "Please try again.");
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }

  function confirmDelete() {
    Alert.alert(
      "Delete group?",
      `"${group?.name}" will be removed. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    if (busy) return;
    setBusy(true);
    try {
      await client.activities.deleteGroup({ groupId: String(id) });
      router.back();
    } catch (e) {
      Alert.alert("Couldn't delete", e?.message || "Please try again.");
      setBusy(false);
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
            <Text className="font-ui text-base text-error text-center mb-4">
              {error}
            </Text>
            <Button label="Back" variant="ghost" onPress={() => router.back()} />
          </View>
        ) : group ? (
          <>
            {/* Header */}
            <View className="px-5 pt-4 pb-5 border-b-2 border-base-300">
              <View className="flex-row items-center">
                <GroupAvatar group={group} size={60} baseUrl={account?.baseUrl} />
                <View className="flex-1 ml-4 min-w-0">
                  <Text className="font-ui text-2xl text-base-content leading-tight">
                    {group.name}
                  </Text>
                  <Text className="font-ui text-[11px] uppercase tracking-[0.16em] text-base-content/55 mt-1">
                    {visibility} · {rsvpPolicyLabel(group.rsvpPolicy)}
                    {typeof group.memberCount === "number"
                      ? ` · ${group.memberCount} ${
                          group.memberCount === 1 ? "member" : "members"
                        }`
                      : ""}
                  </Text>
                </View>
              </View>

              {group.description ? (
                <Text className="font-ui text-base text-base-content/80 leading-relaxed mt-4">
                  {group.description}
                </Text>
              ) : null}

              {group.location?.name ? (
                <View className="flex-row items-center mt-3">
                  <MapPin
                    size={13}
                    color="rgba(26,26,32,0.55)"
                    strokeWidth={1.75}
                  />
                  <Text className="font-ui text-[11px] uppercase tracking-[0.16em] text-base-content/55 ml-1.5 flex-1">
                    {group.location.name}
                  </Text>
                </View>
              ) : null}

              {/* Actions */}
              <View
                className="flex-row items-center mt-5 flex-wrap"
                style={{ gap: 10 }}
              >
                <Pressable
                  onPress={() =>
                    router.push(
                      `/feed?view=${encodeURIComponent(String(id))}`
                    )
                  }
                  android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                  className="flex-row items-center border-2 border-base-content px-3 py-2"
                >
                  <Newspaper
                    size={13}
                    color="rgba(26,26,32,0.85)"
                    strokeWidth={1.75}
                  />
                  <Text className="font-ui uppercase tracking-[0.14em] text-[11px] text-base-content ml-1.5">
                    View posts
                  </Text>
                </Pressable>

                {account?.id && !isOwner ? (
                  isMember ? (
                    <Pressable
                      onPress={handleLeave}
                      disabled={busy}
                      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                      className="flex-row items-center border-2 border-base-content px-3 py-2"
                    >
                      <LogOut
                        size={13}
                        color="rgba(26,26,32,0.85)"
                        strokeWidth={1.75}
                      />
                      <Text className="font-ui uppercase tracking-[0.14em] text-[11px] text-base-content ml-1.5">
                        {busy ? "…" : "Leave"}
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={handleJoin}
                      disabled={busy}
                      android_ripple={{ color: "rgba(0,0,0,0.08)" }}
                      className="flex-row items-center bg-primary border-2 border-primary px-3 py-2"
                    >
                      <LogIn size={13} color="#FAF4E8" strokeWidth={1.75} />
                      <Text className="font-ui uppercase tracking-[0.14em] text-[11px] text-primary-content ml-1.5">
                        {busy ? "…" : needsApproval ? "Request" : "Join"}
                      </Text>
                    </Pressable>
                  )
                ) : null}

                {isOwner ? (
                  <>
                    <Pressable
                      onPress={() =>
                        router.push(
                          `/group/${encodeURIComponent(String(id))}/pending`
                        )
                      }
                      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                      className="flex-row items-center border-2 border-base-content px-3 py-2"
                    >
                      <Inbox
                        size={13}
                        color="rgba(26,26,32,0.85)"
                        strokeWidth={1.75}
                      />
                      <Text className="font-ui uppercase tracking-[0.14em] text-[11px] text-base-content ml-1.5">
                        Pending
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        router.push(
                          `/group/${encodeURIComponent(String(id))}/edit`
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
                      disabled={busy}
                      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                      className="flex-row items-center border-2 border-error px-3 py-2"
                    >
                      <Trash2 size={13} color="#CC272E" strokeWidth={1.75} />
                      <Text className="font-ui uppercase tracking-[0.14em] text-[11px] text-error ml-1.5">
                        Delete
                      </Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            </View>

            {/* Members preview */}
            <View className="px-5 pt-5">
              <Text className="font-ui uppercase tracking-[0.18em] text-[11px] text-base-content/50 mb-3">
                Members{members.length ? ` (${members.length})` : ""}
              </Text>

              {members.length === 0 ? (
                <Text className="font-ui text-sm text-base-content/55 leading-6">
                  No members yet.
                </Text>
              ) : (
                <>
                  {members.slice(0, MEMBERS_PREVIEW).map((m) => (
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
                    </View>
                  ))}
                  {members.length > MEMBERS_PREVIEW ? (
                    <Text className="font-ui uppercase tracking-[0.16em] text-[11px] text-base-content/55 mt-3">
                      + {members.length - MEMBERS_PREVIEW} more
                    </Text>
                  ) : null}
                </>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
