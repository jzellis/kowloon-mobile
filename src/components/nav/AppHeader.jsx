// AppHeader — the Klein blue app header.
//
// White sans title (Inter, not the display serif). The blue extends up through
// the top safe-area (status bar) via its own SafeAreaView, so screens that use
// this should drop the "top" edge from their own SafeAreaView (keep left/right).
//
// Slots:
//   title  — white title text (omit when `left` carries its own content)
//   back   — render a white back chevron (for pushed screens; omit on tab roots)
//   left   — override the leading slot entirely (e.g. the feed server toggle)
//   right  — trailing node, e.g. a <HeaderButton>

import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

export function AppHeader({ title, back = false, onBack, left = null, right = null }) {
  const router = useRouter();
  return (
    <SafeAreaView edges={["top"]} className="bg-header">
      <View
        className="flex-row items-center px-5 pt-2 pb-3"
        style={{ minHeight: 54 }}
      >
        {left ? (
          left
        ) : back ? (
          <Pressable
            onPress={onBack || (() => router.back())}
            hitSlop={8}
            android_ripple={{ color: "rgba(255,255,255,0.18)", borderless: true }}
            className="mr-3"
          >
            <ChevronLeft size={26} color="#FFFFFF" strokeWidth={1.75} />
          </Pressable>
        ) : null}

        {title ? (
          <Text
            className="font-ui text-2xl text-header-content flex-1"
            numberOfLines={1}
          >
            {title}
          </Text>
        ) : left ? null : (
          <View className="flex-1" />
        )}

        {right}
      </View>
    </SafeAreaView>
  );
}

// White-outlined action button sized for the header (New, Mark all read, etc.).
export function HeaderButton({ label, icon, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      android_ripple={{ color: "rgba(255,255,255,0.18)" }}
      className="flex-row items-center border-2 border-header-content px-3 py-1.5"
    >
      {icon || null}
      <Text
        className={`font-ui uppercase tracking-[0.16em] text-[11px] text-header-content ${
          icon ? "ml-1.5" : ""
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
