import { View, StyleSheet } from "react-native";
import { CornerDownRight, X } from "lucide-react-native";
import { Pressable } from "react-native";
import { Text } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";
import type { Message } from "../api/messagingApi";

interface ReplyPreviewProps {
  message: Message;
  previewText: string;
  onCancel: () => void;
}

export function ReplyPreview({ message, previewText, onCancel }: ReplyPreviewProps) {
  return (
    <View style={styles.container}>
      <CornerDownRight color={colors.brand.primary} size={18} />
      <View style={styles.content}>
        <Text variant="footnote" color="brand">
          Replying
        </Text>
        <Text variant="footnote" muted numberOfLines={1}>
          {previewText || message.body || "Media"}
        </Text>
      </View>
      <Pressable onPress={onCancel} hitSlop={8} accessibilityRole="button">
        <X color={colors.text.tertiary} size={18} />
      </Pressable>
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.secondary,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand.primary,
    marginHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  content: {
    flex: 1,
    gap: 2,
  },
});
