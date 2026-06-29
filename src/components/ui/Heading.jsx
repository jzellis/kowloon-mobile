import { Text } from "react-native";

// Editorial display heading — serif, tight tracking, no rounding.
// Use for title cards and screen titles. Size controlled by parent via the
// `className` prop so this stays composable.
export function Heading({ children, className = "", ...props }) {
  return (
    <Text
      className={`font-ui text-base-content ${className}`}
      {...props}
    >
      {children}
    </Text>
  );
}

// Small uppercase eyebrow text — categories, kickers.
export function Eyebrow({ children, className = "", ...props }) {
  return (
    <Text
      className={`font-ui uppercase tracking-[0.25em] text-[10px] text-base-content/60 ${className}`}
      {...props}
    >
      {children}
    </Text>
  );
}
