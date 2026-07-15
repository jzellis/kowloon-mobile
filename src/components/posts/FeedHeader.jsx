// FeedHeader — single-line bar: view selector + contextual action (left) and
// type icons (right). The action (Copy a circle / Join a group) appears only
// when you're reading someone else's circle or group.

import { View } from "react-native";

import { FeedViewSelector } from "./FeedViewSelector.jsx";
import { FeedViewAction } from "./FeedViewAction.jsx";
import { TypeFilter } from "./TypeFilter.jsx";
import { useFeedSubject } from "../../lib/useFeedSubject.js";

export function FeedHeader({
  viewKey,
  onViewChange,
  activeTypes,
  onSetTypes,
}) {
  // Resolve the circle/group behind the current view once, here — both the
  // selector's label fallback and the contextual action read from it.
  const { kind, subject, isOwner, isMember } = useFeedSubject(viewKey);

  return (
    <View className="border-b-2 border-base-300 flex-row items-center px-5 py-2">
      <View className="flex-1 min-w-0 flex-row items-center">
        <View className="flex-shrink min-w-0">
          <FeedViewSelector
            value={viewKey}
            onChange={onViewChange}
            subject={subject}
          />
        </View>
        <View className="flex-shrink-0 ml-2">
          <FeedViewAction
            kind={kind}
            subject={subject}
            isOwner={isOwner}
            isMember={isMember}
          />
        </View>
      </View>
      <TypeFilter activeTypes={activeTypes} onSetTypes={onSetTypes} />
    </View>
  );
}
