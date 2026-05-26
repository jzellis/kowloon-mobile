// FeedHeader — sits below the masthead on the feed screen.
//
// Two rows:
//   1. The current feed view's title (tappable → bottom-sheet picker with
//      Public / Server / Your circles).
//   2. Horizontal post-type filter row.

import { View } from "react-native";

import { FeedViewSelector } from "./FeedViewSelector.jsx";
import { TypeFilter } from "./TypeFilter.jsx";

export function FeedHeader({
  viewKey,
  onViewChange,
  activeTypes,
  onToggleType,
  onClearTypes,
}) {
  return (
    <View className="border-b-2 border-base-300">
      <View className="px-5 pt-3 pb-1">
        <FeedViewSelector value={viewKey} onChange={onViewChange} />
      </View>
      <TypeFilter
        activeTypes={activeTypes}
        onToggle={onToggleType}
        onClear={onClearTypes}
      />
    </View>
  );
}
