import { useState } from "react";
import { Image, Text, View } from "react-native";

// Square, hard-edged actor avatar — editorial, no rounding. Falls back to a
// filled initial block when the actor has no icon or the image fails to load.
// `baseUrl` resolves relative icon paths (the account's own profile icon may
// be server-relative); absolute icon URLs are used as-is.
export function Avatar({ actor, size = 38, baseUrl }) {
  const [failed, setFailed] = useState(false);
  const rawIcon = actor?.icon;
  const icon =
    rawIcon && !/^(https?|file):\/\//i.test(rawIcon) && baseUrl
      ? `${baseUrl.replace(/\/$/, "")}/${rawIcon.replace(/^\//, "")}`
      : rawIcon;
  const name = actor?.name || actor?.id || "?";
  const initial = String(name).replace(/^@/, "").charAt(0).toUpperCase() || "?";

  if (icon && !failed) {
    return (
      <Image
        source={{ uri: icon }}
        onError={() => setFailed(true)}
        style={{ width: size, height: size }}
        className="border-2 border-base-300 bg-base-200"
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size }}
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
