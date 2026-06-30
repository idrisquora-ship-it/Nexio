import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { searchGlobal } from "../../discovery/api/searchApi";
import { Avatar, Text, TextField } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";

export type ContactPick = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

interface ContactPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (contact: ContactPick) => void;
}

export function ContactPickerSheet({ visible, onClose, onSelect }: ContactPickerSheetProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContactPick[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      return;
    }
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchGlobal(query.trim());
        setResults(
          data.people.map((p) => ({
            userId: p.id,
            username: p.username,
            displayName: p.display_name,
            avatarUrl: p.avatar_url,
          })),
        );
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text variant="headline">Share contact</Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <X color={colors.text.secondary} size={22} />
            </Pressable>
          </View>
          <View style={styles.searchWrap}>
            <TextField
              value={query}
              onChangeText={setQuery}
              placeholder="Search people"
              autoCorrect={false}
            />
          </View>
          {loading ? (
            <ActivityIndicator color={colors.brand.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.userId}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                query.trim() ? (
                  <Text variant="body" muted style={styles.empty}>
                    No people found
                  </Text>
                ) : (
                  <Text variant="body" muted style={styles.empty}>
                    Type a name or @username
                  </Text>
                )
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.row}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Avatar name={item.displayName} uri={item.avatarUrl} size={40} />
                  <View style={styles.meta}>
                    <Text variant="body">{item.displayName}</Text>
                    <Text variant="footnote" muted>
                      @{item.username}
                    </Text>
                  </View>
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
  searchWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  loader: { padding: spacing.xl },
  empty: { padding: spacing.md, textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  meta: { flex: 1 },
});
