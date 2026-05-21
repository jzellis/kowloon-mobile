import { Text, TextInput, View } from "react-native";

// Single text input with a thin uppercase label above. Editorial styling:
// no rounding, 2px bottom border that shifts to primary on focus is
// future work — for now we render a 2px box border on all sides for clarity.
export function Field({
  label,
  value,
  onChangeText,
  placeholder = "",
  autoCapitalize = "none",
  autoCorrect = false,
  secureTextEntry = false,
  keyboardType = "default",
  error,
  hint,
}) {
  return (
    <View className="mb-4">
      {label ? (
        <Text className="font-ui uppercase tracking-[0.22em] text-[11px] text-base-content/70 mb-1">
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(26,26,32,0.35)"
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        className="border-2 border-base-300 bg-base-100 px-3 py-3 font-reading text-base text-base-content"
      />
      {error ? (
        <Text className="mt-1 font-ui text-xs text-error">{error}</Text>
      ) : hint ? (
        <Text className="mt-1 font-ui text-xs text-base-content/50">{hint}</Text>
      ) : null}
    </View>
  );
}
