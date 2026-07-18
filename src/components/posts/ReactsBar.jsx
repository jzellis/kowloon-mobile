// ReactsBar — a read-only summary of a post's reactions, grouped by emoji with
// counts (e.g. "👍 5   ❤️ 2   🤬 12"). Shown on the post detail. Adding/changing
// your own reaction is handled by the ReactButton, not here.

import { Text, View } from "react-native";

export function ReactsBar({ reactCounts }) {
  if (!Array.isArray(reactCounts) || reactCounts.length === 0) return null;
  return (
    <View
      className="flex-row flex-wrap items-center px-5 py-3"
      style={{ gap: 16 }}
    >
      {reactCounts.map(({ emoji, count }) => (
        <View key={emoji} className="flex-row items-center">
          <Text style={{ fontSize: 16, lineHeight: 20 }}>{emoji}</Text>
          <Text className="font-ui text-sm text-base-content/70 ml-1.5">
            {count}
          </Text>
        </View>
      ))}
    </View>
  );
}
