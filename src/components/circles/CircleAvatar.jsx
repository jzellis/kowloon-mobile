// CircleAvatar — square, hard-edged circle/group icon with a Users fallback.
// Falls back to the placeholder when no icon is set or the image fails to load.

import { useState } from "react";
import { Image, View } from "react-native";
import { Users } from "lucide-react-native";

import { resolveImageUrl } from "../../lib/resolveImageUrl.js";

export function CircleAvatar({ circle, size = 40, baseUrl }) {
  const [failed, setFailed] = useState(false);
  const icon = resolveImageUrl(circle?.icon, baseUrl);
  if (icon && !failed) {
    return (
      <Image
        source={{ uri: icon }}
        style={{ width: size, height: size }}
        className="border-2 border-base-300 bg-base-200"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View
      style={{ width: size, height: size }}
      className="border-2 border-base-300 bg-secondary items-center justify-center"
    >
      <Users
        size={Math.round(size * 0.5)}
        color="rgba(255,244,224,0.7)"
        strokeWidth={1.75}
      />
    </View>
  );
}
