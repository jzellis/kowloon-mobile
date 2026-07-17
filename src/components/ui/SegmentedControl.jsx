import { Pressable, Text, View } from "react-native";

// Editorial segmented control — a row of hard-edged segments sharing a 2px
// frame. Active segment fills with primary. Discrete steps, no slider.
// `options`: [{ value, label }]
//
// The active fill and label color are applied via inline `style`, NOT NativeWind
// classes: on Android a className that only swaps a color between renders can
// fail to repaint (the old backgroundColor sticks), so the highlight wouldn't
// move when you pick a different segment. Inline styles always diff correctly.
export function SegmentedControl({ options, value, onChange }) {
  return (
    <View className="flex-row  ">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className="flex-1 py-3 items-center"
            style={{ backgroundColor: active ? "#5588B1" : "#FFFFFF" }}
            android_ripple={{ color: "rgba(0,0,0,0.08)" }}
          >
            <Text
              className="font-ui text-xs uppercase tracking-[0.12em]"
              style={{ color: active ? "#F4F5F7" : "#1A1A20" }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
