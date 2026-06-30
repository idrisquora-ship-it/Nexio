import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import {
  listPendingReports,
  processReport,
  type ModerationActionType,
  type Report,
} from "../../../src/features/moderation/api/reportsApi";
import { ModerationStatusBadge } from "../../../src/features/moderation/components/ModerationStatusBadge";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { Button, Card, EmptyState, ScreenHeader, Text } from "../../../src/shared/components";
import { colors, spacing } from "../../../src/shared/theme";

const ACTIONS: { action: ModerationActionType; label: string }[] = [
  { action: "warn", label: "Warn" },
  { action: "remove_content", label: "Remove" },
  { action: "suspend", label: "Suspend" },
  { action: "ban", label: "Ban" },
  { action: "dismiss", label: "Dismiss" },
];

export default function AdminReportsScreen() {
  const { profile } = useAuthStore();
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listPendingReports());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = (report: Report, action: ModerationActionType) => {
    Alert.alert(action, `Apply ${action} to this report?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: action === "dismiss" ? "default" : "destructive",
        onPress: async () => {
          try {
            await processReport(report.id, action);
            await load();
          } catch (e) {
            Alert.alert("Failed", e instanceof Error ? e.message : "Try again");
          }
        },
      },
    ]);
  };

  if (!profile?.is_admin) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Reports" />
        <EmptyState title="Admin only" message="You cannot access the reports queue." />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Reports" subtitle="User-submitted moderation queue" />
      {!loading && items.length === 0 ? (
        <EmptyState title="Queue empty" message="No pending reports." />
      ) : (
        items.map((item) => (
          <Card key={item.id} style={styles.card}>
            <ModerationStatusBadge status={item.status} />
            <Text variant="headline">
              {item.target_type} · {item.reason}
            </Text>
            <Text variant="footnote" muted>
              {new Date(item.created_at).toLocaleString()}
            </Text>
            {item.details ? <Text variant="body">{item.details}</Text> : null}
            <View style={styles.actions}>
              {ACTIONS.map(({ action, label }) => (
                <Button
                  key={action}
                  label={label}
                  variant={action === "dismiss" ? "secondary" : "primary"}
                  onPress={() => act(item, action)}
                  style={styles.actionBtn}
                />
              ))}
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { gap: spacing.sm },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  actionBtn: { flexGrow: 1, minWidth: "30%" },
});
