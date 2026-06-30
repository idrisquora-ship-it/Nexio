import { StyleSheet, View } from "react-native";
import { Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";

export function VacationBanner() {
  return (
    <View style={styles.banner}>
      <Text variant="footnote" style={styles.text}>
        Currently unavailable — new orders paused. You can still message the seller.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.semantic.warning + "22",
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  text: { color: colors.semantic.warning },
});
