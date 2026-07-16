import { Pressable, Text, View } from "react-native";

// Editorial checkbox — 24px hard-edged box, primary fill when checked.
// `label` text wraps to multiple lines (used for rule acknowledgements).
export function Checkbox({ checked, onToggle, label, disabled = false }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onToggle}
      className={`flex-row items-start py-2 ${disabled ? "opacity-50" : ""}`}
      android_ripple={{ color: "rgba(0,0,0,0.05)" }}
    >
      <View
        className={`w-6 h-6 mr-3 mt-[2px]   items-center justify-center ${
          checked ? "bg-primary " : "bg-base-100"
        }`}
      >
        {checked ? (
          <Text className="font-ui text-primary-content text-base leading-5">
            {"✓"}
          </Text>
        ) : null}
      </View>
      <Text className="flex-1 font-ui text-base text-base-content leading-6">
        {label}
      </Text>
    </Pressable>
  );
}
