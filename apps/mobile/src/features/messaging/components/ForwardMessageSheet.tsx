import { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { fetchConversations, getConversationTitle, type ConversationListItem } from "../api/messagingApi";
import { Avatar, Text, TextField } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";

interface ForwardMessageSheetProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onSelect: (conversationId: string) => void;
}

export function ForwardMessageSheet({ visible, userId, onClose, onSelect }: ForwardMessageSheetProps) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!visible || !userId) return;
    fetchConversations(userId).then(setConversations).catch(() => setConversations([]));
  }, [visible, userId]);

  const filtered = conversations.filter((c) => {
    const title = getConversationTitle(c).toLowerCase();
    return title.includes(query.toLowerCase());
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.sheet}>
          <Text variant="headline" style={styles.title}>
            Forward to
          </Text>
          <TextField
            label="Search chats"
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            autoCapitalize="none"
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const title = getConversationTitle(item);
              return (
                <Pressable style={styles.row} onPress={() => onSelect(item.id)}>
                  <Avatar name={title} uri={item.other_user?.avatar_url ?? item.avatar_url} size={44} />
                  <Text variant="body">{title}</Text>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text variant="body" muted style={styles.empty}>
                No conversations found
              </Text>
            }
          />
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text variant="body" muted>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "70%",
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  empty: {
    textAlign: "center",
    padding: spacing.lg,
  },
  cancel: {
    alignItems: "center",
    padding: spacing.md,
  },
});
