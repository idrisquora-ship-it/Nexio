import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { fetchGiphyStickers } from "../api/giphyApi";
import { Text } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";
import type { StickerItem } from "../constants/richMedia";

interface StickerPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (sticker: StickerItem) => void;
}

export function StickerPickerSheet({ visible, onClose, onSelect }: StickerPickerSheetProps) {
  const [query, setQuery] = useState("");
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const results = await fetchGiphyStickers(search);
      setStickers(results);
    } catch {
      setStickers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    setQuery("");
    load("");
  }, [visible, load]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => load(query), 350);
    return () => clearTimeout(timer);
  }, [query, visible, load]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text variant="headline">Stickers</Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <X color={colors.text.secondary} size={22} />
            </Pressable>
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search GIPHY stickers"
            placeholderTextColor={colors.text.secondary}
            style={styles.search}
            autoCorrect={false}
          />
          {loading ? (
            <ActivityIndicator color={colors.brand.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={stickers}
              keyExtractor={(item) => item.id}
              numColumns={4}
              contentContainerStyle={styles.grid}
              ListEmptyComponent={
                <Text variant="body" muted style={styles.empty}>
                  No stickers found
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.cell}
                  accessibilityLabel={item.label}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Image source={{ uri: item.previewUrl }} style={styles.thumb} resizeMode="contain" />
                </Pressable>
              )}
            />
          )}
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
    maxHeight: "70%",
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  search: {
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background.tertiary,
    color: colors.text.primary,
  },
  loader: { padding: spacing.xl },
  empty: { padding: spacing.xl, textAlign: "center" },
  grid: { padding: spacing.sm },
  cell: {
    flex: 1 / 4,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxs,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
});
