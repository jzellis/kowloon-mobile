// Scan an invite QR code.
//
// On a successful scan, we parse the QR contents into { server, inviteCode,
// serverUrl } and forward to the Register screen with them prefilled.
//
// Two accepted QR payloads:
//   kowloon://register?server=kwln.org&inviteCode=abc123
//   https://kwln.org/invite/abc123
// See ../src/lib/inviteUrl.js for the parser.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../src/components/ui/Button.jsx";
import { Heading, Eyebrow } from "../src/components/ui/Heading.jsx";
import { parseInviteUrl } from "../src/lib/inviteUrl.js";

export default function Scan() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState(null);
  // Once we've matched a valid QR, latch so the next frames don't fire too.
  const handledRef = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
    // We intentionally only run this on mount — re-requesting on every change
    // would loop if the user denies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScanned({ data }) {
    if (handledRef.current) return;
    const parsed = parseInviteUrl(data);
    if (!parsed) {
      setError("That QR isn't a Kowloon invite. Try again.");
      // Allow another scan after a moment.
      setTimeout(() => setError(null), 2500);
      return;
    }
    handledRef.current = true;
    router.replace({
      pathname: "/register",
      params: {
        server: parsed.server,
        inviteCode: parsed.inviteCode,
        serverUrl: parsed.serverUrl,
      },
    });
  }

  if (!permission) {
    // Permissions are still loading.
    return <SafeAreaView className="flex-1 bg-base-100" />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-base-100">
        <View className="flex-1 px-6 pt-10 pb-8 justify-between">
          <View>
            <Eyebrow>Scan</Eyebrow>
            <Heading className="text-4xl mt-2 mb-4 leading-tight">
              Camera access needed.
            </Heading>
            <Text className="font-ui text-base text-base-content/70 leading-6">
              {permission.canAskAgain
                ? "We use your camera only to read invite QR codes — no photos are stored or sent anywhere."
                : "Camera permission is blocked. Open the system settings for Expo Go (or this app) to allow it, then come back."}
            </Text>
          </View>
          <View>
            {permission.canAskAgain ? (
              <Button label="Allow camera" onPress={requestPermission} />
            ) : null}
            <Button
              label="Back"
              variant="ghost"
              onPress={() => router.back()}
              className="mt-3"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleScanned}
      />
      {/* Top header card — sits over the camera viewfinder. */}
      <SafeAreaView
        edges={["top"]}
        className="absolute top-0 left-0 right-0"
        pointerEvents="box-none"
      >
        <View className="px-6 pt-3 pb-4 bg-black/55">
          <Eyebrow className="text-base-100/80">Scan</Eyebrow>
          <Text className="font-ui text-xl text-base-100 mt-1">
            Point at an invite QR.
          </Text>
        </View>
      </SafeAreaView>
      {/* Center reticle. */}
      <View
        pointerEvents="none"
        className="absolute inset-0 items-center justify-center"
      >
        <View className="w-64 h-64  " />
      </View>
      {/* Bottom: cancel + error toast. */}
      <SafeAreaView
        edges={["bottom"]}
        className="absolute bottom-0 left-0 right-0"
      >
        <View className="px-6 pb-6">
          {error ? (
            <View className="  bg-error/90 px-3 py-2 mb-3">
              <Text className="font-ui text-sm text-error-content">{error}</Text>
            </View>
          ) : null}
          <Pressable
            onPress={() => router.back()}
            className="  py-3 px-5 items-center"
            android_ripple={{ color: "rgba(255,255,255,0.12)" }}
          >
            <Text className="font-ui uppercase tracking-[0.18em] text-sm text-base-100">
              Cancel
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
