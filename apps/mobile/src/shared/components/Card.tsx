import { View, StyleSheet, ViewProps } from "react-native";
import { colors, radius, spacing } from "../theme";

interface CardProps extends ViewProps {
  padded?: boolean;
}

export function Card({ padded = true, style, children, ...props }: CardProps) {
  return (
    <View style={[styles.card, padded && styles.padded, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
  },
  padded: {
    padding: spacing.md,
  },
});
