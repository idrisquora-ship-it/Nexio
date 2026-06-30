import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Camera, FileText, Image as ImageIcon, MapPin, Mic, Smile, User, Video, X } from "lucide-react-native";
import { Text } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";

export type MediaPickerAction =
  | "camera"
  | "image"
  | "video"
  | "document"
  | "voice"
  | "gif"
  | "sticker"
  | "location"
  | "contact";

interface MediaPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (action: MediaPickerAction) => void;
}

const OPTIONS: { action: MediaPickerAction; label: string; icon: typeof ImageIcon }[] = [
  { action: "camera", label: "Camera", icon: Camera },
  { action: "image", label: "Photo", icon: ImageIcon },
  { action: "video", label: "Video", icon: Video },
  { action: "gif", label: "GIF", icon: ImageIcon },
  { action: "sticker", label: "Sticker", icon: Smile },
  { action: "location", label: "Location", icon: MapPin },
  { action: "contact", label: "Contact", icon: User },
  { action: "document", label: "Document", icon: FileText },
  { action: "voice", label: "Voice note", icon: Mic },
];

export function MediaPickerSheet({ visible, onClose, onSelect }: MediaPickerSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text variant="headline">Attach</Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <X color={colors.text.secondary} size={22} />
            </Pressable>
          </View>
          {OPTIONS.map(({ action, label, icon: Icon }) => (
            <Pressable
              key={action}
              style={styles.row}
              onPress={() => {
                onSelect(action);
                onClose();
              }}
            >
              <View style={styles.iconWrap}>
                <Icon color={colors.brand.primary} size={22} />
              </View>
              <Text variant="body">{label}</Text>
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
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },
});
