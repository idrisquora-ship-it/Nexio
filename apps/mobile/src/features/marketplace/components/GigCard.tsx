import { Image, Pressable, StyleSheet, View } from "react-native";
import { Star } from "lucide-react-native";
import { Text } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";
import { formatPrice, type GigListItem } from "../api/marketplaceApi";
import { SellerLevelBadge } from "./SellerLevelBadge";

const LEVEL_NAMES: Record<number, string> = {
  0: "New Seller",
  1: "Level 1",
  2: "Level 2",
  3: "Top Seller",
  4: "Verified Seller",
};

interface GigCardProps {
  gig: GigListItem;
  onPress: () => void;
}

export function GigCard({ gig, onPress }: GigCardProps) {
  const business = gig.business_profiles;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {gig.cover_image_url ? (
        <Image source={{ uri: gig.cover_image_url }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Text variant="footnote" muted>
            {gig.category}
          </Text>
        </View>
      )}
      <View style={styles.body}>
        <Text variant="headline" numberOfLines={2}>
          {gig.title}
        </Text>
        <Text variant="footnote" muted numberOfLines={1}>
          {business?.business_name ?? "Seller"}
        </Text>
        {business ? (
          <SellerLevelBadge
            levelName={LEVEL_NAMES[business.seller_level ?? 0] ?? "Seller"}
            verified={business.is_verified}
            compact
          />
        ) : null}
        <View style={styles.meta}>
          <Text variant="subheadline" color="brand">
            From {formatPrice(gig.starting_price_cents, gig.currency)}
          </Text>
          {gig.rating_count > 0 ? (
            <View style={styles.rating}>
              <Star color={colors.semantic.warning} size={14} fill={colors.semantic.warning} />
              <Text variant="footnote" muted>
                {gig.rating_avg.toFixed(1)} ({gig.rating_count})
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  cover: {
    width: "100%",
    height: 140,
  },
  coverPlaceholder: {
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: spacing.md,
    gap: spacing.xxs,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
