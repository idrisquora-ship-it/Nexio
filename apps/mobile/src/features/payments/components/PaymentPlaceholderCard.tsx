import { StyleSheet, View } from "react-native";
import { Card, Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";
import type { PaymentShellConfig } from "../api/paymentsApi";
import { paymentStatusLabel, type PaymentStatus } from "../api/paymentsApi";

type Props = {
  config: PaymentShellConfig;
  orderStatus?: string;
  paymentStatus?: PaymentStatus;
  priceCents?: number;
  currency?: string;
};

export function PaymentPlaceholderCard({ config, paymentStatus = "not_required", priceCents, currency = "USD" }: Props) {
  const enabled = config.payments_enabled;

  return (
    <Card style={styles.card}>
      <Text variant="headline">Payment</Text>
      <Text variant="body" muted>
        {paymentStatusLabel(paymentStatus)}
      </Text>
      {priceCents != null ? (
        <Text variant="subheadline">
          Order total: {(priceCents / 100).toFixed(2)} {currency}
        </Text>
      ) : null}
      {enabled ? (
        <Text variant="footnote" muted>
          Stripe Connect is being configured. Card payments will appear here when enabled.
        </Text>
      ) : (
        <Text variant="footnote" muted>
          Payments launch in a future update. Orders complete in chat without card capture for now.
          Platform fee when live: {config.platform_fee_percent}%.
        </Text>
      )}
      <View style={styles.pill}>
        <Text variant="caption" muted>
          {enabled ? "Stripe setup pending" : "Coming soon"}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { margin: spacing.md, gap: spacing.sm },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: 999,
    backgroundColor: colors.background.secondary,
  },
});
