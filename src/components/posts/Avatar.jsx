import { useState } from "react";
import { Image, Text, View } from "react-native";

// Circular user avatar — person = circle is universal convention.
// Falls back to a filled initial block when no icon is set or the image fails.
// `baseUrl` resolves server-relative icon paths; absolute URLs are used as-is.
export function Avatar({ actor, size = 38, baseUrl }) {
  const [failed, setFailed] = useState(false);
  const rawIcon = actor?.icon;
  const icon =
    rawIcon && !/^(https?|file):\/\//i.test(rawIcon) && baseUrl
      ? `${baseUrl.replace(/\/$/, "")}/${rawIcon.replace(/^\//, "")}`
      : rawIcon;
  const name = actor?.name || actor?.id || "?";
  const initial = String(name).replace(/^@/, "").charAt(0).toUpperCase() || "?";
  const radius = size / 2;

  if (icon && !failed) {
    return (
      <Image
        source={{ uri: icon }}
        onError={() => setFailed(true)}
        style={{ width: size, height: size, borderRadius: radius }}
        className="border-2 border-base-300 bg-base-200"
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: radius }}
      className="border-2 border-base-300 bg-secondary items-center justify-center"
    >
      <Text
        className="font-ui text-secondary-content"
        style={{ fontSize: Math.round(size * 0.42) }}
      >
        {initial}
      </Text>
    </View>
  );
}
