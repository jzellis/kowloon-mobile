// Settings index. Currently just Typography; more rows land as the app grows.

import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../src/components/ui/Button.jsx";
import { Eyebrow, Heading } from "../../src/components/ui/Heading.jsx";

function Row({ label, hint, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className="border-2 border-base-300 bg-base-100 px-4 py-4 mb-3 flex-row items-center justify-between"
      android_ripple={{ color: "rgba(0,0,0,0.05)" }}
    >
      <View className="flex-1">
        <Text className="font-reading text-lg text-base-content">{label}</Text>
        {hint ? (
          <Text className="font-ui text-xs text-base-content/50 mt-0.5">
            {hint}
          </Text>
        ) : null}
      </View>
      <Text className="font-ui text-2xl text-base-content/40">{"›"}</Text>
    </Pressable>
  );
}

export default function Settings() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-base-100">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-10">
          <Eyebrow>Account</Eyebrow>
          <Heading className="text-4xl mt-2 mb-6 leading-tight">
            Settings
          </Heading>

          <Row
            label="Typography"
            hint="Reading font, size, spacing, margins"
            onPress={() => router.push("/settings/typography")}
          />
        </View>

        <View className="px-6 mt-2">
          <Button label="Back" variant="ghost" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
