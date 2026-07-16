// HexAvatar — flat-top hexagon image clip for Circles and Groups.
// Uses react-native-svg ClipPath; works in Expo Go, no native build needed.
// Each instance gets a React useId()-scoped clip ID so multiple hexes on
// the same screen don't share a single mask.

import { useId, useState } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Defs, ClipPath, Polygon, Image as SvgImage } from "react-native-svg";

// Flat-top regular hexagon vertices in a size×size bounding box.
// At 0° the first vertex is the rightmost point; stepping by 60° gives a
// honeycomb-tile orientation (wider than tall).
function hexPoints(size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    pts.push(
      `${(cx + r * Math.cos(a)).toFixed(3)},${(cy + r * Math.sin(a)).toFixed(3)}`
    );
  }
  return pts.join(" ");
}

export function HexAvatar({
  uri,
  size = 40,
  fallbackColor = "#393B7A",
  fallback = null,
}) {
  const uid = useId();
  // React's useId returns strings like ":r0:" — strip non-alphanumeric for SVG IDs
  const clipId = `hex${uid.replace(/[^a-zA-Z0-9]/g, "")}`;
  const [failed, setFailed] = useState(false);
  // react-native-svg's <Image> can't render an SVG href (default placeholder
  // icons are .svg) and doesn't fire onError on it — it just draws nothing. So
  // treat .svg URIs as "no image" and fall through to the fallback polygon/glyph.
  const isSvg = typeof uri === "string" && uri.split("?")[0].toLowerCase().endsWith(".svg");
  const showImage = !!uri && !failed && !isSvg;
  const points = hexPoints(size);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <ClipPath id={clipId}>
            <Polygon points={points} />
          </ClipPath>
        </Defs>

        {showImage ? (
          <SvgImage
            href={uri}
            width={size}
            height={size}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
            onError={() => setFailed(true)}
          />
        ) : (
          <Polygon points={points} fill={fallbackColor} />
        )}
      </Svg>

      {/* Fallback icon/initial rendered above the filled polygon */}
      {!showImage && fallback && (
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          {fallback}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
});
