// TypeFilter — horizontal row of post-type buttons.
//
// [All] + the five post types, icon + label each. Multi-select: tapping a
// type toggles it; "All" clears the selection (empty = show all). Active
// buttons fill with primary; inactive show the type-color icon on the
// bordered cream surface.

import { Pressable, ScrollView, Text } from "react-native";

import { PostTypeIcon } from "./PostTypeIcon.jsx";
import { POST_TYPE_NAMES, POST_TYPES } from "../../lib/postTypes.js";

const PRIMARY_CONTENT = "#F4F5F7";
const MUTED = "rgba(26,26,32,0.55)";

export function TypeFilter({ activeTypes = [], onToggle, onClear }) {
  const isAll = !activeTypes || activeTypes.length === 0;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}
    >
      <Pressable
        onPress={onClear}
        android_ripple={{ color: "rgba(0,0,0,0.06)" }}
        className={`mr-2 px-3.5 py-1.5 border-2 ${
          isAll ? "bg-primary border-primary" : "border-base-300 bg-base-100"
        }`}
      >
        <Text
          className={`font-ui uppercase tracking-[0.14em] text-[11px] ${
            isAll ? "text-primary-content" : "text-base-content/60"
          }`}
        >
          All
        </Text>
      </Pressable>

      {POST_TYPE_NAMES.map((type) => {
        const active = activeTypes.includes(type);
        const typeColor = POST_TYPES[type].color;
        return (
          <Pressable
            key={type}
            onPress={() => onToggle(type)}
            android_ripple={{ color: "rgba(0,0,0,0.06)" }}
            className={`mr-2 flex-row items-center px-3 py-1.5 border-2 ${
              active
                ? "bg-primary border-primary"
                : "border-base-300 bg-base-100"
            }`}
          >
            <PostTypeIcon
              type={type}
              size={16}
              color={active ? PRIMARY_CONTENT : typeColor}
            />
            <Text
              className={`font-ui uppercase tracking-[0.14em] text-[11px] ml-1.5 ${
                active ? "text-primary-content" : "text-base-content/70"
              }`}
            >
              {POST_TYPES[type].label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
