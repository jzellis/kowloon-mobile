// CircleCard — a tappable row for a circle in a list. Icon + name + member
// count + visibility tag, editorial hard-edged styling.

import { Pressable, Text, View } from "react-native";

import { CircleAvatar } from "./CircleAvatar.jsx";
import { circleVisibilityLabel } from "../../lib/circles.js";

export function CircleCard({ circle, serverDomain, baseUrl, onPress }) {
  const visibility = circleVisibilityLabel(circle?.to, serverDomain);
  const memberCount = circle?.memberCount;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "rgba(0,0,0,0.05)" }}
      className="flex-row items-center px-5 py-4 border-b border-base-300 bg-base-100"
    >
      <CircleAvatar circle={circle} size={44} baseUrl={baseUrl} />
      <View className="flex-1 ml-3 min-w-0">
        <Text
          className="font-reading text-lg text-base-content leading-tight"
          numberOfLines={1}
        >
          {circle?.name}
        </Text>
        <View className="flex-row items-center mt-0.5">
          <Text className="font-ui text-[11px] uppercase tracking-[0.14em] text-base-content/55">
            {visibility}
          </Text>
          {typeof memberCount === "number" ? (
            <>
              <Text className="font-ui text-[11px] text-base-content/40 mx-1.5">
                ·
              </Text>
              <Text className="font-ui text-[11px] uppercase tracking-[0.14em] text-base-content/55">
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </Text>
            </>
          ) : null}
        </View>
        {circle?.summary ? (
          <Text
            className="font-reading text-xs text-base-content/70 leading-snug mt-1"
            numberOfLines={2}
          >
            {circle.summary}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
