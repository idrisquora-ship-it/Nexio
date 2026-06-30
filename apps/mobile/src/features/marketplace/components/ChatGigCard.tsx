import { Image, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";
import { formatPrice } from "../api/marketplaceApi";
import type { MediaMetadata } from "../../messaging/api/messagingApi";

interface ChatGigCardProps {
  metadata: MediaMetadata;
  isOwn?: boolean;
}

export function ChatGigCard({ metadata, isOwn }: ChatGigCardProps) {
  const router = useRouter();
  const gigId = metadata.gigId;

  if (!gigId || !metadata.title) return null;

  return (
    <Pressable
      style={[styles.card, isOwn ? styles.ownCard : undefined]}
      onPress={() => router.push(`/marketplace/gig/${gigId}`)}
    >
      {metadata.coverImageUrl ? (
        <Image source={{ uri: metadata.coverImageUrl }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Text variant="footnote" muted>
            Gig
          </Text>
        </View>
      )}
      <View style={styles.body}>
        <Text variant="footnote" muted={!isOwn} style={isOwn ? styles.ownText : undefined}>
          {metadata.businessName ?? "Seller"}
        </Text>
        <Text variant="headline" numberOfLines={2} style={isOwn ? styles.ownText : undefined}>
          {metadata.title}
        </Text>
        <Text variant="subheadline" color="brand">
          From {formatPrice(metadata.startingPriceCents ?? null, metadata.currency ?? "USD")}
        </Text>
        <Text variant="footnote" color="brand">
          View gig →
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.background.primary,
    maxWidth: 260,
  },
  ownCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  cover: { width: "100%", height: 100 },
  coverPlaceholder: {
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: spacing.sm, gap: spacing.xxs },
  ownText: { color: colors.text.inverse },
});
