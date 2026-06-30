import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Text, Button } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";
import {
  acceptOrderAgreement,
  acceptOrderDelivery,
  cancelOrder,
  markOrderDelivered,
  orderStatusLabel,
  parseOrderCardMetadata,
  fetchMyReviewForOrder,
  requestOrderRevision,
  resumeOrderWork,
  type OrderStatus,
} from "../api/ordersApi";
import { formatPrice } from "../../marketplace/api/marketplaceApi";
import type { Message } from "../../messaging/api/messagingApi";
import { parseMediaMetadata } from "../../messaging/api/messagingApi";

interface ChatOrderCardProps {
  message: Message;
  userId?: string;
  onActionComplete?: () => void;
  onReview?: (orderId: string, role: "buyer" | "seller") => void;
}

export function ChatOrderCard({ message, userId, onActionComplete, onReview }: ChatOrderCardProps) {
  const router = useRouter();
  const meta = parseOrderCardMetadata(parseMediaMetadata(message.media_metadata));
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    if (!meta || !userId || meta.status !== "completed") {
      setAlreadyReviewed(false);
      return;
    }
    fetchMyReviewForOrder(meta.orderId, userId)
      .then((row) => setAlreadyReviewed(!!row))
      .catch(() => setAlreadyReviewed(false));
  }, [meta?.orderId, meta?.status, userId]);

  if (!meta) return null;

  const isBuyer = userId === meta.buyerId;
  const isSeller = userId === meta.sellerId;
  const status = meta.status as OrderStatus;

  const run = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      Alert.alert("Updated", success);
      onActionComplete?.();
    } catch (e) {
      Alert.alert("Action failed", e instanceof Error ? e.message : "Try again");
    }
  };

  const renderActions = () => {
    if (!userId) return null;

    const actions: { label: string; onPress: () => void; variant?: "secondary" }[] = [];

    if (status === "waiting" && isBuyer) {
      actions.push({
        label: "Accept agreement",
        onPress: () => run(() => acceptOrderAgreement(meta.orderId), "Order started"),
      });
    }
    if (status === "in_progress" && isSeller) {
      actions.push({
        label: "Mark delivered",
        onPress: () => run(() => markOrderDelivered(meta.orderId), "Marked as delivered"),
      });
    }
    if (status === "in_progress" && isBuyer) {
      actions.push({
        label: "Request revision",
        onPress: () => run(() => requestOrderRevision(meta.orderId), "Revision requested"),
        variant: "secondary",
      });
    }
    if (status === "revision_requested" && isSeller) {
      actions.push({
        label: "Resume work",
        onPress: () => run(() => resumeOrderWork(meta.orderId), "Work resumed"),
      });
    }
    if (status === "delivered" && isBuyer) {
      actions.push({
        label: "Accept delivery",
        onPress: () => run(() => acceptOrderDelivery(meta.orderId), "Order completed"),
      });
    }
    if (status === "completed" && !alreadyReviewed) {
      actions.push({
        label: "Leave review",
        onPress: () => onReview?.(meta.orderId, isSeller ? "seller" : "buyer"),
      });
    }
    if ((isBuyer || isSeller) && !["completed", "cancelled", "archived"].includes(status)) {
      actions.push({
        label: "Cancel",
        onPress: () => run(() => cancelOrder(meta.orderId), "Order cancelled"),
        variant: "secondary",
      });
    }

    if (!actions.length) return null;

    return (
      <View style={styles.actions}>
        {actions.map((a) => (
          <Button
            key={a.label}
            label={a.label}
            variant={a.variant ?? "primary"}
            onPress={a.onPress}
            style={styles.actionBtn}
          />
        ))}
      </View>
    );
  };

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/marketplace/orders/${meta.orderId}`)}
    >
      <Text variant="footnote" muted>
        Order · {orderStatusLabel(status)}
      </Text>
      <Text variant="headline" numberOfLines={2}>
        {meta.gigTitle}
      </Text>
      <Text variant="body" color="brand">
        {meta.packageTier} · {formatPrice(meta.priceCents, meta.currency)}
      </Text>
      <Text variant="footnote" muted>
        {meta.deliveryDays} day delivery
      </Text>
      {message.body ? (
        <Text variant="footnote" style={styles.note}>
          {message.body}
        </Text>
      ) : null}
      {renderActions()}
      <Text variant="footnote" color="brand">
        View order →
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.background.primary,
    padding: spacing.sm,
    gap: spacing.xxs,
    maxWidth: 280,
  },
  note: { marginTop: spacing.xxs },
  actions: { marginTop: spacing.sm, gap: spacing.xs },
  actionBtn: { minHeight: 40 },
});
