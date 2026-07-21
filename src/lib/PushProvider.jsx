// PushProvider — wires remote push into the app:
//   1. Foreground behavior (show the banner even when the app is open).
//   2. Deep-link routing when a notification is tapped (warm and cold start),
//      reusing notificationRoute() — the same logic the notifications screen uses.
//   3. Registers the active account's push token with its server.
//
// Expo Go (SDK 53+) removed remote push, and importing expo-notifications there
// THROWS at module-eval time — which would take down the whole provider tree
// (and with it the Redux Provider, blanking the app at the splash screen). So we
// never statically import it: in Expo Go this is a pure no-op and the 60s
// foreground poll still delivers notifications. In a real dev/prod build we
// dynamically import expo-notifications (and push.js, which also imports it).

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { router } from "expo-router";
import Constants from "expo-constants";

import { selectActiveAccount } from "../state/accountsSlice.js";
import { useActiveClient } from "./useActiveClient.js";
import { notificationRoute } from "./notifications.js";

// Expo Go reports executionEnvironment "storeClient"; dev/prod builds report
// "standalone"/"bare". appOwnership is a legacy fallback ("expo" in Expo Go).
const IS_EXPO_GO =
  Constants.executionEnvironment === "storeClient" ||
  Constants.appOwnership === "expo";

function routeFromResponse(response) {
  const data = response?.notification?.request?.content?.data;
  if (!data) return;
  const path = notificationRoute(data) || "/notifications";
  try {
    router.push(path);
  } catch {
    // navigation not ready yet (cold start) — non-fatal
  }
}

export function PushProvider({ children }) {
  const account = useSelector(selectActiveAccount);
  const client = useActiveClient();

  // Tap routing: warm taps via the listener, cold-start taps via the last response.
  useEffect(() => {
    if (IS_EXPO_GO) return;
    let sub;
    let cancelled = false;
    (async () => {
      const Notifications = await import("expo-notifications");
      if (cancelled) return;
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      sub = Notifications.addNotificationResponseReceivedListener(routeFromResponse);
      Notifications.getLastNotificationResponseAsync()
        .then((resp) => {
          if (resp) routeFromResponse(resp);
        })
        .catch(() => {});
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  // Register the active account's device token with its server.
  useEffect(() => {
    if (IS_EXPO_GO || !account?.id || !client) return;
    let cancelled = false;
    (async () => {
      try {
        const { getPushRegistration } = await import("./push.js");
        const reg = await getPushRegistration();
        if (!reg || cancelled) return;
        await client.http.post("/push/register", reg);
      } catch {
        // permission denied / no build / offline — the poll fallback covers it
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [account?.id, client]);

  return children;
}
