// Register a new account on a Kowloon server. Stub — wired up next.

import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../src/components/ui/Button.jsx";
import { Heading, Eyebrow } from "../src/components/ui/Heading.jsx";

export default function Register() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-base-100">
      <View className="flex-1 px-6 pt-10 pb-8 justify-between">
        <View>
          <Eyebrow>Register</Eyebrow>
          <Heading className="text-4xl mt-2 mb-4 leading-tight">
            Coming next.
          </Heading>
          <Text className="font-reading text-base text-base-content/70 leading-6">
            The registration screen lands in the next pass: enter a server
            domain, review the community rules, set a username and password.
          </Text>
        </View>
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}
