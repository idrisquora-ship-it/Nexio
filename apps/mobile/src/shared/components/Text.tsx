import { colors, typography } from "../theme";
import { Text as RNText, TextProps, StyleSheet } from "react-native";

type Variant = keyof typeof typography;

interface NexioTextProps extends TextProps {
  variant?: Variant;
  color?: keyof typeof colors.text | "brand";
  muted?: boolean;
}

export function Text({
  variant = "body",
  color = "primary",
  muted,
  style,
  ...props
}: NexioTextProps) {
  const textColor =
    color === "brand"
      ? colors.brand.primary
      : muted
        ? colors.text.secondary
        : colors.text[color as keyof typeof colors.text] ?? colors.text.primary;

  return (
    <RNText
      style={[typography[variant], { color: textColor }, style]}
      {...props}
    />
  );
}

export const styles = StyleSheet.create({});
