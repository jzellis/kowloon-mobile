// Circles — stub. The user's circles (Kowloon's social-graph primitive)
// land later: list, create, add/remove members.

import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../src/components/ui/Button.jsx";
import { Eyebrow, Heading } from "../src/components/ui/Heading.jsx";

export default function Circles() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-base-100">
      <View className="flex-1 px-6 pt-10 pb-8 justify-between">
        <View>
          <Eyebrow>Circles</Eyebrow>
          <Heading className="text-4xl mt-2 mb-4 leading-tight">
            Coming next.
          </Heading>
          <Text className="font-reading text-base text-base-content/70 leading-6">
            Circles are how Kowloon replaces follow/unfollow — curated lists of
            people whose posts you read. Browsing and managing them lands in a
            later pass.
          </Text>
        </View>
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}
