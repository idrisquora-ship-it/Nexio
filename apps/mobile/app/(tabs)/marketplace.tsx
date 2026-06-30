import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { SlidersHorizontal } from "lucide-react-native";
import {
  DEFAULT_MARKETPLACE_FILTERS,
  fetchCategories,
  fetchMarketplaceHome,
  fetchMyBusiness,
  fetchMyGigs,
  searchGigs,
  type BusinessProfile,
  type Gig,
  type GigListItem,
  type MarketplaceFilters,
} from "../../src/features/marketplace/api/marketplaceApi";
import { toggleVacationMode } from "../../src/features/marketplace/api/analyticsApi";
import { GigCard } from "../../src/features/marketplace/components/GigCard";
import { MarketplaceFilterSheet } from "../../src/features/marketplace/components/MarketplaceFilterSheet";
import { MarketplaceSection } from "../../src/features/marketplace/components/MarketplaceSection";
import { SellerDashboardCard } from "../../src/features/marketplace/components/SellerDashboardCard";
import { useAuthStore } from "../../src/features/auth/store/authStore";
import { EmptyState, ScreenHeader, Text, TextField } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

type Tab = "browse" | "seller" | "favorites";

export default function MarketplaceScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [tab, setTab] = useState<Tab>("browse");
  const [home, setHome] = useState<{
    featured: GigListItem[];
    topRated: GigListItem[];
    newArrivals: GigListItem[];
  }>({ featured: [], topRated: [], newArrivals: [] });
  const [searchResults, setSearchResults] = useState<GigListItem[]>([]);
  const [myGigs, setMyGigs] = useState<Gig[]>([]);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<MarketplaceFilters>(DEFAULT_MARKETPLACE_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  const showSearchResults =
    searchQuery.trim().length > 0 ||
    filters.sort !== "ranked" ||
    filters.minRating != null ||
    filters.maxPriceCents != null;

  const loadBrowse = useCallback(async () => {
    setLoading(true);
    try {
      const [sections, cats] = await Promise.all([
        fetchMarketplaceHome(selectedCategory ?? undefined),
        fetchCategories(),
      ]);
      setHome(sections);
      setCategories(cats);

      if (showSearchResults) {
        const results = await searchGigs({
          query: searchQuery.trim() || undefined,
          category: selectedCategory ?? undefined,
          limit: 40,
          sort: filters.sort,
          minRating: filters.minRating ?? undefined,
          maxPriceCents: filters.maxPriceCents ?? undefined,
        });
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, filters, showSearchResults]);

  const loadSeller = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const biz = await fetchMyBusiness(user.id);
      setBusiness(biz);
      if (biz) {
        const rows = await fetchMyGigs(biz.id);
        setMyGigs(rows);
      } else {
        setMyGigs([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (tab === "browse") loadBrowse();
    else if (tab === "seller") loadSeller();
  }, [tab, loadBrowse, loadSeller]);

  const openSellerTools = async () => {
    if (!user) return;
    const biz = await fetchMyBusiness(user.id);
    if (biz || profile?.is_business) {
      router.push("/marketplace/create");
    } else {
      router.push("/settings/become-business");
    }
  };

  const onVacationToggle = async (enabled: boolean) => {
    try {
      const updated = await toggleVacationMode(enabled);
      setBusiness(updated);
    } catch (e) {
      Alert.alert("Vacation mode", e instanceof Error ? e.message : "Could not update");
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "browse", label: "Browse" },
    ...(profile?.is_business ? [{ id: "seller" as Tab, label: "My gigs" }] : []),
    { id: "favorites", label: "Saved" },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Marketplace" subtitle="Discover services on Nexio" />
      <View style={styles.toolbar}>
        <Pressable style={styles.sellerBtn} onPress={openSellerTools}>
          <Text variant="headline" color="brand">
            {profile?.is_business ? "Create gig" : "Become a seller"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {tabs.map((t) => (
          <Pressable
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => {
              if (t.id === "favorites") router.push("/marketplace/favorites");
              else setTab(t.id);
            }}
          >
            <Text variant="footnote" color={tab === t.id ? "brand" : undefined} muted={tab !== t.id}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "browse" ? (
        <>
          <View style={styles.searchRow}>
            <View style={styles.searchField}>
              <TextField value={searchQuery} onChangeText={setSearchQuery} placeholder="Search gigs" />
            </View>
            <Pressable style={styles.filterBtn} onPress={() => setShowFilters(true)}>
              <SlidersHorizontal color={colors.brand.primary} size={20} />
            </Pressable>
          </View>

          <FlatList
            horizontal
            data={["All", ...categories]}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            renderItem={({ item }) => {
              const active = item === "All" ? !selectedCategory : selectedCategory === item;
              return (
                <Pressable
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedCategory(item === "All" ? null : item)}
                >
                  <Text variant="footnote" color={active ? "brand" : undefined} muted={!active}>
                    {item}
                  </Text>
                </Pressable>
              );
            }}
          />

          {showSearchResults ? (
            !loading && searchResults.length === 0 ? (
              <EmptyState title="No matches" message="Try different keywords or filters." />
            ) : (
              <FlashList
                data={searchResults}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                  <GigCard gig={item} onPress={() => router.push(`/marketplace/gig/${item.id}`)} />
                )}
              />
            )
          ) : !loading &&
            !home.featured.length &&
            !home.topRated.length &&
            !home.newArrivals.length ? (
            <EmptyState
              title="No gigs yet"
              message="Be the first seller in this category, or check back soon."
              actionLabel={profile?.is_business ? "Create gig" : "Become a seller"}
              onAction={openSellerTools}
            />
          ) : (
            <ScrollView contentContainerStyle={styles.sections}>
              <MarketplaceSection
                title="Featured"
                gigs={home.featured}
                sectionKey="featured"
                category={selectedCategory}
              />
              <MarketplaceSection
                title="Top rated"
                gigs={home.topRated}
                sectionKey="top_rated"
                category={selectedCategory}
              />
              <MarketplaceSection
                title="New arrivals"
                gigs={home.newArrivals}
                sectionKey="new"
                category={selectedCategory}
              />
            </ScrollView>
          )}
        </>
      ) : null}

      {tab === "seller" ? (
        <>
          {!loading && myGigs.length === 0 ? (
            <EmptyState
              title="No gigs yet"
              message="Create your first gig to start selling."
              actionLabel="Create gig"
              onAction={() => router.push("/marketplace/create")}
            />
          ) : (
            <FlashList
              data={myGigs}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <SellerDashboardCard
                  gig={item}
                  onPress={() =>
                    item.status === "published"
                      ? router.push(`/marketplace/gig/${item.id}`)
                      : router.push(`/marketplace/create/${item.id}`)
                  }
                  onEdit={
                    item.status === "draft"
                      ? () => router.push(`/marketplace/create/${item.id}`)
                      : undefined
                  }
                />
              )}
              ListHeaderComponent={
                <View style={styles.sellerTools}>
                  <Pressable onPress={() => router.push("/marketplace/posts/create")}>
                    <Text variant="footnote" color="brand">
                      Post business update →
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => router.push("/marketplace/analytics")}>
                    <Text variant="footnote" color="brand">
                      Analytics →
                    </Text>
                  </Pressable>
                  <Pressable style={styles.portfolioLink} onPress={() => router.push("/marketplace/portfolio")}>
                    <Text variant="footnote" color="brand">
                      Manage portfolio →
                    </Text>
                  </Pressable>
                  <View style={styles.vacationRow}>
                    <Text variant="body">Vacation mode</Text>
                    <Switch
                      value={business?.is_vacation_mode ?? false}
                      onValueChange={onVacationToggle}
                      trackColor={{ true: colors.brand.primary }}
                    />
                  </View>
                  {business?.is_vacation_mode ? (
                    <Text variant="footnote" muted>
                      Gigs stay visible; new agreements are blocked.
                    </Text>
                  ) : null}
                </View>
              }
            />
          )}
        </>
      ) : null}

      <MarketplaceFilterSheet
        visible={showFilters}
        filters={filters}
        onClose={() => setShowFilters(false)}
        onApply={setFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  toolbar: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  sellerBtn: { alignSelf: "flex-start" },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.background.tertiary,
  },
  tabActive: { backgroundColor: colors.brand.primaryMuted },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchField: { flex: 1 },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.background.tertiary,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.brand.primaryMuted },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  sections: { paddingBottom: spacing.xl },
  sellerTools: { gap: spacing.sm, marginBottom: spacing.md },
  portfolioLink: {},
  vacationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
});
