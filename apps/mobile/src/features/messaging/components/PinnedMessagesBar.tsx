import { Pressable, StyleSheet, View } from "react-native";
import { Pin, X } from "lucide-react-native";
import { Text } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";
import type { Message } from "../api/messagingApi";

interface PinnedMessagesBarProps {
  messages: Message[];
  onPressMessage: (message: Message) => void;
  onUnpin: (messageId: string) => void;
}

export function PinnedMessagesBar({ messages, onPressMessage, onUnpin }: PinnedMessagesBarProps) {
  if (!messages.length) return null;

  return (
    <View style={styles.container}>
      <Pin color={colors.brand.primary} size={16} />
      {messages.map((msg) => (
        <Pressable key={msg.id} style={styles.chip} onPress={() => onPressMessage(msg)}>
          <Text variant="footnote" numberOfLines={1} style={styles.chipText}>
            {msg.body || msg.content_type}
          </Text>
          <Pressable onPress={() => onUnpin(msg.id)} hitSlop={8}>
            <X color={colors.text.tertiary} size={14} />
          </Pressable>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  chipText: {
    flex: 1,
  },
});
