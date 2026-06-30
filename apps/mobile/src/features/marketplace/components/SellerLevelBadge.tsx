import { StyleSheet, View } from "react-native";
import { Text } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";

interface SellerLevelBadgeProps {
  levelName: string;
  verified?: boolean;
  compact?: boolean;
}

export function SellerLevelBadge({ levelName, verified, compact }: SellerLevelBadgeProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.badge, compact && styles.badgeCompact]}>
        <Text variant="footnote" style={styles.badgeText}>
          {levelName}
        </Text>
      </View>
      {verified ? (
        <View style={[styles.verified, compact && styles.badgeCompact]}>
          <Text variant="footnote" style={styles.verifiedText}>
            Verified
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  badge: {
    backgroundColor: colors.brand.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeCompact: { paddingVertical: 1 },
  badgeText: { color: colors.brand.primary },
  verified: {
    backgroundColor: colors.semantic.success + "22",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  verifiedText: { color: colors.semantic.success },
});
