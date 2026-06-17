// Tiny visibility indicator for a bookmark or folder. Renders an icon
// (and label, when not compact) reflecting the `to` audience. Kept here
// alongside BookmarkTree so the tree is self-contained.

import { Text, View } from "react-native";
import { Globe, Server, Users, Lock } from "lucide-react-native";

function describe(to) {
  if (!to || to === "@public") return { Icon: Globe, label: "Public" };
  if (typeof to === "string" && to.startsWith("@")) {
    return { Icon: Server, label: "Server" };
  }
  if (typeof to === "string" && to.startsWith("circle:")) {
    return { Icon: Users, label: "Circle" };
  }
  if (typeof to === "string" && to.startsWith("group:")) {
    return { Icon: Users, label: "Group" };
  }
  return { Icon: Lock, label: "Private" };
}

export function VisibilityChip({ to, compact = false }) {
  const { Icon, label } = describe(to);
  const size = compact ? 11 : 12;
  return (
    <View className="flex-row items-center">
      <Icon size={size} color="rgba(26,26,32,0.55)" strokeWidth={1.75} />
      {compact ? null : (
        <Text className="font-ui uppercase tracking-[0.14em] text-[10px] text-base-content/55 ml-1">
          {label}
        </Text>
      )}
    </View>
  );
}
