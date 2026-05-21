// Root route — splash while accounts hydrate, then redirect:
//   - no accounts → /welcome
//   - has accounts → /feed (placeholder for now)

import { useSelector } from "react-redux";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";

import {
  selectAccounts,
  selectAccountsStatus,
} from "../src/state/accountsSlice.js";

export default function Index() {
  const status = useSelector(selectAccountsStatus);
  const accounts = useSelector(selectAccounts);

  if (status === "idle" || status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-base-100">
        <ActivityIndicator />
      </View>
    );
  }

  if (accounts.length === 0) {
    return <Redirect href="/welcome" />;
  }

  return <Redirect href="/feed" />;
}
