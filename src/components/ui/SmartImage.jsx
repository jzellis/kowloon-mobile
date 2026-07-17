// SmartImage — image renderer with animated GIF / WebP support.
//
// React Native's core <Image> renders animated GIFs as a single static frame on
// Android; expo-image animates them on both platforms. All USER-CONTENT images
// (post attachments, hero images, the fullscreen viewer) route through this so
// shared GIFs actually move.
//
// Drop-in for the subset of <Image> props we use: keeps the familiar
// `resizeMode` (mapped to expo-image's `contentFit`) and, via cssInterop,
// honors NativeWind `className` for sizing/background.

import { Image as ExpoImage } from "expo-image";
import { cssInterop } from "nativewind";

// Let NativeWind className resolve to expo-image's `style` prop.
const StyledExpoImage = cssInterop(ExpoImage, { className: "style" });

const FIT = {
  cover: "cover",
  contain: "contain",
  stretch: "fill",
  center: "none",
  repeat: "cover",
};

export function SmartImage({ resizeMode, contentFit, transition, ...props }) {
  return (
    <StyledExpoImage
      contentFit={contentFit || FIT[resizeMode] || "cover"}
      // No cross-fade by default — matches the instant swap of the old <Image>.
      transition={transition ?? 0}
      {...props}
    />
  );
}
