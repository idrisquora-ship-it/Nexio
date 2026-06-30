import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, View } from "react-native";
import {
  fetchPrivacySettings,
  updatePrivacySettings,
  type PrivacySettings,
} from "../../src/features/auth/api/privacyApi";
import { useAuthStore } from "../../src/features/auth/store/authStore";
import { Card, ScreenHeader, Text } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

type ToggleKey = keyof Pick<
  PrivacySettings,
  "show_online" | "show_last_seen" | "show_typing" | "show_read_receipts" | "phone_discoverable"
>;

const ROWS: { key: ToggleKey; title: string; subtitle: string }[] = [
  { key: "show_online", title: "Show online status", subtitle: "Let others see when you're active" },
  { key: "show_last_seen", title: "Last seen", subtitle: "Show when you were last active" },
  { key: "show_typing", title: "Typing indicator", subtitle: "Show when you're typing in chats" },
  { key: "show_read_receipts", title: "Read receipts", subtitle: "Let others know when you've read messages" },
  {
    key: "phone_discoverable",
    title: "Discoverable by phone",
    subtitle: "Allow contacts to find you if you add a phone number",
  },
];

export default function PrivacySettingsScreen() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchPrivacySettings(user.id);
      setSettings(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const toggle = async (key: ToggleKey, value: boolean) => {
    if (!user || !settings) return;
    setSettings({ ...settings, [key]: value });
    try {
      const updated = await updatePrivacySettings(user.id, { [key]: value });
      setSettings(updated);
    } catch (e) {
      await load();
      Alert.alert("Privacy", e instanceof Error ? e.message : "Could not save setting.");
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Privacy" subtitle="Online status and discoverability" />
      <ScrollView contentContainerStyle={styles.content}>
        {ROWS.map((row) => (
          <Card key={row.key} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.label}>
                <Text variant="headline">{row.title}</Text>
                <Text variant="footnote" muted>
                  {row.subtitle}
                </Text>
              </View>
              <Switch
                value={settings?.[row.key] ?? true}
                disabled={loading || !settings}
                onValueChange={(value) => toggle(row.key, value)}
                trackColor={{ false: colors.border.default, true: colors.brand.primaryMuted }}
                thumbColor={settings?.[row.key] ? colors.brand.primary : colors.text.secondary}
              />
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  card: { gap: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  label: { flex: 1, gap: spacing.xxs },
});
