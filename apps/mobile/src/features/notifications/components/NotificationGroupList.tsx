import { SectionList, StyleSheet, View } from "react-native";
import type { NotificationGroup } from "../api/notificationsApi";
import { NotificationRow } from "./NotificationRow";
import { EmptyState, Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";
import type { NotificationLog } from "../api/notificationsApi";

type Props = {
  groups: NotificationGroup[];
  onPressItem: (item: NotificationLog) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function NotificationGroupList({ groups, onPressItem, refreshing, onRefresh }: Props) {
  if (!groups.length) {
    return <EmptyState title="No notifications" message="You're all caught up." />;
  }

  const sections = groups.map((group) => ({
    title: group.title,
    data: group.items,
  }));

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      refreshing={refreshing}
      onRefresh={onRefresh}
      renderSectionHeader={({ section }) => (
        <View style={styles.header}>
          <Text variant="footnote" muted>
            {section.title}
          </Text>
        </View>
      )}
      renderItem={({ item }) => <NotificationRow item={item} onPress={() => onPressItem(item)} />}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background.primary,
  },
});
