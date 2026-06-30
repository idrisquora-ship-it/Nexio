import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";
import { formatPrice, type Gig } from "../api/marketplaceApi";

interface SellerDashboardCardProps {
  gig: Gig;
  onPress: () => void;
  onEdit?: () => void;
}

export function SellerDashboardCard({ gig, onPress, onEdit }: SellerDashboardCardProps) {
  const statusColor =
    gig.status === "published"
      ? colors.semantic.success
      : gig.status === "draft"
        ? colors.semantic.warning
        : colors.text.secondary;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text variant="headline" numberOfLines={1} style={styles.title}>
          {gig.title}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <Text variant="footnote" style={styles.badgeText}>
            {gig.status}
          </Text>
        </View>
      </View>
      <Text variant="footnote" muted>
        {gig.category} · {formatPrice(gig.starting_price_cents, gig.currency)}
      </Text>
      {onEdit ? (
        <Pressable onPress={onEdit} hitSlop={8}>
          <Text variant="footnote" color="brand">
            Edit draft
          </Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    gap: spacing.xxs,
  },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { flex: 1 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: { color: colors.text.inverse, textTransform: "capitalize" },
});
