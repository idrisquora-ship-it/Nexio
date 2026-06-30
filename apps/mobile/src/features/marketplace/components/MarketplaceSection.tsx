import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";
import type { GigListItem } from "../api/marketplaceApi";
import { GigCard } from "./GigCard";

interface MarketplaceSectionProps {
  title: string;
  gigs: GigListItem[];
  sectionKey: "featured" | "top_rated" | "new";
  category?: string | null;
}

export function MarketplaceSection({ title, gigs, sectionKey, category }: MarketplaceSectionProps) {
  const router = useRouter();

  if (!gigs.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text variant="headline">{title}</Text>
        <Pressable
          style={styles.seeAll}
          onPress={() =>
            router.push({
              pathname: "/marketplace/browse",
              params: {
                section: sectionKey,
                ...(category ? { category } : {}),
              },
            })
          }
        >
          <Text variant="footnote" color="brand">
            See all
          </Text>
          <ChevronRight color={colors.brand.primary} size={16} />
        </Pressable>
      </View>
      <FlatList
        horizontal
        data={gigs}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <GigCard gig={item} onPress={() => router.push(`/marketplace/gig/${item.id}`)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  seeAll: { flexDirection: "row", alignItems: "center", gap: spacing.xxs },
  list: { paddingHorizontal: spacing.md, gap: spacing.sm },
  cardWrap: { width: 260 },
});
