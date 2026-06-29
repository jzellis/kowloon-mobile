// TypeFilter — icon-only post-type selector. No labels, no borders.
//
// isAll (nothing selected): all icons shown in muted ink — neutral, unobtrusive.
// Some active: active icons show their type color; inactive icons go very dim.
// A small × appears at the right edge to clear all filters when any are active.

import { Pressable, View } from "react-native";
import { X } from "lucide-react-native";

import { PostTypeIcon } from "./PostTypeIcon.jsx";
import { POST_TYPE_NAMES, POST_TYPES } from "../../lib/postTypes.js";

const INK_MUTED = "rgba(26,26,32,0.30)";
const INK_DIM   = "rgba(26,26,32,0.15)";

export function TypeFilter({ activeTypes = [], onToggle, onClear }) {
  const isAll = !activeTypes || activeTypes.length === 0;

  return (
    <View className="flex-row items-center" style={{ gap: 14 }}>
      {POST_TYPE_NAMES.map((type) => {
        const active = activeTypes.includes(type);
        const color = isAll ? INK_MUTED : active ? POST_TYPES[type].color : INK_DIM;
        return (
          <Pressable key={type} onPress={() => onToggle(type)} hitSlop={8}>
            <PostTypeIcon type={type} size={17} color={color} />
          </Pressable>
        );
      })}

      {!isAll && (
        <Pressable onPress={onClear} hitSlop={8}>
          <X size={13} color="rgba(26,26,32,0.35)" strokeWidth={2.5} />
        </Pressable>
      )}
    </View>
  );
}
