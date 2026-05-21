// Scan an invite QR code. Stub — wired up after register.

import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../src/components/ui/Button.jsx";
import { Heading, Eyebrow } from "../src/components/ui/Heading.jsx";

export default function Scan() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-base-100">
      <View className="flex-1 px-6 pt-10 pb-8 justify-between">
        <View>
          <Eyebrow>Scan</Eyebrow>
          <Heading className="text-4xl mt-2 mb-4 leading-tight">
            Coming next.
          </Heading>
          <Text className="font-reading text-base text-base-content/70 leading-6">
            The camera scanner lands after register. Scanned QR codes deep-link
            into the registration screen with the server and invite code
            pre-filled.
          </Text>
        </View>
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}
