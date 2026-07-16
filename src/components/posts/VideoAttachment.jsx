// VideoAttachment — inline video player for a Media card or post detail.
// Uses expo-video (the modern replacement for expo-av, which is no longer
// bundled in Expo Go).

import { View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

export function VideoAttachment({ att, height = 288 }) {
  const player = useVideoPlayer({ uri: att.url }, (p) => {
    p.loop = false;
    // Not autoplaying — user taps the native controls when they want to.
  });

  return (
    <View
      className="mb-2   bg-base-200"
      style={{ height }}
    >
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
