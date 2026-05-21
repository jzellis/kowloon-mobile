// Placeholder feed screen — for now, just shows the active account and a
// sign-out button so we can verify the login flow end to end. The real
// timeline UI comes next.

import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../src/components/ui/Button.jsx";
import { Heading, Eyebrow } from "../src/components/ui/Heading.jsx";
import {
  selectAccounts,
  selectActiveAccount,
  signOutAccount,
} from "../src/state/accountsSlice.js";

export default function Feed() {
  const router = useRouter();
  const dispatch = useDispatch();
  const accounts = useSelector(selectAccounts);
  const active = useSelector(selectActiveAccount);

  if (!active) {
    // Belt and suspenders — should not be reachable, the / redirect handles
    // the no-account case. Still, guard against a stale router state.
    router.replace("/welcome");
    return null;
  }

  async function handleSignOut() {
    await dispatch(signOutAccount(active.id));
    if (accounts.length <= 1) router.replace("/welcome");
  }

  return (
    <SafeAreaView className="flex-1 bg-base-100">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Eyebrow>Signed in as</Eyebrow>
        <Heading className="text-3xl mt-2 mb-1 leading-tight">
          {active.profile?.name || active.username}
        </Heading>
        <Text className="font-ui text-sm text-base-content/60 mb-6">
          {active.id}
        </Text>

        <View className="border-2 border-base-300 bg-base-100 p-4 mb-6">
          <Eyebrow className="mb-2">Server</Eyebrow>
          <Text className="font-reading text-base text-base-content">
            {active.server}
          </Text>
          <Text className="font-ui text-xs text-base-content/50 mt-1">
            {active.baseUrl}
          </Text>
        </View>

        <Text className="font-reading text-base text-base-content/70 mb-8 leading-6">
          Feed coming next. Login round-trip works — the rest is just glass.
        </Text>

        <Button
          label="Sign out"
          variant="ghost"
          onPress={handleSignOut}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
