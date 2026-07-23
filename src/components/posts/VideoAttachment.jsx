// VideoAttachment — inline video player for a Media card or post detail.
// Uses expo-video (the modern replacement for expo-av, which is no longer
// bundled in Expo Go).
//
// Native controls are essential: they're how the user plays/pauses, enters
// fullscreen, and — critically on iOS — closes the fullscreen player. A
// controls-less VideoView presents a fullscreen view with no Done button, which
// is inescapable (issue #44). The player also captures its own taps, so tapping
// it in the feed interacts with the video rather than opening the post.

import { useCallback } from "react";
import { View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useFocusEffect } from "expo-router";

export function VideoAttachment({ att, height = 288 }) {
  const player = useVideoPlayer({ uri: att.url }, (p) => {
    p.loop = false;
    // Not autoplaying — user taps the native controls when they want to.
  });

  // Pause when the screen loses focus. Expo Router keeps screens mounted, so a
  // video started in the Feed otherwise keeps playing after you open a Post (#60).
  useFocusEffect(
    useCallback(() => {
      return () => {
        try { player.pause(); } catch {}
      };
    }, [player])
  );

  return (
    <View className="mb-2   bg-base-200" style={{ height }}>
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
        nativeControls
        allowsFullscreen
      />
    </View>
  );
}
