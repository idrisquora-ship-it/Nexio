import { StyleSheet, View } from "react-native";
import { Text } from "./Text";
import { colors, spacing } from "../theme";

type Props = {
  visible: boolean;
  pendingCount?: number;
};

export function OfflineBanner({ visible, pendingCount = 0 }: Props) {
  if (!visible) return null;

  const detail =
    pendingCount > 0
      ? `Waiting to sync ${pendingCount} item${pendingCount === 1 ? "" : "s"}`
      : "Some features may be limited";

  return (
    <View style={styles.banner}>
      <Text variant="footnote" color="primary">
        You're offline
      </Text>
      <Text variant="caption" muted>
        {detail}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
    gap: spacing.xxs,
  },
});
