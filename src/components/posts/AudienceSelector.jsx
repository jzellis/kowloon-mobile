// AudienceSelector — choose who a post is addressed to.
//
// Modeled on the web CircleSelector: Public / Server options plus the user's
// circles. The selected value is the actual `to` string the server expects:
// "@public", "@<domain>", or a circle ID. Single-select; opens as a bottom
// sheet so it works from the bottom of the composer.

import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

import { useActiveClient } from "../../lib/useActiveClient.js";
import { selectActiveAccount } from "../../state/accountsSlice.js";

export function AudienceSelector({ value, onChange }) {
  const account = useSelector(selectActiveAccount);
  const client = useActiveClient();
  const [open, setOpen] = useState(false);
  const [circles, setCircles] = useState([]);

  const serverTo = account?.server ? `@${account.server}` : "@public";

  const audienceOptions = useMemo(
    () => [
      {
        value: "@public",
        label: "Public",
        summary: "Anyone, anywhere on the network.",
      },
      {
        value: serverTo,
        label: "Server",
        summary: `Members of ${account?.serverName || account?.server || "this server"}.`,
      },
    ],
    [serverTo, account?.serverName, account?.server]
  );

  // Load the user's circles once we have a client.
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
    audienceOptions.find((a) => a.value === value)?.label ||
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
        className="flex-row items-center border-2 border-base-content px-3 py-2.5"
        android_ripple={{ color: "rgba(0,0,0,0.06)" }}
      >
        <Text className="font-ui uppercase tracking-[0.12em] text-[11px] text-base-content/50 mr-2">
          To
        </Text>
        <Text
          className="font-ui uppercase tracking-[0.12em] text-[11px] text-base-content flex-1"
          numberOfLines={1}
        >
          {currentLabel}
        </Text>
        <Text className="font-ui text-base-content/50 ml-1">▾</Text>
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
          {/* Inner Pressable swallows taps so they don't dismiss. */}
          <Pressable onPress={() => {}}>
            <SafeAreaView edges={["bottom"]} className="bg-base-100">
              <View className="border-t-2 border-base-content">
                <Text className="font-ui uppercase tracking-[0.18em] text-[11px] text-base-content/50 px-5 pt-4 pb-2">
                  Post audience
                </Text>
                <ScrollView className="max-h-96">
                  {audienceOptions.map((opt) => (
                    <Row
                      key={opt.value}
                      label={opt.label}
                      summary={opt.summary}
                      selected={value === opt.value}
                      onPress={() => select(opt.value)}
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
          className={`font-ui text-xs mt-0.5 ${
            selected ? "text-secondary-content/70" : "text-base-content/45"
          }`}
        >
          {summary}
        </Text>
      ) : null}
    </Pressable>
  );
}
