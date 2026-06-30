import { View, StyleSheet, Pressable } from "react-native";
import { Avatar, Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";
import type { ConversationListItem } from "../api/messagingApi";
import { getConversationTitle } from "../api/messagingApi";

interface ConversationRowProps {
  item: ConversationListItem;
  onPress: () => void;
  onLongPress?: () => void;
}

export function ConversationRow({ item, onPress, onLongPress }: ConversationRowProps) {
  const title = getConversationTitle(item);
  const subtitle = item.last_message_preview ?? "Start the conversation";

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={styles.row}>
      <Avatar name={title} uri={item.other_user?.avatar_url} size={52} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text variant="headline" numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          {item.has_unread ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text variant="subheadline" muted numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  content: {
    flex: 1,
    gap: spacing.xxs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  title: {
    flex: 1,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand.primary,
  },
});
