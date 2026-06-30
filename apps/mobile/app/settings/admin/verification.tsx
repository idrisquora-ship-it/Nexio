import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  listPendingVerifications,
  processVerificationSubmission,
} from "../../../src/features/marketplace/api/analyticsApi";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { Button, Card, EmptyState, ScreenHeader, Text } from "../../../src/shared/components";
import { colors, spacing } from "../../../src/shared/theme";

type Submission = {
  id: string;
  business_id: string;
  document_url: string;
  status: string;
  created_at: string;
};

export default function AdminVerificationScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listPendingVerifications();
      setItems(rows as Submission[]);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const process = (id: string, approve: boolean) => {
    Alert.alert(approve ? "Approve" : "Reject", "Confirm verification decision?", [
      { text: "Cancel", style: "cancel" },
      {
        text: approve ? "Approve" : "Reject",
        style: approve ? "default" : "destructive",
        onPress: async () => {
          try {
            await processVerificationSubmission(id, approve);
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
        <ScreenHeader title="Admin" />
        <EmptyState title="Admin only" message="You do not have permission to review verifications." />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Verification queue" subtitle="Approve or reject seller documents" />
      {!loading && items.length === 0 ? (
        <EmptyState title="Queue empty" message="No pending verification submissions." />
      ) : (
        items.map((item) => (
          <Card key={item.id} style={styles.card}>
            <Text variant="footnote" muted>
              {new Date(item.created_at).toLocaleString()}
            </Text>
            <Text variant="body" numberOfLines={1}>
              Doc: {item.document_url}
            </Text>
            <View style={styles.actions}>
              <Button label="Approve" onPress={() => process(item.id, true)} style={styles.btn} />
              <Button label="Reject" variant="secondary" onPress={() => process(item.id, false)} style={styles.btn} />
            </View>
          </Card>
        ))
      )}
      <Button label="Back" variant="secondary" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { gap: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.sm },
  btn: { flex: 1 },
});
