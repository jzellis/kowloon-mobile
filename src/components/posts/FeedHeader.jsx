// FeedHeader — sits below the masthead on the feed screen.
//
// Two rows: the feed view's title (tappable → bottom-sheet picker with
// Public / Server / Your circles), and a horizontal post-type filter row.
//
// The user's selection is the default: every change auto-syncs to
// user.prefs.{defaultFeedView, defaultPostView} (debounced in feed.js), so a
// fresh login on any device lands on whatever you were last reading.

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
