import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Edit3, Flag, Forward, Languages, Pin, Reply, Smile, Star, Trash2, X } from "lucide-react-native";
import { Text } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";

export type MessageAction =
  | "reply"
  | "forward"
  | "react"
  | "edit"
  | "pin"
  | "unpin"
  | "star"
  | "delete"
  | "report"
  | "translate";

interface MessageActionsSheetProps {
  visible: boolean;
  onClose: () => void;
  onAction: (action: MessageAction) => void;
  isOwn: boolean;
  isText: boolean;
  isPinned: boolean;
  isStarred: boolean;
}

export function MessageActionsSheet({
  visible,
  onClose,
  onAction,
  isOwn,
  isText,
  isPinned,
  isStarred,
}: MessageActionsSheetProps) {
  const actions: {
    action: MessageAction;
    label: string;
    icon: typeof Reply;
    destructive?: boolean;
  }[] = [
    { action: "reply", label: "Reply", icon: Reply },
    { action: "forward", label: "Forward", icon: Forward },
    { action: "react", label: "React", icon: Smile },
    ...(isText && isOwn ? [{ action: "edit" as const, label: "Edit", icon: Edit3 }] : []),
    {
      action: isPinned ? "unpin" : "pin",
      label: isPinned ? "Unpin" : "Pin",
      icon: Pin,
    },
    {
      action: "star",
      label: isStarred ? "Unstar" : "Star",
      icon: Star,
    },
    ...(isText
      ? [{ action: "translate" as const, label: "Translate", icon: Languages }]
      : []),
    ...(isOwn ? [{ action: "delete" as const, label: "Delete", icon: Trash2, destructive: true }] : []),
    ...(!isOwn
      ? [{ action: "report" as const, label: "Report", icon: Flag, destructive: true }]
      : []),
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text variant="headline">Message</Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <X color={colors.text.secondary} size={22} />
            </Pressable>
          </View>
          {actions.map(({ action, label, icon: Icon, destructive }) => (
            <Pressable
              key={action}
              style={styles.row}
              onPress={() => {
                onAction(action);
                onClose();
              }}
            >
              <Icon color={destructive ? colors.semantic.error : colors.text.primary} size={20} />
              <Text variant="body" style={destructive ? styles.destructive : undefined}>
                {label}
              </Text>
            </Pressable>
          ))}
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  destructive: {
    color: colors.semantic.error,
  },
});
