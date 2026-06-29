// FeedHeader — single-line bar: view selector (left) + type icons (right).

import { View } from "react-native";

import { FeedViewSelector } from "./FeedViewSelector.jsx";
import { TypeFilter } from "./TypeFilter.jsx";

export function FeedHeader({
  viewKey,
  onViewChange,
  activeTypes,
  onSetTypes,
}) {
  return (
    <View className="border-b-2 border-base-300 flex-row items-center px-5 py-2">
      <View className="flex-1 min-w-0">
        <FeedViewSelector value={viewKey} onChange={onViewChange} />
      </View>
      <TypeFilter activeTypes={activeTypes} onSetTypes={onSetTypes} />
    </View>
  );
}
