import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";

type Props = {
  label?: string;
};

export function TypingIndicator({ label = "typing…" }: Props) {
  return (
    <View style={styles.row}>
      <ActivityIndicator size="small" color={colors.brand.primary} />
      <Text variant="footnote" muted>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
  },
});
