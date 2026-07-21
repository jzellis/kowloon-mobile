// VideoAttachment — video player for a Media card or post detail.
// Uses expo-video (the modern replacement for expo-av, which is no longer
// bundled in Expo Go).
//
// Two modes:
//   - default (detail view): inline player with native controls.
//   - tapToFullscreen (feed): show the first frame with a play badge and jump
//     straight to fullscreen playback on tap, so a tap on media never falls
//     through to "open the post" — matching the tap-image-to-view behavior.

import { useRef } from "react";
import { Pressable, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Play } from "lucide-react-native";

export function VideoAttachment({ att, height = 288, tapToFullscreen = false }) {
  const player = useVideoPlayer({ uri: att.url }, (p) => {
    p.loop = false;
    // Not autoplaying — user taps to go fullscreen (feed) or uses the native
    // controls (detail).
  });
  const viewRef = useRef(null);

  if (tapToFullscreen) {
    return (
      <View className="mb-2 bg-base-200" style={{ height }}>
        <VideoView
          ref={viewRef}
          player={player}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
          nativeControls={false}
        />
        <Pressable
          className="absolute inset-0 items-center justify-center"
          onPress={async () => {
            try {
              await viewRef.current?.enterFullscreen();
              player.play();
            } catch {
              // fullscreen unavailable on this platform/state — no-op
            }
          }}
        >
          <View className="bg-black/45 rounded-full p-4">
            <Play size={30} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </Pressable>
      </View>
    );
  }

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
