import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Flag, X } from "lucide-react-native";
import { submitReport, type ReportReason } from "../api/reportsApi";
import { REPORT_REASON_LABELS, useReportStore } from "../store/reportStore";
import { Button, Text, TextField } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";

const REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

export function ReportSheet() {
  const { target, close } = useReportStore();
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setReason("spam");
    setDetails("");
    setDone(false);
    setSubmitting(false);
  };

  const handleClose = () => {
    close();
    reset();
  };

  const handleSubmit = async () => {
    if (!target) return;
    setSubmitting(true);
    try {
      await submitReport({
        targetType: target.type,
        targetId: target.id,
        reason,
        details: details.trim() || undefined,
      });
      setDone(true);
    } catch (e) {
      Alert.alert("Report failed", e instanceof Error ? e.message : "Try again later");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={!!target} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Flag color={colors.brand.primary} size={20} />
              <Text variant="headline">Report</Text>
            </View>
            <Pressable onPress={handleClose} accessibilityRole="button">
              <X color={colors.text.secondary} size={22} />
            </Pressable>
          </View>

          {done ? (
            <View style={styles.done}>
              <Text variant="body">Thanks — we received your report. Our team will review it.</Text>
              <Button label="Close" onPress={handleClose} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.content}>
              {target?.label ? (
                <Text variant="footnote" muted>
                  Reporting: {target.label}
                </Text>
              ) : null}
              <Text variant="subheadline">Why are you reporting this?</Text>
              {REASONS.map((key) => (
                <Pressable
                  key={key}
                  style={[styles.reason, reason === key && styles.reasonActive]}
                  onPress={() => setReason(key)}
                >
                  <Text variant="body" color={reason === key ? "brand" : undefined}>
                    {REPORT_REASON_LABELS[key]}
                  </Text>
                </Pressable>
              ))}
              <TextField
                label="Additional details (optional)"
                value={details}
                onChangeText={setDetails}
                multiline
              />
              <Button label="Submit report" loading={submitting} onPress={handleSubmit} />
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay.scrim,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface.sheet,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "85%",
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  content: { padding: spacing.md, gap: spacing.sm },
  reason: {
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.background.secondary,
  },
  reasonActive: {
    backgroundColor: colors.brand.primaryMuted,
  },
  done: { padding: spacing.md, gap: spacing.md },
});
