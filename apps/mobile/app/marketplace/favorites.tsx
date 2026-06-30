import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  fetchFavoriteBusinesses,
  fetchFavoriteGigs,
} from "../../src/features/marketplace/api/marketplaceApi";
import { GigCard } from "../../src/features/marketplace/components/GigCard";
import { useAuthStore } from "../../src/features/auth/store/authStore";
import { EmptyState, ScreenHeader, Text } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";
import type { BusinessProfile, GigListItem } from "../../src/features/marketplace/api/marketplaceApi";

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [gigs, setGigs] = useState<GigListItem[]>([]);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const [gigRows, bizRows] = await Promise.all([
      fetchFavoriteGigs(user.id),
      fetchFavoriteBusinesses(user.id),
    ]);
    setGigs(gigRows);
    setBusinesses(bizRows);
  }, [user]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  if (!user) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Favorites" />
        <EmptyState title="Sign in" message="Sign in to save favorites." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Favorites" subtitle="Saved gigs and businesses" />
      {gigs.length === 0 && businesses.length === 0 ? (
        <EmptyState title="No favorites yet" message="Star gigs and businesses to find them here." />
      ) : (
        <FlatList
          data={[
            ...gigs.map((g) => ({ type: "gig" as const, id: g.id, gig: g })),
            ...businesses.map((b) => ({ type: "business" as const, id: b.id, business: b })),
          ]}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            if (item.type === "gig") {
              return (
                <GigCard
                  gig={item.gig}
                  onPress={() => router.push(`/marketplace/gig/${item.gig.id}`)}
                />
              );
            }
            return (
              <Text
                variant="headline"
                style={styles.businessRow}
                onPress={() => router.push(`/business/${item.business.slug}`)}
              >
                {item.business.business_name} · @{item.business.slug}
              </Text>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  businessRow: {
    padding: spacing.md,
    backgroundColor: colors.surface.card,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
});
