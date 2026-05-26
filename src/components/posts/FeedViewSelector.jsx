// FeedViewSelector — pick what you're reading.
//
// Choices: Public (the public firehose), Server (server-only), or one of the
// user's circles. The trigger is the current view's title (large, tappable);
// tapping opens a bottom sheet picker, same shape as the composer's audience
// picker.
//
// Returns the actual feed view key:
//   "public"       — getServerPosts({ to: 'public' })
//   "server"       — getServerPosts({ to: 'server' })
//   "circle:<id>"  — getCirclePosts({ circleId })

import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

import { useActiveClient } from "../../lib/useActiveClient.js";
import { selectActiveAccount } from "../../state/accountsSlice.js";

export function FeedViewSelector({ value, onChange }) {
  const account = useSelector(selectActiveAccount);
  const client = useActiveClient();
  const [open, setOpen] = useState(false);
  const [circles, setCircles] = useState([]);

  const serverViews = useMemo(
    () => [
      {
        value: "public",
        label: "Public",
        summary: "Anyone, anywhere on the network.",
      },
      {
        value: "server",
        label: "Server",
        summary: `Members of ${account?.serverName || account?.server || "this server"}.`,
      },
    ],
    [account?.serverName, account?.server]
  );

  useEffect(() => {
    if (!client || !account?.id) return;
    let cancelled = false;
    client.feeds
      .getUserCircles({ userId: account.id })
      .then((res) => {
        const items = res?.orderedItems || res?.items || [];
        if (!cancelled) {
          setCircles(
            items.filter((c) => c?.id && c?.name && c?.type !== "System")
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [client, account?.id]);

  const currentLabel =
    serverViews.find((v) => v.value === value)?.label ||
    circles.find((c) => c.id === value)?.name ||
    "Public";

  function select(v) {
    onChange(v);
    setOpen(false);
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={6}
        className="flex-row items-center"
      >
        <Text
          className="font-reading text-2xl text-base-content mr-1.5"
          numberOfLines={1}
        >
          {currentLabel}
        </Text>
        <Text className="font-ui text-lg text-base-content/40">▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setOpen(false)}
        >
          <Pressable onPress={() => {}}>
            <SafeAreaView edges={["bottom"]} className="bg-base-100">
              <View className="border-t-2 border-base-content">
                <Text className="font-ui uppercase tracking-[0.18em] text-[11px] text-base-content/50 px-5 pt-4 pb-2">
                  Viewing
                </Text>
                <ScrollView className="max-h-96">
                  {serverViews.map((v) => (
                    <Row
                      key={v.value}
                      label={v.label}
                      summary={v.summary}
                      selected={value === v.value}
                      onPress={() => select(v.value)}
                    />
                  ))}

                  {circles.length > 0 ? (
                    <View className="border-t-2 border-base-300 mt-1 pt-1">
                      <Text className="font-ui uppercase tracking-[0.18em] text-[10px] text-base-content/40 px-5 py-2">
                        Your circles
                      </Text>
                      {circles.map((c) => (
                        <Row
                          key={c.id}
                          label={c.name}
                          summary={c.summary}
                          selected={value === c.id}
                          onPress={() => select(c.id)}
                        />
                      ))}
                    </View>
                  ) : null}
                </ScrollView>
              </View>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function Row({ label, summary, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "rgba(0,0,0,0.05)" }}
      className={`px-5 py-3 ${selected ? "bg-secondary" : ""}`}
    >
      <Text
        className={`font-ui uppercase tracking-[0.14em] text-xs ${
          selected ? "text-secondary-content" : "text-base-content"
        }`}
      >
        {label}
      </Text>
      {summary ? (
        <Text
          className={`font-reading text-xs mt-0.5 ${
            selected ? "text-secondary-content/70" : "text-base-content/45"
          }`}
        >
          {summary}
        </Text>
      ) : null}
    </Pressable>
  );
}
