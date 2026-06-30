import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  searchGigs,
  type GigListItem,
  type MarketplaceFilters,
} from "../../src/features/marketplace/api/marketplaceApi";
import { GigCard } from "../../src/features/marketplace/components/GigCard";
import { EmptyState, ScreenHeader } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

const SECTION_META: Record<
  string,
  { title: string; sort: MarketplaceFilters["sort"]; minRating?: number }
> = {
  featured: { title: "Featured", sort: "ranked" },
  top_rated: { title: "Top rated", sort: "rating", minRating: 4 },
  new: { title: "New arrivals", sort: "newest" },
};

export default function MarketplaceBrowseScreen() {
  const router = useRouter();
  const { section, category } = useLocalSearchParams<{ section?: string; category?: string }>();
  const meta = SECTION_META[section ?? "featured"] ?? SECTION_META.featured;
  const [gigs, setGigs] = useState<GigListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await searchGigs({
        category: category || undefined,
        limit: 50,
        sort: meta.sort,
        minRating: meta.minRating,
      });
      setGigs(results);
    } finally {
      setLoading(false);
    }
  }, [category, meta.minRating, meta.sort]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <ScreenHeader title={meta.title} />
      {loading ? (
        <ActivityIndicator color={colors.brand.primary} style={styles.loader} />
      ) : gigs.length === 0 ? (
        <EmptyState title="No gigs" message="Nothing in this section yet." />
      ) : (
        <FlashList
          data={gigs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <GigCard gig={item} onPress={() => router.push(`/marketplace/gig/${item.id}`)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  loader: { marginTop: spacing.xl },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
});
