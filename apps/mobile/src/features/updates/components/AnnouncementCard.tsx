import { Card, Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";
import { StyleSheet, View } from "react-native";
import type { Announcement } from "../../moderation/api/reportsApi";

type Props = {
  item: Announcement;
};

export function AnnouncementCard({ item }: Props) {
  const important = item.priority === "important";
  return (
    <Card style={[styles.card, important && styles.important]}>
      {important ? (
        <Text variant="caption" color="brand">
          Important
        </Text>
      ) : null}
      <Text variant="headline">{item.title}</Text>
      <Text variant="body">{item.body}</Text>
      <Text variant="caption" muted>
        {new Date(item.starts_at).toLocaleDateString()}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  important: {
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
});
