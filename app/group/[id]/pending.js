// Group moderation — pending join requests.
//
// Group admins approve or reject pending join requests here. The list comes
// from GET /groups/:id/pending (an admins-only endpoint we exposed on the
// server). Approve fires an Add activity; Reject fires a Reject activity.

import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, X } from "lucide-react-native";

import { Avatar } from "../../../src/components/posts/Avatar.jsx";
import { BackLink } from "../../../src/components/ui/BackLink.jsx";
import { Button } from "../../../src/components/ui/Button.jsx";
import { useActiveClient } from "../../../src/lib/useActiveClient.js";
import { selectActiveAccount } from "../../../src/state/accountsSlice.js";

export default function PendingRequests() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const client = useActiveClient();
  const account = useSelector(selectActiveAccount);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(
    async ({ isRefresh = false } = {}) => {
      if (!client || !id) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await client.feeds.http.get(
          `/groups/${encodeURIComponent(String(id))}/pending`
        );
        setItems(res?.pending || []);
      } catch (e) {
        // 403 here means "you're not an admin of this group" — surface plainly.
        setError(
          e?.status === 403
            ? "Only group admins can see pending requests."
            : e?.message || "Couldn't load pending requests."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [client, id]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function approve(userId) {
    if (busyId) return;
    setBusyId(userId);
    try {
      await client.activities.approveJoinRequest({
        groupId: String(id),
        userId,
      });
      setItems((arr) => arr.filter((u) => u.id !== userId));
    } catch (e) {
      Alert.alert("Couldn't approve", e?.message || "Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  function confirmReject(user) {
    Alert.alert(
      "Reject request?",
      `${user.name || user.id} won't be added to the group.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => reject(user.id),
        },
      ]
    );
  }

  async function reject(userId) {
    if (busyId) return;
    setBusyId(userId);
    try {
      await client.activities.rejectJoinRequest({
        groupId: String(id),
        userId,
      });
      setItems((arr) => arr.filter((u) => u.id !== userId));
    } catch (e) {
      Alert.alert("Couldn't reject", e?.message || "Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["top", "left", "right"]}>
      <View className="px-5 pt-3 pb-3 border-b-2 border-base-content">
        <BackLink />
        <Text className="font-ui text-3xl text-base-content mt-2">
          Pending Requests
        </Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load({ isRefresh: true })}
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View className="px-6 py-20 items-center">
            <Text className="font-ui text-base text-error text-center mb-4">
              {error}
            </Text>
            <Button label="Back" variant="ghost" onPress={() => router.back()} />
          </View>
        ) : items.length === 0 ? (
          <View className="px-6 py-20 items-center">
            <Text className="font-ui text-lg text-base-content/70 text-center mb-2">
              No pending requests.
            </Text>
            <Text className="font-ui text-sm text-base-content/55 text-center leading-6">
              When someone asks to join, they'll show up here.
            </Text>
          </View>
        ) : (
          items.map((u) => (
            <View
              key={u.id}
              className="flex-row items-center px-5 py-3 border-b border-base-300"
            >
              <Avatar actor={u} size={40} baseUrl={account?.baseUrl} />
              <View className="flex-1 ml-3 min-w-0">
                <Text
                  className="font-ui text-sm font-bold text-base-content"
                  numberOfLines={1}
                >
                  {u.name || u.id}
                </Text>
                <Text
                  className="font-ui text-xs text-base-content/55"
                  numberOfLines={1}
                >
                  {u.id}
                </Text>
              </View>
              <View className="flex-row ml-2" style={{ gap: 6 }}>
                <Pressable
                  onPress={() => approve(u.id)}
                  disabled={busyId === u.id}
                  android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                  className="flex-row items-center bg-primary border-2 border-primary px-3 py-2"
                >
                  {busyId === u.id ? (
                    <ActivityIndicator size="small" color="#FAF4E8" />
                  ) : (
                    <>
                      <Check size={13} color="#FAF4E8" strokeWidth={2} />
                      <Text className="font-ui uppercase tracking-[0.14em] text-[11px] text-primary-content ml-1.5">
                        Approve
                      </Text>
                    </>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => confirmReject(u)}
                  disabled={busyId === u.id}
                  android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                  className="flex-row items-center border-2 border-error px-3 py-2"
                >
                  <X size={13} color="#CC272E" strokeWidth={1.75} />
                  <Text className="font-ui uppercase tracking-[0.14em] text-[11px] text-error ml-1.5">
                    Reject
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
