import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { fetchMyBusiness } from "../../src/features/marketplace/api/marketplaceApi";
import {
  fetchSellerAnalytics,
  fetchSellerAnalyticsSeries,
  type AnalyticsSeriesPoint,
  type SellerAnalytics,
} from "../../src/features/marketplace/api/analyticsApi";
import { AnalyticsChart } from "../../src/features/marketplace/components/AnalyticsChart";
import { SellerLevelBadge } from "../../src/features/marketplace/components/SellerLevelBadge";
import { fetchPaymentShellConfig } from "../../src/features/payments/api/paymentsApi";
import { useAuthStore } from "../../src/features/auth/store/authStore";
import { Button, Card, EmptyState, ScreenHeader, Text } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

type Period = "daily" | "weekly" | "monthly" | "yearly";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card style={styles.stat}>
      <Text variant="title2">{value}</Text>
      <Text variant="footnote" muted>
        {label}
      </Text>
    </Card>
  );
}

const PERIODS: { id: Period; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

export default function AnalyticsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<SellerAnalytics | null>(null);
  const [series, setSeries] = useState<AnalyticsSeriesPoint[]>([]);
  const [period, setPeriod] = useState<Period>("weekly");
  const [feePercent, setFeePercent] = useState(10);

  useEffect(() => {
    if (!user) return;
    fetchMyBusiness(user.id)
      .then(async (biz) => {
        if (!biz) return null;
        const [analytics, points] = await Promise.all([
          fetchSellerAnalytics(biz.id),
          fetchSellerAnalyticsSeries(biz.id, period),
        ]);
        setStats(analytics);
        setSeries(points);
        return biz;
      })
      .catch(() => {
        setStats(null);
        setSeries([]);
      });
    fetchPaymentShellConfig()
      .then((c) => setFeePercent(c.platform_fee_percent))
      .catch(() => undefined);
  }, [user, period]);

  if (!stats) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Analytics" />
        <EmptyState
          title="Seller account required"
          message="Become a business to view analytics."
          actionLabel="Become a seller"
          onAction={() => router.push("/settings/become-business")}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Analytics" subtitle="Your business performance" />
      <View style={styles.header}>
        <SellerLevelBadge levelName={stats.seller_level_name} verified={stats.is_verified} />
        <Text variant="footnote" muted>
          Active gigs: {stats.active_gigs} / {stats.gig_limit}
        </Text>
      </View>
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <Pressable
            key={p.id}
            style={[styles.periodChip, period === p.id && styles.periodActive]}
            onPress={() => setPeriod(p.id)}
          >
            <Text variant="footnote" color={period === p.id ? "brand" : undefined} muted={period !== p.id}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <AnalyticsChart title="Completed orders" points={series} />
      <View style={styles.grid}>
        <StatCard label="Completed orders" value={stats.completed_orders} />
        <StatCard label="Avg rating" value={stats.average_rating.toFixed(1)} />
        <StatCard label="Repeat buyers" value={stats.repeat_buyers} />
        <StatCard label="Favorites" value={stats.favorites_count} />
        <StatCard label="Profile views" value={stats.profile_views} />
        <StatCard label="Gig views" value={stats.gig_views} />
      </View>
      <Card style={styles.revenueCard}>
        <Text variant="headline">Revenue</Text>
        <Text variant="body" muted>
          Live revenue and escrow charts unlock when Stripe payments launch. Projected platform fee: {feePercent}%.
        </Text>
        <Button label="Payout settings" variant="secondary" onPress={() => router.push("/settings/payouts")} />
      </Card>
      <Button label="Back to marketplace" variant="secondary" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { paddingBottom: spacing.xxl },
  header: { paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.md },
  periodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  periodChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.background.tertiary,
  },
  periodActive: { backgroundColor: colors.brand.primaryMuted },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  stat: { width: "47%", gap: spacing.xxs },
  revenueCard: { margin: spacing.md, gap: spacing.sm },
});
