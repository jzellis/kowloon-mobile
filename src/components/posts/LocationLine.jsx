// Geotag display — a single emoji + place-name line.
//
// Compact form (default): tiny uppercase eyebrow under the title / attribution.
// Prominent form: bigger, bolder; used for Events where the location is part of
// the event's core identity.

import { Text, View } from "react-native";

export function LocationLine({ location, prominent = false, className = "" }) {
  const name = location?.name;
  if (!name) return null;

  if (prominent) {
    return (
      <View className={`flex-row items-center mb-2 ${className}`}>
        <Text className="font-ui text-base text-base-content/70 mr-1.5">📍</Text>
        <Text
          className="font-ui text-base font-bold tracking-wide text-base-content flex-1"
          numberOfLines={2}
        >
          {name}
        </Text>
      </View>
    );
  }
  return (
    <View className={`flex-row items-center mb-2 ${className}`}>
      <Text className="font-ui text-[11px] text-base-content/55 mr-1">📍</Text>
      <Text
        className="font-ui text-[11px] uppercase tracking-[0.14em] text-base-content/55 flex-1"
        numberOfLines={1}
      >
        {name}
      </Text>
    </View>
  );
}
