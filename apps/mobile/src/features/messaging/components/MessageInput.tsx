import { useState } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { Mic, Paperclip, Send } from "lucide-react-native";
import { colors, radius, spacing, typography } from "../../../shared/theme";

interface MessageInputProps {
  onSend: (text: string) => void;
  onAttach?: () => void;
  onVoiceNote?: () => void;
  onChangeText?: (text: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onAttach, onVoiceNote, onChangeText, disabled }: MessageInputProps) {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <View style={styles.container}>
      {onAttach ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAttach}
          disabled={disabled}
          style={[styles.iconButton, disabled && styles.disabled]}
        >
          <Paperclip color={colors.brand.primary} size={22} />
        </Pressable>
      ) : null}
      <TextInput
        value={text}
        onChangeText={(value) => {
          setText(value);
          onChangeText?.(value);
        }}
        placeholder="Message"
        placeholderTextColor={colors.text.tertiary}
        style={styles.input}
        multiline
        maxLength={10000}
      />
      {text.trim() ? (
        <Pressable
          accessibilityRole="button"
          onPress={handleSend}
          disabled={disabled}
          style={[styles.sendButton, disabled && styles.disabled]}
        >
          <Send color={colors.text.inverse} size={20} />
        </Pressable>
      ) : onVoiceNote ? (
        <Pressable
          accessibilityRole="button"
          onPress={onVoiceNote}
          disabled={disabled}
          style={[styles.iconButton, disabled && styles.disabled]}
        >
          <Mic color={colors.brand.primary} size={22} />
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={handleSend}
          disabled
          style={[styles.sendButton, styles.disabled]}
        >
          <Send color={colors.text.inverse} size={20} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.secondary,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.tertiary,
    color: colors.text.primary,
    ...typography.body,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
});
