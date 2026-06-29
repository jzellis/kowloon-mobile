// CircleHeartButton — heart/like a public circle.
// Optimistic: toggles locally and fires react() in background.
// circle.userReacted seeds the initial state from the browse endpoint.

import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export function CircleHeartButton({ circle, client }) {
  const [reacted, setReacted] = useState(circle?.userReacted ?? false);
  const [count, setCount] = useState(circle?.reactCount ?? 0);
  const [busy, setBusy] = useState(false);

  async function press() {
    if (busy || reacted || !client) return;
    setBusy(true);
    try {
      const res = await client.activities.react({
        postId: circle.id,
        emoji: "❤️",
        name: "heart",
      });
      if (res?.result?.status !== "already_reacted") {
        setCount((c) => c + 1);
      }
      setReacted(true);
    } catch {}
    setBusy(false);
  }

  return (
    <Pressable
      onPress={press}
      disabled={busy || reacted}
      hitSlop={10}
      className="flex-row items-center gap-1 py-1 px-1"
    >
      <Text
        className={`text-base leading-none ${
          reacted ? "text-error" : "text-base-content/30"
        }`}
      >
        {reacted ? "♥" : "♡"}
      </Text>
      {count > 0 ? (
        <Text className="font-ui text-xs text-base-content/40">{count}</Text>
      ) : null}
    </Pressable>
  );
}
