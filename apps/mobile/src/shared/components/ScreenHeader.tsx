import { View, StyleSheet } from "react-native";
import { colors, spacing } from "../theme";
import { Text } from "./Text";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <Text variant="largeTitle">{title}</Text>
      {subtitle ? (
        <Text variant="subheadline" muted>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xxs,
  },
});
