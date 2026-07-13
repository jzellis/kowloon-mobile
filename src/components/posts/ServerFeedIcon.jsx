// ServerFeedIcon — the server icon with a public/private overlay.
//
// The server's icon sits under a light scrim with a white glyph on top:
//   variant "public" -> globe (federated / anyone on the network)
//   variant "server" -> lock  (local-only / this server's members)
//
// Composed client-side (scrim + glyph over the image) rather than baked into
// stored image variants — federation renders remote servers' icons too, and a
// view-state badge isn't a property of the server's identity.

import { Image, StyleSheet, View } from "react-native";
import { Globe, Lock } from "lucide-react-native";

export function ServerFeedIcon({ iconUrl, variant = "public", size = 22 }) {
  const Glyph = variant === "server" ? Lock : Globe;
  const glyph = Math.round(size * 0.56);
  return (
    <View
      style={{ width: size, height: size }}
      className="bg-secondary overflow-hidden"
    >
      {iconUrl ? (
        <Image
          source={{ uri: iconUrl }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : null}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.22)" }]}
      />
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        <Glyph size={glyph} color="#FFFFFF" strokeWidth={2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
});
