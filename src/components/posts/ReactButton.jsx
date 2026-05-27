// ReactButton — emoji reaction picker for posts and replies.
//
// Tap the smiley → inline horizontal emoji row pops above the button.
// Long-press → bottom-sheet picker (room to grow once the server's emoji set
// expands beyond six). The inline row is enough for the default set; the
// sheet is a future expansion point.
//
// Emoji list is fetched from server settings once per session and cached
// module-level. On failure we fall back to a sensible default set.

import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PICKER_CELL = 44;

const DEFAULT_EMOJIS = [
  { emoji: "👍", name: "Like" },
  { emoji: "❤️", name: "Love" },
  { emoji: "😂", name: "Laugh" },
  { emoji: "😮", name: "Shocked" },
  { emoji: "😭", name: "Sad" },
  { emoji: "🤬", name: "Angry" },
];

let cachedEmojis = null;
let fetchPromise = null;
async function getEmojis(client) {
  if (cachedEmojis) return cachedEmojis;
  if (!fetchPromise) {
    fetchPromise = client.feeds
      .getServerInfo()
      .then((info) => {
        cachedEmojis = info?.settings?.reactEmojis?.length
          ? info.settings.reactEmojis
          : DEFAULT_EMOJIS;
        return cachedEmojis;
      })
      .catch(() => {
        cachedEmojis = DEFAULT_EMOJIS;
        return cachedEmojis;
      });
  }
  return fetchPromise;
}

export function ReactButton({ client, post, onReacted, size = "md" }) {
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [emojis, setEmojis] = useState(cachedEmojis ?? DEFAULT_EMOJIS);
  const [pending, setPending] = useState(false);
  const [count, setCount] = useState(post?.reactCount ?? 0);
  const [error, setError] = useState(null);
  const closeTimer = useRef(null);

  // Refresh local count when a different post is passed in (e.g. parent
  // refetched after a reaction landed).
  useEffect(() => {
    setCount(post?.reactCount ?? 0);
  }, [post?.id, post?.reactCount]);

  useEffect(() => {
    if (!client || cachedEmojis) return;
    let cancelled = false;
    getEmojis(client).then((list) => {
      if (!cancelled) setEmojis(list);
    });
    return () => {
      cancelled = true;
    };
  }, [client]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  async function react(emoji, name) {
    if (!client || pending) return;
    setOpen(false);
    setSheetOpen(false);
    setPending(true);
    setError(null);
    // Optimistic bump — server returns { status: 'already_reacted' } when the
    // same user already reacted with the same emoji, in which case we revert.
    let bumped = false;
    setCount((c) => {
      bumped = true;
      return c + 1;
    });
    try {
      const res = await client.activities.react({
        postId: post.id,
        emoji,
        name: name || emoji,
      });
      if (res?.result?.status === "already_reacted" && bumped) {
        setCount((c) => Math.max(0, c - 1));
      }
      onReacted?.(res);
    } catch (e) {
      if (bumped) setCount((c) => Math.max(0, c - 1));
      setError(e?.message || "Reaction failed.");
    } finally {
      setPending(false);
    }
  }

  const fontSize = size === "sm" ? 14 : 18;
  const countSize = size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <View>
      <View className="relative">
        <Pressable
          onPress={() => setOpen((o) => !o)}
          onLongPress={() => {
            setOpen(false);
            setSheetOpen(true);
          }}
          disabled={pending}
          hitSlop={8}
          android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
          className="flex-row items-center"
        >
          <Text style={{ fontSize }} className="text-base-content/55">
            😊
          </Text>
          {count > 0 ? (
            <Text className={`font-ui ${countSize} text-base-content/55 ml-1.5`}>
              {count}
            </Text>
          ) : null}
        </Pressable>

        {open ? (
          <View
            // Explicit fixed width — RN's absolute layout sometimes clips a
            // flex-row picker behind the relative parent's bounding box,
            // hiding emojis past the right edge. Sizing the box and each
            // cell deterministically dodges the issue.
            style={{
              position: "absolute",
              bottom: "100%",
              left: -4,
              marginBottom: 8,
              flexDirection: "row",
              width: emojis.length * PICKER_CELL,
              elevation: 6,
              zIndex: 10,
            }}
            className="border-2 border-primary bg-base-100"
          >
            {emojis.map(({ emoji, name }) => (
              <Pressable
                key={name}
                onPress={() => react(emoji, name)}
                android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                style={{ width: PICKER_CELL }}
                className="items-center justify-center py-2"
              >
                <Text style={{ fontSize: 22, lineHeight: 26 }}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {error ? (
        <Text className="font-ui text-[11px] text-error mt-1">{error}</Text>
      ) : null}

      <Modal
        visible={sheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSheetOpen(false)}
        statusBarTranslucent
      >
        <View className="flex-1 justify-end">
          <Pressable
            onPress={() => setSheetOpen(false)}
            style={StyleSheet.absoluteFill}
            className="bg-black/40"
          />
          <SafeAreaView edges={["bottom"]} className="bg-base-100">
            <View className="border-t-2 border-base-content">
              <Text className="font-ui uppercase tracking-[0.18em] text-[11px] text-base-content/50 px-5 pt-4 pb-3">
                React
              </Text>
              <View className="flex-row flex-wrap px-3 pb-4">
                {emojis.map(({ emoji, name }) => (
                  <Pressable
                    key={name}
                    onPress={() => react(emoji, name)}
                    android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                    className="items-center w-1/4 py-3"
                  >
                    <Text style={{ fontSize: 32 }}>{emoji}</Text>
                    <Text className="font-ui text-[10px] uppercase tracking-[0.14em] text-base-content/55 mt-1">
                      {name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {pending ? (
        <View
          pointerEvents="none"
          className="absolute"
          style={{ top: -2, left: -2 }}
        >
          <ActivityIndicator size="small" />
        </View>
      ) : null}
    </View>
  );
}
