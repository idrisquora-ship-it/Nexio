import { StyleSheet, View } from "react-native";
import { Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";

interface WizardProgressProps {
  step: number;
  total?: number;
  labels?: string[];
}

export function WizardProgress({ step, total = 5, labels }: WizardProgressProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="footnote" muted>
        Step {step} of {total}
        {labels?.[step - 1] ? ` · ${labels[step - 1]}` : ""}
      </Text>
      <View style={styles.row}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.dot, i < step ? styles.dotActive : undefined]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.xs },
  row: { flexDirection: "row", gap: spacing.xs },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.background.tertiary,
  },
  dotActive: { backgroundColor: colors.brand.primary },
});
