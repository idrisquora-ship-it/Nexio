import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../../../shared/components";
import { spacing } from "../../../shared/theme";

interface UpdatesFeedSectionProps {
  title: string;
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function UpdatesFeedSection({ title, children, emptyMessage, isEmpty }: UpdatesFeedSectionProps) {
  return (
    <View style={styles.section}>
      <Text variant="title2" style={styles.title}>
        {title}
      </Text>
      {isEmpty ? (
        <Text variant="body" muted style={styles.empty}>
          {emptyMessage ?? "Nothing here yet."}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.lg },
  title: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  empty: { paddingHorizontal: spacing.md },
});
