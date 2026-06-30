import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { searchGlobal, type GlobalSearchResults } from "../src/features/discovery/api/searchApi";
import { Avatar, ScreenHeader, Text, TextField } from "../src/shared/components";
import { colors, spacing } from "../src/shared/theme";

type SearchRow =
  | { kind: "section"; title: string }
  | { kind: "person"; id: string; title: string; subtitle: string; avatarUrl: string | null }
  | { kind: "business"; slug: string; title: string; subtitle: string; avatarUrl: string | null }
  | { kind: "gig"; id: string; title: string; subtitle: string }
  | { kind: "community"; id: string; title: string; subtitle: string }
  | { kind: "channel"; id: string; title: string; subtitle: string };

const EMPTY: GlobalSearchResults = {
  people: [],
  businesses: [],
  gigs: [],
  communities: [],
  channels: [],
};

function buildRows(results: GlobalSearchResults): SearchRow[] {
  const rows: SearchRow[] = [];
  if (results.people.length) {
    rows.push({ kind: "section", title: "People" });
    for (const p of results.people) {
      rows.push({
        kind: "person",
        id: p.id,
        title: p.display_name,
        subtitle: `@${p.username}`,
        avatarUrl: p.avatar_url,
      });
    }
  }
  if (results.businesses.length) {
    rows.push({ kind: "section", title: "Businesses" });
    for (const b of results.businesses) {
      rows.push({
        kind: "business",
        slug: b.slug,
        title: b.business_name,
        subtitle: b.category ?? `@${b.slug}`,
        avatarUrl: b.logo_url,
      });
    }
  }
  if (results.gigs.length) {
    rows.push({ kind: "section", title: "Marketplace" });
    for (const g of results.gigs) {
      rows.push({
        kind: "gig",
        id: g.id,
        title: g.title,
        subtitle: g.business_profiles?.business_name ?? g.category,
      });
    }
  }
  if (results.communities.length) {
    rows.push({ kind: "section", title: "Communities" });
    for (const c of results.communities) {
      rows.push({
        kind: "community",
        id: c.id,
        title: c.name,
        subtitle: `@${c.slug}`,
      });
    }
  }
  if (results.channels.length) {
    rows.push({ kind: "section", title: "Channels" });
    for (const ch of results.channels) {
      rows.push({
        kind: "channel",
        id: ch.id,
        title: ch.name,
        subtitle: ch.description ?? "Channel",
      });
    }
  }
  return rows;
}

export default function GlobalSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(EMPTY);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchGlobal(trimmed);
        setResults(data);
      } catch {
        setResults(EMPTY);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const rows = buildRows(results);

  const onPressRow = async (row: SearchRow) => {
    if (row.kind === "section") return;
    if (row.kind === "person") {
      router.push(`/user/${row.id}`);
      return;
    }
    if (row.kind === "business") {
      router.push(`/business/${row.slug}`);
      return;
    }
    if (row.kind === "gig") {
      router.push(`/marketplace/gig/${row.id}`);
      return;
    }
    if (row.kind === "community") {
      router.push(`/community/${row.id}`);
      return;
    }
    if (row.kind === "channel") {
      router.push(`/updates/channel/${row.id}`);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Search" subtitle="People, businesses, gigs, and more" />
      <View style={styles.search}>
        <TextField
          label="Search Nexio"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          placeholder="Try a name, business, or gig"
        />
      </View>
      {loading ? (
        <ActivityIndicator color={colors.brand.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, index) =>
            item.kind === "section" ? `section-${item.title}` : `${item.kind}-${index}`
          }
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            query.trim().length >= 2 ? (
              <Text variant="body" muted style={styles.empty}>
                No results found
              </Text>
            ) : (
              <Text variant="body" muted style={styles.empty}>
                Type at least 2 characters
              </Text>
            )
          }
          renderItem={({ item }) => {
            if (item.kind === "section") {
              return (
                <Text variant="title2" style={styles.section}>
                  {item.title}
                </Text>
              );
            }
            return (
              <Pressable style={styles.row} onPress={() => onPressRow(item)}>
                {item.kind === "person" || item.kind === "business" ? (
                  <Avatar name={item.title} uri={item.avatarUrl} size={44} />
                ) : (
                  <View style={styles.iconPlaceholder} />
                )}
                <View style={styles.meta}>
                  <Text variant="headline">{item.title}</Text>
                  <Text variant="footnote" muted>
                    {item.subtitle}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  search: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  loader: { marginTop: spacing.lg },
  section: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  meta: { flex: 1 },
  iconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
  },
  empty: { padding: spacing.lg, textAlign: "center" },
});
