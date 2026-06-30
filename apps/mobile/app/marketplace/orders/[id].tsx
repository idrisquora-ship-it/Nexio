import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { fetchGigById, formatPrice } from "../../../src/features/marketplace/api/marketplaceApi";
import { fetchOrderById, orderStatusLabel } from "../../../src/features/orders/api/ordersApi";
import {
  fetchPaymentShellConfig,
  type PaymentShellConfig,
} from "../../../src/features/payments/api/paymentsApi";
import { PaymentPlaceholderCard } from "../../../src/features/payments/components/PaymentPlaceholderCard";
import { ScreenHeader, Text } from "../../../src/shared/components";
import { colors, spacing } from "../../../src/shared/theme";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Awaited<ReturnType<typeof fetchOrderById>>>(null);
  const [gigTitle, setGigTitle] = useState("");
  const [paymentConfig, setPaymentConfig] = useState<PaymentShellConfig | null>(null);

  useEffect(() => {
    fetchPaymentShellConfig().then(setPaymentConfig).catch(() => setPaymentConfig(null));
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchOrderById(id)
      .then(async (o) => {
        setOrder(o);
        if (o?.gig_id) {
          const gig = await fetchGigById(o.gig_id);
          setGigTitle(gig?.title ?? "");
        }
      })
      .catch(() => setOrder(null));
  }, [id]);

  if (!order) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Order" />
        <Text variant="body" muted style={styles.centered}>
          Loading…
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Order" subtitle={orderStatusLabel(order.status)} />
      <View style={styles.section}>
        <Text variant="headline">{gigTitle || "Gig"}</Text>
        <Text variant="body" color="brand">
          {order.package_tier} · {formatPrice(order.price_cents, order.currency)}
        </Text>
        <Text variant="footnote" muted>
          {order.delivery_days} day delivery
        </Text>
        {order.terms ? (
          <Text variant="body" style={styles.terms}>
            {order.terms}
          </Text>
        ) : null}
        <Text variant="footnote" muted>
          Created {new Date(order.created_at).toLocaleDateString()}
        </Text>
        {order.completed_at ? (
          <Text variant="footnote" muted>
            Completed {new Date(order.completed_at).toLocaleDateString()}
          </Text>
        ) : null}
      </View>
      {paymentConfig ? (
        <PaymentPlaceholderCard
          config={paymentConfig}
          paymentStatus={order.payment_status}
          priceCents={order.price_cents}
          currency={order.currency}
        />
      ) : null}
      <Text variant="footnote" muted style={styles.hint}>
        Manage this order from the chat thread — actions appear on order cards.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { paddingBottom: spacing.xxl },
  section: { padding: spacing.md, gap: spacing.sm },
  terms: { marginTop: spacing.sm },
  hint: { paddingHorizontal: spacing.md },
  centered: { textAlign: "center", padding: spacing.xl },
});
