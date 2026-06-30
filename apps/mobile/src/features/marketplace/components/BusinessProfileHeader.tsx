import { Image, Pressable, StyleSheet, View } from "react-native";
import { Flag, QrCode, Share2 } from "lucide-react-native";
import { Avatar, Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";
import type { BusinessProfile } from "../api/marketplaceApi";
import { FavoriteButton } from "./FavoriteButton";
import { FollowBusinessButton } from "../../updates/components/FollowBusinessButton";
import { SellerLevelBadge } from "./SellerLevelBadge";
import { VacationBanner } from "./VacationBanner";

const LEVEL_NAMES: Record<number, string> = {
  0: "New Seller",
  1: "Level 1",
  2: "Level 2",
  3: "Top Seller",
  4: "Verified Seller",
};

interface BusinessProfileHeaderProps {
  business: BusinessProfile;
  isOwner?: boolean;
  onShare?: () => void;
  onQr?: () => void;
  onEditPortfolio?: () => void;
  onReport?: () => void;
}

export function BusinessProfileHeader({
  business,
  isOwner,
  onShare,
  onQr,
  onEditPortfolio,
  onReport,
}: BusinessProfileHeaderProps) {
  return (
    <View style={styles.wrap}>
      {business.banner_url ? (
        <Image source={{ uri: business.banner_url }} style={styles.banner} />
      ) : (
        <View style={[styles.banner, styles.bannerPlaceholder]} />
      )}
      {business.is_vacation_mode ? <VacationBanner /> : null}
      <View style={styles.content}>
        <View style={styles.row}>
          {business.logo_url ? (
            <Image source={{ uri: business.logo_url }} style={styles.logo} />
          ) : (
            <Avatar name={business.business_name} size={64} />
          )}
          <View style={styles.meta}>
            <Text variant="title2">{business.business_name}</Text>
            <Text variant="footnote" muted>
              @{business.slug}
            </Text>
            {business.tagline ? (
              <Text variant="body" muted style={styles.tagline}>
                {business.tagline}
              </Text>
            ) : null}
            <SellerLevelBadge
              levelName={LEVEL_NAMES[business.seller_level ?? 0] ?? "Seller"}
              verified={business.is_verified}
            />
          </View>
          <View style={styles.actionsCol}>
            <FavoriteButton targetType="business" targetId={business.id} />
            {!isOwner ? <FollowBusinessButton businessId={business.id} /> : null}
          </View>
        </View>
        {business.description ? (
          <Text variant="body" style={styles.description}>
            {business.description}
          </Text>
        ) : null}
        <View style={styles.actions}>
          {onShare ? (
            <Pressable style={styles.actionBtn} onPress={onShare}>
              <Share2 color={colors.brand.primary} size={18} />
              <Text variant="footnote" color="brand">
                Share
              </Text>
            </Pressable>
          ) : null}
          {onQr ? (
            <Pressable style={styles.actionBtn} onPress={onQr}>
              <QrCode color={colors.brand.primary} size={18} />
              <Text variant="footnote" color="brand">
                QR code
              </Text>
            </Pressable>
          ) : null}
          {isOwner && onEditPortfolio ? (
            <Pressable style={styles.actionBtn} onPress={onEditPortfolio}>
              <Text variant="footnote" color="brand">
                Manage portfolio
              </Text>
            </Pressable>
          ) : null}
          {!isOwner && onReport ? (
            <Pressable style={styles.actionBtn} onPress={onReport}>
              <Flag color={colors.text.secondary} size={16} />
              <Text variant="footnote" muted>
                Report
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  banner: { width: "100%", height: 120 },
  bannerPlaceholder: { backgroundColor: colors.background.tertiary },
  content: { padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  logo: { width: 64, height: 64, borderRadius: 32 },
  meta: { flex: 1, gap: spacing.xxs },
  actionsCol: { alignItems: "flex-end", gap: spacing.xs },
  tagline: { marginTop: spacing.xxs },
  description: { marginTop: spacing.xs },
  actions: { flexDirection: "row", gap: spacing.md },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xxs },
});
