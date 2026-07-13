// BottomTabBar — persistent primary navigation.
//
// Five destinations: Feed · Circles · Groups · Search · Notify. The Notify tab
// carries the unread-count badge. The user's own profile is intentionally NOT a
// tab — it's reached from the account avatar in the header (a low-frequency
// destination doesn't earn a tab slot).
//
// This is a lightweight router-driven bar (router.replace between sibling
// routes), not an Expo Router <Tabs> layout — it drops onto the existing Stack
// screens without restructuring routing. Place it as the last child of a screen
// whose scrollable body is flex-1.

import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Home, Hexagon, Users, Search, Bell } from "lucide-react-native";

import { useUnreadCount } from "../../lib/UnreadCountContext.js";

const TABS = [
  { key: "feed", label: "Feed", route: "/feed", Icon: Home },
  { key: "circles", label: "Circles", route: "/circles", Icon: Hexagon },
  { key: "groups", label: "Groups", route: "/groups", Icon: Users },
  { key: "search", label: "Search", route: "/search", Icon: Search },
  { key: "notify", label: "Notify", route: "/notifications", Icon: Bell },
];

const ACTIVE = "#5588B1"; // primary
const INACTIVE = "rgba(26,26,32,0.5)"; // ink /50

export function BottomTabBar({ active }) {
  const router = useRouter();
  const { count } = useUnreadCount();

  return (
    <SafeAreaView
      edges={["bottom"]}
      className="bg-base-100 border-t-2 border-base-content"
    >
      <View className="flex-row">
        {TABS.map(({ key, label, route, Icon }) => {
          const on = key === active;
          const showBadge = key === "notify" && count > 0;
          return (
            <Pressable
              key={key}
              onPress={() => {
                if (!on) router.replace(route);
              }}
              android_ripple={{ color: "rgba(0,0,0,0.05)" }}
              className="flex-1 items-center pt-2 pb-1"
            >
              <View>
                <Icon
                  size={22}
                  color={on ? ACTIVE : INACTIVE}
                  strokeWidth={1.75}
                />
                {showBadge ? (
                  <View className="absolute -top-1.5 -right-2 bg-accent border border-base-100 min-w-[16px] h-4 items-center justify-center px-1">
                    <Text className="font-ui text-[9px] font-bold text-accent-content">
                      {count > 99 ? "99+" : count}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                className={`font-ui uppercase tracking-[0.14em] text-[9px] mt-1 ${
                  on ? "text-base-content" : "text-base-content/50"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
