// CircleAvatar — hexagon-shaped icon for circles and groups.
// Hexes are the brand mark for "circle of people" objects; user avatars are circles.

import { Users } from "lucide-react-native";
import { HexAvatar } from "../ui/HexAvatar.jsx";
import { resolveImageUrl } from "../../lib/resolveImageUrl.js";

export function CircleAvatar({ circle, size = 40, baseUrl }) {
  const icon = resolveImageUrl(circle?.icon, baseUrl);
  return (
    <HexAvatar
      uri={icon}
      size={size}
      fallbackColor="#393B7A"
      fallback={
        <Users
          size={Math.round(size * 0.45)}
          color="rgba(250,244,232,0.8)"
          strokeWidth={1.75}
        />
      }
    />
  );
}
