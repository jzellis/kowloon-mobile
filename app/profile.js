// Profile — stub. The user's own profile (avatar, bio, posts) lands later.

import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "../src/components/posts/Avatar.jsx";
import { Button } from "../src/components/ui/Button.jsx";
import { Eyebrow, Heading } from "../src/components/ui/Heading.jsx";
import { selectActiveAccount } from "../src/state/accountsSlice.js";

export default function Profile() {
  const router = useRouter();
  const account = useSelector(selectActiveAccount);
  const me = {
    name: account?.profile?.name || account?.username,
    icon: account?.profile?.icon || null,
    id: account?.id,
  };

  return (
    <SafeAreaView className="flex-1 bg-base-100">
      <View className="flex-1 px-6 pt-10 pb-8 justify-between">
        <View>
          <Eyebrow>Profile</Eyebrow>
          <View className="flex-row items-center mt-3 mb-4">
            <Avatar actor={me} size={64} baseUrl={account?.baseUrl} />
            <View className="flex-1 ml-4">
              <Heading className="text-2xl leading-tight">{me.name}</Heading>
              <Text className="font-ui text-xs text-base-content/50 mt-1">
                {me.id}
              </Text>
            </View>
          </View>
          <Text className="font-reading text-base text-base-content/70 leading-6">
            Your profile — bio, posts, edit controls — lands in a later pass.
          </Text>
        </View>
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}
