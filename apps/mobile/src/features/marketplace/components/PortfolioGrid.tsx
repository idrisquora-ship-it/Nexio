import { Image, Pressable, StyleSheet, View } from "react-native";
import { Text } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";
import type { PortfolioItem } from "../api/marketplaceApi";

interface PortfolioGridProps {
  items: PortfolioItem[];
  onPress?: (item: PortfolioItem) => void;
}

export function PortfolioGrid({ items, onPress }: PortfolioGridProps) {
  if (!items.length) {
    return (
      <Text variant="body" muted style={styles.empty}>
        No portfolio items yet.
      </Text>
    );
  }

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Pressable key={item.id} style={styles.item} onPress={() => onPress?.(item)}>
          <Image source={{ uri: item.media_url }} style={styles.image} />
          <Text variant="footnote" numberOfLines={1} style={styles.title}>
            {item.title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  item: {
    width: "47%",
    backgroundColor: colors.surface.card,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  image: { width: "100%", height: 120 },
  title: { padding: spacing.sm },
  empty: { paddingHorizontal: spacing.md, paddingVertical: spacing.lg },
});
