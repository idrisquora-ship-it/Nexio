import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { clearGigDrafts } from "../../src/shared/lib/gigDraftQueue";
import { clearBusinessEditQueue } from "../../src/shared/lib/businessEditQueue";
import { clearGigWizardQueue } from "../../src/shared/lib/gigWizardQueue";
import { clearMessageQueue } from "../../src/shared/lib/messageQueue";
import { clearStoryQueue } from "../../src/shared/lib/storyQueue";
import { useOfflineSync } from "../../src/providers/OfflineSyncProvider";
import {
  clearGigDraftStorage,
  clearOfflineQueues,
  formatBytes,
  getOfflineStorageBreakdown,
  type StorageBreakdown,
} from "../../src/shared/lib/storageManagement";
import { Button, Card, ScreenHeader, Text } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="subheadline">{label}</Text>
      <Text variant="subheadline" muted>
        {value}
      </Text>
    </View>
  );
}

export default function StorageSettingsScreen() {
  const { refreshPending, syncNow } = useOfflineSync();
  const [breakdown, setBreakdown] = useState<StorageBreakdown | null>(null);

  const load = useCallback(async () => {
    const data = await getOfflineStorageBreakdown();
    setBreakdown(data);
    await refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const confirmClear = (title: string, action: () => Promise<void>) => {
    Alert.alert(title, "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          action()
            .then(load)
            .catch(() => Alert.alert("Storage", "Could not clear data."));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Storage" subtitle="Offline queues and drafts" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text variant="headline">Offline data</Text>
          <Text variant="footnote" muted>
            Queued messages, uploads, and drafts stored on this device.
          </Text>
          {breakdown ? (
            <>
              <Row label="Total" value={formatBytes(breakdown.totalBytes)} />
              <Row label="Message queue" value={formatBytes(breakdown.messageQueueBytes)} />
              <Row label="Media uploads" value={formatBytes(breakdown.uploadQueueBytes)} />
              <Row label="Story queue" value={formatBytes(breakdown.storyQueueBytes)} />
              <Row label="Gig drafts" value={formatBytes(breakdown.gigDraftsBytes)} />
              <Row label="Gig wizard queue" value={formatBytes(breakdown.gigWizardBytes)} />
              <Row label="Business edits" value={formatBytes(breakdown.businessEditBytes)} />
            </>
          ) : null}
        </Card>

        <Button label="Sync now" onPress={() => syncNow().then(load)} />
        <Button
          label="Clear offline queues"
          variant="secondary"
          onPress={() =>
            confirmClear("Clear offline queues", async () => {
              await clearOfflineQueues();
              await clearMessageQueue();
              await clearStoryQueue();
              await clearBusinessEditQueue();
              await clearGigWizardQueue();
            })
          }
        />
        <Button
          label="Clear gig drafts"
          variant="secondary"
          onPress={() =>
            confirmClear("Clear gig drafts", async () => {
              await clearGigDrafts();
              await clearGigDraftStorage();
            })
          }
        />
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
    justifyContent: "space-between",
    alignItems: "center",
  },
});
