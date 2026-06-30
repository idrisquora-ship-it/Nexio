import { View, StyleSheet } from "react-native";
import { Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";
import type { ReportStatus } from "../api/reportsApi";

const LABELS: Record<ReportStatus, string> = {
  pending: "Pending review",
  reviewing: "Under review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const COLORS: Record<ReportStatus, string> = {
  pending: colors.semantic.warning,
  reviewing: colors.semantic.warning,
  resolved: colors.semantic.success,
  dismissed: colors.text.secondary,
};

export function ModerationStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <View style={[styles.badge, { borderColor: COLORS[status] }]}>
      <Text variant="caption" style={{ color: COLORS[status] }}>
        {LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: 999,
    borderWidth: 1,
  },
});
