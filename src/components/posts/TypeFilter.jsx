// TypeFilter — icon-only post-type selector. No labels, no borders.
//
// Default (all visible): every icon shows in its type color.
// Tap an icon to deselect it — it grays out, others stay colored.
// Tap it again to restore it.
// A small × appears when any type is deselected — tap to restore all.

import { Pressable, View } from "react-native";
import { X } from "lucide-react-native";

import { PostTypeIcon } from "./PostTypeIcon.jsx";
import { POST_TYPE_NAMES, POST_TYPES } from "../../lib/postTypes.js";

const INK_DIM = "rgba(26,26,32,0.15)";

export function TypeFilter({ activeTypes = [], onSetTypes }) {
  const isAll = !activeTypes || activeTypes.length === 0;

  function handlePress(type) {
    if (isAll) {
      // All currently visible — deselect this one, keep all others
      onSetTypes(POST_TYPE_NAMES.filter((t) => t !== type));
    } else if (activeTypes.includes(type)) {
      // Deselect — but don't allow deselecting the last one
      const next = activeTypes.filter((t) => t !== type);
      onSetTypes(next.length === 0 ? [] : next);
    } else {
      // Reselect — add back; if now all selected, normalize to []
      const next = [...activeTypes, type];
      onSetTypes(next.length === POST_TYPE_NAMES.length ? [] : next);
    }
  }

  return (
    <View className="flex-row items-center" style={{ gap: 14 }}>
      {POST_TYPE_NAMES.map((type) => {
        const active = isAll || activeTypes.includes(type);
        const color = active ? POST_TYPES[type].color : INK_DIM;
        return (
          <Pressable key={type} onPress={() => handlePress(type)} hitSlop={8}>
            <PostTypeIcon type={type} size={17} color={color} />
          </Pressable>
        );
      })}

      {!isAll && (
        <Pressable onPress={() => onSetTypes([])} hitSlop={8}>
          <X size={13} color="rgba(26,26,32,0.35)" strokeWidth={2.5} />
        </Pressable>
      )}
    </View>
  );
}
