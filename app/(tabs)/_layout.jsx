// Tabs layout — the five primary destinations live here as a real Tabs
// navigator so their screens stay MOUNTED across tab switches (scroll position
// and loaded data are preserved natively). "(tabs)" is a route group, so the
// URLs are unchanged (/feed, /circles, ...). Detail screens (post, circle,
// compose, etc.) remain in the root stack and push over the tab bar.
//
// The bar itself is our custom BottomTabBar, wired to the navigator.

import { Tabs } from "expo-router";

import { BottomTabBar } from "../../src/components/nav/BottomTabBar.jsx";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="circles" />
      <Tabs.Screen name="groups" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="notifications" />
    </Tabs>
  );
}
