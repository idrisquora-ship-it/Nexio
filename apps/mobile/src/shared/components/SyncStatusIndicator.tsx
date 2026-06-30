import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Text } from "./Text";
import { colors, spacing } from "../theme";

type Props = {
  syncing: boolean;
  pendingCount: number;
};

export function SyncStatusIndicator({ syncing, pendingCount }: Props) {
  if (!syncing && pendingCount === 0) return null;

  return (
    <View style={styles.row}>
      {syncing ? <ActivityIndicator size="small" color={colors.brand.primary} /> : null}
      <Text variant="caption" muted>
        {syncing
          ? "Syncing…"
          : `${pendingCount} pending ${pendingCount === 1 ? "item" : "items"}`}
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
    paddingVertical: spacing.xs,
  },
});
