import { Pressable, StyleSheet, View } from "react-native";
import type { NotificationLog } from "../api/notificationsApi";
import { Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";

type Props = {
  item: NotificationLog;
  onPress: () => void;
};

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function NotificationRow({ item, onPress }: Props) {
  const unread = !item.read_at;

  return (
    <Pressable onPress={onPress} style={[styles.row, unread && styles.unread]}>
      <View style={styles.content}>
        <Text variant="headline">{item.title}</Text>
        <Text variant="subheadline" muted numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      <Text variant="caption" muted>
        {formatTime(item.created_at)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  unread: {
    backgroundColor: colors.background.secondary,
  },
  content: {
    flex: 1,
    gap: spacing.xxs,
  },
});
