// AudioAttachment — a play/pause row for an audio attachment in a Media
// card or post detail. Uses expo-audio's hook-based API (the modern
// replacement for expo-av, which is no longer bundled in Expo Go).

import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useFocusEffect } from "expo-router";

function formatTime(seconds) {
  if (!seconds || !Number.isFinite(seconds)) return "";
  const s = Math.floor(seconds);
  const mm = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function AudioAttachment({ att }) {
  const player = useAudioPlayer({ uri: att.url });
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState(null);

  const playing = status?.playing;
  const position = status?.currentTime || 0;
  const duration = status?.duration || 0;
  const loading = !status?.isLoaded;

  // When the audio reaches the end, seek back to start so the next tap
  // replays from the beginning instead of staying parked at the tail.
  useEffect(() => {
    if (status?.didJustFinish) {
      player.seekTo(0).catch(() => {});
    }
  }, [status?.didJustFinish, player]);

  // Pause when the screen loses focus. Expo Router keeps screens mounted, so
  // without this a clip started in the Feed keeps playing after you open a Post
  // (and could play twice) (#60).
  useFocusEffect(
    useCallback(() => {
      return () => {
        try { player.pause(); } catch {}
      };
    }, [player])
  );

  function toggle() {
    setError(null);
    try {
      if (playing) player.pause();
      else player.play();
    } catch (e) {
      setError(e?.message || "Couldn't play this audio.");
    }
  }

  return (
    <View className="  bg-base-200 mb-2">
      <Pressable
        onPress={toggle}
        android_ripple={{ color: "rgba(0,0,0,0.06)" }}
        className="flex-row items-center px-3 py-3"
      >
        <Text className="font-ui text-lg text-base-content w-7">
          {loading ? "…" : playing ? "⏸" : "▶"}
        </Text>
        <Text
          className="font-ui text-sm text-base-content flex-1 mx-2"
          numberOfLines={1}
        >
          {att.name || "Audio"}
        </Text>
        {duration ? (
          <Text className="font-ui text-xs text-base-content/55 tabular-nums">
            {formatTime(position)} / {formatTime(duration)}
          </Text>
        ) : null}
      </Pressable>
      {error ? (
        <Text className="font-ui text-xs text-error px-3 pb-2">{error}</Text>
      ) : null}
    </View>
  );
}
