import { Modal, Pressable, StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";
import { Button, Text } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";
import {
  DEFAULT_MARKETPLACE_FILTERS,
  type MarketplaceFilters,
} from "../api/marketplaceApi";

interface MarketplaceFilterSheetProps {
  visible: boolean;
  filters: MarketplaceFilters;
  onClose: () => void;
  onApply: (filters: MarketplaceFilters) => void;
}

const SORT_OPTIONS: { value: MarketplaceFilters["sort"]; label: string }[] = [
  { value: "ranked", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top rated" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

const RATING_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Any rating" },
  { value: 4, label: "4+ stars" },
  { value: 4.5, label: "4.5+ stars" },
];

const PRICE_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Any price" },
  { value: 5000, label: "Under $50" },
  { value: 10000, label: "Under $100" },
  { value: 25000, label: "Under $250" },
];

export function MarketplaceFilterSheet({
  visible,
  filters,
  onClose,
  onApply,
}: MarketplaceFilterSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text variant="headline">Filters</Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <X color={colors.text.secondary} size={22} />
            </Pressable>
          </View>

          <Text variant="footnote" muted style={styles.sectionLabel}>
            Sort by
          </Text>
          <View style={styles.chips}>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.chip, filters.sort === opt.value && styles.chipActive]}
                onPress={() => onApply({ ...filters, sort: opt.value })}
              >
                <Text variant="footnote" color={filters.sort === opt.value ? "brand" : undefined}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text variant="footnote" muted style={styles.sectionLabel}>
            Minimum rating
          </Text>
          <View style={styles.chips}>
            {RATING_OPTIONS.map((opt) => (
              <Pressable
                key={opt.label}
                style={[styles.chip, filters.minRating === opt.value && styles.chipActive]}
                onPress={() => onApply({ ...filters, minRating: opt.value })}
              >
                <Text variant="footnote" color={filters.minRating === opt.value ? "brand" : undefined}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text variant="footnote" muted style={styles.sectionLabel}>
            Max price
          </Text>
          <View style={styles.chips}>
            {PRICE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.label}
                style={[styles.chip, filters.maxPriceCents === opt.value && styles.chipActive]}
                onPress={() => onApply({ ...filters, maxPriceCents: opt.value })}
              >
                <Text
                  variant="footnote"
                  color={filters.maxPriceCents === opt.value ? "brand" : undefined}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.footer}>
            <Button
              variant="secondary"
              label="Reset"
              onPress={() => onApply(DEFAULT_MARKETPLACE_FILTERS)}
            />
            <Button label="Done" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.xxl,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  sectionLabel: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.background.tertiary,
  },
  chipActive: { backgroundColor: colors.brand.primaryMuted },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
});
