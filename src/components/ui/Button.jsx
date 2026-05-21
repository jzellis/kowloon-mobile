import { Pressable, Text, View, ActivityIndicator } from "react-native";

// Editorial button — hard edges (no rounding), 2px border, uppercase label.
// `variant` controls fill: primary | secondary | ghost.
// `loading` disables the button and replaces the label with a spinner.
export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  className = "",
}) {
  const isDisabled = disabled || loading;
  const bg = {
    primary: isDisabled ? "bg-primary/60" : "bg-primary",
    secondary: isDisabled ? "bg-secondary/60" : "bg-secondary",
    ghost: "bg-transparent",
  }[variant];
  const fg = {
    primary: "text-primary-content",
    secondary: "text-secondary-content",
    ghost: "text-base-content",
  }[variant];
  const border = {
    primary: "border-primary",
    secondary: "border-secondary",
    ghost: "border-base-content",
  }[variant];

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      className={`border-2 ${border} ${bg} py-3 px-5 ${className}`}
      android_ripple={{ color: "rgba(0,0,0,0.08)" }}
    >
      <View className="flex-row items-center justify-center">
        {loading ? (
          <ActivityIndicator color={variant === "ghost" ? "#1A1A20" : "#FAF4E8"} />
        ) : (
          <Text
            className={`font-ui uppercase tracking-[0.18em] text-sm ${fg}`}
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
