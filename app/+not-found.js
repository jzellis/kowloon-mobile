// Catches unmatched routes — most commonly kowloon:/// on iOS in the Expo
// dev client, where the scheme authority separator causes the root path to be
// parsed as "//" instead of "/" and miss app/index.js.
//
// Module-level flag (not a ref) so it survives component remounts — iOS can
// fire kowloon:/// multiple times per session, remounting this component each
// time and resetting any instance-level ref.

import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import {
  selectAccounts,
  selectAccountsStatus,
} from "../src/state/accountsSlice.js";

let _redirected = false;

export default function NotFound() {
  const router = useRouter();
  const status = useSelector(selectAccountsStatus);
  const accounts = useSelector(selectAccounts);

  useEffect(() => {
    if (status === "idle" || status === "loading") return;
    if (_redirected) return;
    _redirected = true;
    router.replace(accounts.length > 0 ? "/feed" : "/welcome");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, accounts.length]);

  return (
    <View className="flex-1 items-center justify-center bg-base-100">
      <ActivityIndicator />
    </View>
  );
}
