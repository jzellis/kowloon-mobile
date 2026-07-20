// Push token acquisition — the ONE place that decides which kind of token we
// register. Today it fetches an Expo push token (delivered via Expo's push
// service). When push.kowloon.network exists, this flips to the native device
// token (Notifications.getDevicePushTokenAsync) tagged provider: "native" —
// and nothing else in the app changes. The server routes by provider, so both
// can coexist during the migration.
//
// Push does NOT work in Expo Go (SDK 53+) or on simulators — this returns null
// there, and the foreground 60s polling still covers notifications.

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

const PROJECT_ID =
  Constants?.expoConfig?.extra?.eas?.projectId ||
  "3625fe62-70c1-45e5-9bc0-a635b1989886";

// Ensure permission + (Android) a notification channel, then return the token
// registration payload for POST /push/register, or null if unavailable.
export async function getPushRegistration() {
  if (!Device.isDevice) return null; // simulators can't get a push token

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: PROJECT_ID,
    });
    if (!token) return null;
    return { token, provider: "expo", platform: Platform.OS };
  } catch {
    // No dev/prod build (Expo Go), or credentials not set up yet.
    return null;
  }
}
