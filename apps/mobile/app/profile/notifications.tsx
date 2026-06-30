import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  fetchNotifications,
  fetchUnreadCount,
  getNotificationRoute,
  groupNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationLog,
} from "../../src/features/notifications/api/notificationsApi";
import { NotificationGroupList } from "../../src/features/notifications/components/NotificationGroupList";
import { Button, ScreenHeader, Text } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [notifications, unread] = await Promise.all([
        fetchNotifications(),
        fetchUnreadCount(),
      ]);
      setItems(notifications);
      setUnreadCount(unread);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const handlePress = async (item: NotificationLog) => {
    if (!item.read_at) {
      await markNotificationRead(item.id).catch(() => undefined);
      setUnreadCount((c) => Math.max(0, c - 1));
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
    }
    const route = getNotificationRoute(item.data);
    if (route) router.push(route as never);
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setUnreadCount(0);
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
      />
      {unreadCount > 0 ? (
        <Pressable onPress={handleMarkAll} style={styles.markAll}>
          <Text variant="subheadline" color="brand">
            Mark all as read
          </Text>
        </Pressable>
      ) : null}
      <NotificationGroupList
        groups={groupNotifications(items)}
        onPressItem={handlePress}
        refreshing={loading}
        onRefresh={load}
      />
      <View style={styles.footer}>
        <Button
          label="Notification settings"
          variant="secondary"
          onPress={() => router.push("/settings/notifications")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  markAll: {
    alignSelf: "flex-end",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
});
