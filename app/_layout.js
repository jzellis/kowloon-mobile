// Root layout — Expo Router entry. Every route in app/ renders inside this.
//
// Sets up: NativeWind global stylesheet, Redux Provider, gesture root,
// safe-area provider, status bar, and the navigator Stack. Account hydration
// from AsyncStorage runs once on mount; child screens gate on the status.

import "../global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider, useDispatch } from "react-redux";

import { store } from "../src/state/store.js";
import { hydrateAccounts } from "../src/state/accountsSlice.js";

function HydrationBoot() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(hydrateAccounts());
  }, [dispatch]);
  return null;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <HydrationBoot />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#FAF4E8" },
            }}
          />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}
