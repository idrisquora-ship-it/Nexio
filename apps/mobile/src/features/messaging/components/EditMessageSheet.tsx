import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Button, Text, TextField } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";

interface EditMessageSheetProps {
  visible: boolean;
  initialBody: string;
  onClose: () => void;
  onSave: (body: string) => void;
}

export function EditMessageSheet({ visible, initialBody, onClose, onSave }: EditMessageSheetProps) {
  const [body, setBody] = useState(initialBody);

  useEffect(() => {
    if (visible) setBody(initialBody);
  }, [visible, initialBody]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text variant="headline">Edit message</Text>
          <Text variant="footnote" muted>
            Edits allowed within 15 minutes
          </Text>
          <TextField label="Message" value={body} onChangeText={setBody} multiline />
          <View style={styles.actions}>
            <Button label="Cancel" variant="ghost" onPress={onClose} />
            <Button label="Save" onPress={() => onSave(body.trim())} disabled={!body.trim()} />
          </View>
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
    padding: spacing.md,
    gap: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
