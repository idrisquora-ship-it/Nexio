import { TextInput, TextInputProps, StyleSheet, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme";
import { Text } from "./Text";

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function TextField({ label, error, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text variant="subheadline" muted style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.text.tertiary}
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? (
        <Text variant="footnote" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    marginLeft: spacing.xxs,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
    color: colors.text.primary,
    ...typography.body,
  },
  inputError: {
    borderColor: colors.semantic.error,
  },
  error: {
    color: colors.semantic.error,
    marginLeft: spacing.xxs,
  },
});
