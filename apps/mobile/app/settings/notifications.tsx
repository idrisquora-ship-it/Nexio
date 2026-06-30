import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, View } from "react-native";
import {
  fetchNotificationPreferences,
  NOTIFICATION_CATEGORY_LABELS,
  updateNotificationPreference,
  type NotificationCategory,
  type NotificationPreference,
} from "../../src/features/notifications/api/notificationsApi";
import { Card, ScreenHeader, Text } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

export default function NotificationSettingsScreen() {
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotificationPreferences();
      setPrefs(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const toggle = async (
    category: NotificationCategory,
    field: "push_enabled" | "in_app_enabled",
    value: boolean,
  ) => {
    if (category === "call" && field === "push_enabled" && !value) {
      Alert.alert("Calls", "Incoming call alerts stay enabled for reliability.");
      return;
    }

    setPrefs((prev) =>
      prev.map((p) => (p.category === category ? { ...p, [field]: value } : p)),
    );

    try {
      await updateNotificationPreference(category, { [field]: value });
    } catch (e) {
      await load();
      Alert.alert("Settings", e instanceof Error ? e.message : "Could not save preference.");
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notifications" subtitle="Push and in-app alerts" />
      <ScrollView contentContainerStyle={styles.content}>
        {prefs.map((pref) => (
          <Card key={pref.category} style={styles.card}>
            <Text variant="headline">
              {NOTIFICATION_CATEGORY_LABELS[pref.category as NotificationCategory]}
            </Text>
            <View style={styles.row}>
              <View style={styles.label}>
                <Text variant="subheadline">Push</Text>
                <Text variant="caption" muted>
                  Lock screen alerts
                </Text>
              </View>
              <Switch
                value={pref.category === "call" ? true : pref.push_enabled}
                disabled={pref.category === "call" || loading}
                onValueChange={(value) => toggle(pref.category, "push_enabled", value)}
                trackColor={{ false: colors.border.default, true: colors.brand.primaryMuted }}
                thumbColor={pref.push_enabled ? colors.brand.primary : colors.text.secondary}
              />
            </View>
            <View style={styles.row}>
              <View style={styles.label}>
                <Text variant="subheadline">In-app</Text>
                <Text variant="caption" muted>
                  Notification center
                </Text>
              </View>
              <Switch
                value={pref.in_app_enabled}
                disabled={loading}
                onValueChange={(value) => toggle(pref.category, "in_app_enabled", value)}
                trackColor={{ false: colors.border.default, true: colors.brand.primaryMuted }}
                thumbColor={pref.in_app_enabled ? colors.brand.primary : colors.text.secondary}
              />
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  card: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  label: {
    flex: 1,
    gap: spacing.xxs,
  },
});
