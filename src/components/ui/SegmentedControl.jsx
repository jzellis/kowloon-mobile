import { Pressable, Text, View } from "react-native";

// Editorial segmented control — a row of hard-edged segments sharing a 2px
// frame. Active segment fills with primary. Discrete steps, no slider.
// `options`: [{ value, label }]
export function SegmentedControl({ options, value, onChange }) {
  return (
    <View className="flex-row  ">
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`flex-1 py-3 items-center ${
              active ? "bg-primary" : "bg-base-100"
            } ${i > 0 ? " " : ""}`}
            android_ripple={{ color: "rgba(0,0,0,0.08)" }}
          >
            <Text
              className={`font-ui text-xs uppercase tracking-[0.12em] ${
                active ? "text-primary-content" : "text-base-content"
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
