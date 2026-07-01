import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Search, Star } from "lucide-react-native";
import { ConversationRow } from "../../../src/features/messaging/components/ConversationRow";
import {
  fetchConversations,
  getConversationTitle,
  markConversationUnread,
  subscribeToConversations,
  updateConversationParticipant,
  type ConversationListItem,
} from "../../../src/features/messaging/api/messagingApi";
import { fetchStoryTray } from "../../../src/features/updates/api/updatesApi";
import { StoryRing } from "../../../src/features/updates/components/StoryRing";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { EmptyState, ScreenHeader, Text } from "../../../src/shared/components";
import { useScreenFocusEffect } from "../../../src/shared/hooks/useScreenFocusEffect";
import { colors, spacing } from "../../../src/shared/theme";
import type { StoryTrayUser } from "../../../src/features/updates/api/updatesApi";

export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [storyTray, setStoryTray] = useState<StoryTrayUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [data, tray] = await Promise.all([
        fetchConversations(user.id),
        fetchStoryTray(user.id),
      ]);
      setConversations(data);
      setStoryTray(tray);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useScreenFocusEffect(() => {
    if (!user) return;
    load();
  }, [user, load]);

  useEffect(() => {
    if (!user) return;
    return subscribeToConversations(user.id, load);
  }, [user, load]);

  const visible = unreadOnly ? conversations.filter((c) => c.has_unread) : conversations;

  const showConversationActions = (item: ConversationListItem) => {
    const title = getConversationTitle(item);
    Alert.alert(title, undefined, [
      {
        text: item.participant?.pinned ? "Unpin" : "Pin",
        onPress: async () => {
          await updateConversationParticipant(item.id, { pinned: !item.participant?.pinned });
          load();
        },
      },
      {
        text: item.participant?.muted ? "Unmute" : "Mute",
        onPress: async () => {
          await updateConversationParticipant(item.id, { muted: !item.participant?.muted });
          load();
        },
      },
      {
        text: "Archive",
        onPress: async () => {
          await updateConversationParticipant(item.id, { archived: true });
          load();
        },
      },
      {
        text: "Mark unread",
        onPress: () => markUnread(item.id),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const markUnread = (conversationId: string) => {
    Alert.alert("Mark as unread", "Mark this chat as unread?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark unread",
        onPress: async () => {
          await markConversationUnread(conversationId);
          load();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ScreenHeader title="Chats" />
        <Pressable style={styles.searchBtn} onPress={() => router.push("/search")}>
          <Search color={colors.brand.primary} size={22} />
        </Pressable>
      </View>

      <StoryRing
        tray={storyTray}
        currentUserId={user?.id}
        onAddStory={() => router.push("/updates/story/create")}
        onOpenUser={(userId) => router.push(`/updates/story/${userId}`)}
      />

      <View style={styles.toolbar}>
        <Pressable style={styles.newChat} onPress={() => router.push("/(tabs)/chats/new")}>
          <Text variant="headline" color="brand">
            New chat
          </Text>
        </Pressable>
        <Pressable style={styles.newChat} onPress={() => router.push("/(tabs)/chats/new-group")}>
          <Text variant="subheadline" color="brand">
            New group
          </Text>
        </Pressable>
        <Pressable style={styles.newChat} onPress={() => router.push("/(tabs)/chats/starred")}>
          <Star color={colors.brand.primary} size={18} />
          <Text variant="subheadline" color="brand">
            Starred
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.filterChip, unreadOnly && styles.filterActive]}
        onPress={() => setUnreadOnly((v) => !v)}
      >
        <Text variant="footnote" color={unreadOnly ? "brand" : undefined} muted={!unreadOnly}>
          Unread only
        </Text>
      </Pressable>

      {!loading && visible.length === 0 ? (
        <EmptyState
          title={unreadOnly ? "All caught up" : "No chats yet"}
          message={
            unreadOnly
              ? "You have no unread conversations."
              : "Start a conversation from global search."
          }
          actionLabel={unreadOnly ? undefined : "Search Nexio"}
          onAction={unreadOnly ? undefined : () => router.push("/search")}
        />
      ) : (
        <FlashList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              onPress={() => router.push(`/(tabs)/chats/${item.id}`)}
              onLongPress={() => showConversationActions(item)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingRight: spacing.md,
  },
  searchBtn: {
    paddingTop: spacing.lg,
    padding: spacing.xs,
  },
  toolbar: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    gap: spacing.lg,
    flexWrap: "wrap",
  },
  newChat: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  filterChip: {
    alignSelf: "flex-start",
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.background.tertiary,
  },
  filterActive: {
    backgroundColor: colors.brand.primaryMuted,
  },
});
