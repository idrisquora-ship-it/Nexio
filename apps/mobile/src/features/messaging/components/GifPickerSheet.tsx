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
import { fetchGiphyGifs } from "../api/giphyApi";
import { Text } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";
import { FALLBACK_GIFS, type GifItem } from "../constants/richMedia";

interface GifPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (gif: GifItem) => void;
}

export function GifPickerSheet({ visible, onClose, onSelect }: GifPickerSheetProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const results = await fetchGiphyGifs(search);
      setGifs(results.length ? results : FALLBACK_GIFS);
    } catch {
      setGifs(FALLBACK_GIFS);
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
            <Text variant="headline">GIFs</Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <X color={colors.text.secondary} size={22} />
            </Pressable>
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search GIPHY"
            placeholderTextColor={colors.text.secondary}
            style={styles.search}
            autoCorrect={false}
          />
          {loading ? (
            <ActivityIndicator color={colors.brand.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={gifs}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.grid}
              ListEmptyComponent={
                <Text variant="body" muted style={styles.empty}>
                  No GIFs found
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.cell}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Image source={{ uri: item.previewUrl }} style={styles.thumb} resizeMode="cover" />
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
  grid: { paddingHorizontal: spacing.sm },
  cell: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: spacing.xxs,
  },
  thumb: {
    flex: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.background.tertiary,
  },
});
