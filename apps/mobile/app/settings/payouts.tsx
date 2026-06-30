import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { fetchMyBusiness } from "../../src/features/marketplace/api/marketplaceApi";
import {
  fetchPaymentShellConfig,
  fetchSellerPayoutAccount,
  type PaymentShellConfig,
} from "../../src/features/payments/api/paymentsApi";
import { useAuthStore } from "../../src/features/auth/store/authStore";
import { useFeatureFlags } from "../../src/providers/FeatureFlagsProvider";
import { Button, Card, EmptyState, ScreenHeader, Text } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

export default function PayoutSettingsScreen() {
  const { user } = useAuthStore();
  const { isEnabled } = useFeatureFlags();
  const [config, setConfig] = useState<PaymentShellConfig | null>(null);
  const [connectReady, setConnectReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchPaymentShellConfig().then(setConfig).catch(() => setConfig(null));
    fetchMyBusiness(user.id)
      .then((biz) => (biz ? fetchSellerPayoutAccount(biz.id) : null))
      .then((row) => setConnectReady(Boolean(row?.onboarding_completed)))
      .catch(() => setConnectReady(false));
  }, [user]);

  const paymentsFlag = isEnabled("ff_payments_enabled", false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Payouts" subtitle="Stripe Connect (coming soon)" />
      {!user ? (
        <EmptyState title="Sign in required" message="Log in to manage payout settings." />
      ) : (
        <>
          <Card style={styles.card}>
            <Text variant="headline">Status</Text>
            <Text variant="body" muted>
              {paymentsFlag
                ? "Payments flag is on — Stripe Connect onboarding will appear here."
                : "Payments are disabled. Orders work without card capture until launch."}
            </Text>
            <Text variant="footnote" muted>
              Platform fee when live: {config?.platform_fee_percent ?? 10}% · Payout delay:{" "}
              {config?.payout_delay_days ?? 7} days
            </Text>
          </Card>
          <Card style={styles.card}>
            <Text variant="headline">Stripe Connect</Text>
            <Text variant="body" muted>
              {connectReady
                ? "Connect account linked (placeholder)."
                : "Not connected — sellers will complete onboarding when payments go live."}
            </Text>
            <Button
              label="Set up payouts"
              disabled={!paymentsFlag}
              onPress={() => undefined}
            />
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { gap: spacing.sm },
});
