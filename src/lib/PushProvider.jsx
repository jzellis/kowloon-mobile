// PushProvider — wires remote push into the app:
//   1. Foreground behavior (show the banner even when the app is open).
//   2. Deep-link routing when a notification is tapped (warm and cold start),
//      reusing notificationRoute() — the same logic the notifications screen uses.
//   3. Registers the active account's push token with its server.
//
// Everything degrades gracefully in Expo Go / on simulators (getPushRegistration
// returns null); the 60s foreground poll still delivers notifications there.

import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useSelector } from "react-redux";
import { router } from "expo-router";

import { selectActiveAccount } from "../state/accountsSlice.js";
import { useActiveClient } from "./useActiveClient.js";
import { getPushRegistration } from "./push.js";
import { notificationRoute } from "./notifications.js";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
    const sub = Notifications.addNotificationResponseReceivedListener(routeFromResponse);
    Notifications.getLastNotificationResponseAsync()
      .then((resp) => {
        if (resp) routeFromResponse(resp);
      })
      .catch(() => {});
    return () => sub.remove();
  }, []);

  // Register the active account's device token with its server.
  useEffect(() => {
    if (!account?.id || !client) return;
    let cancelled = false;
    (async () => {
      try {
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
