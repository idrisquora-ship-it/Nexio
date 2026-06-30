import { Pressable, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenHeader, Text, Card } from "../../../src/shared/components";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { fetchUnreadCount } from "../../../src/features/notifications/api/notificationsApi";
import { colors, spacing } from "../../../src/shared/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notification-unread"],
    queryFn: fetchUnreadCount,
    staleTime: 30_000,
  });

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" subtitle="Account and privacy" />
      <Pressable onPress={() => router.push("/profile/notifications")}>
        <Card style={styles.card}>
          <Text variant="headline">Notifications</Text>
          <Text variant="footnote" muted>
            {unreadCount > 0 ? `${unreadCount} unread` : "View your notification center"}
          </Text>
        </Card>
      </Pressable>
      <Pressable onPress={() => router.push("/settings/notifications")}>
        <Card style={styles.card}>
          <Text variant="headline">Notification preferences</Text>
          <Text variant="footnote" muted>
            Push and in-app alerts by category
          </Text>
        </Card>
      </Pressable>
      <Pressable onPress={() => router.push("/settings/storage")}>
        <Card style={styles.card}>
          <Text variant="headline">Storage</Text>
          <Text variant="footnote" muted>
            Offline queues, drafts, and sync
          </Text>
        </Card>
      </Pressable>
        {profile?.is_business ? (
          <Pressable onPress={() => router.push("/settings/verification")}>
            <Card style={styles.card}>
              <Text variant="headline">Seller verification</Text>
              <Text variant="footnote" muted>
                Submit documents for a verified badge
              </Text>
            </Card>
          </Pressable>
        ) : (
        <Pressable onPress={() => router.push("/settings/become-business")}>
          <Card style={styles.card}>
            <Text variant="headline">Become a seller</Text>
            <Text variant="footnote" muted>
              Start offering services on the marketplace
            </Text>
          </Card>
        </Pressable>
      )}
      {profile?.is_business ? (
        <Pressable onPress={() => router.push("/settings/payouts")}>
          <Card style={styles.card}>
            <Text variant="headline">Payouts</Text>
            <Text variant="footnote" muted>
              Stripe Connect setup (payments coming soon)
            </Text>
          </Card>
        </Pressable>
      ) : null}
      <Pressable onPress={() => router.push("/settings/legal")}>
        <Card style={styles.card}>
          <Text variant="headline">Legal</Text>
          <Text variant="footnote" muted>
            Privacy policy and terms of service
          </Text>
        </Card>
      </Pressable>
      {profile?.is_admin ? (
        <Pressable onPress={() => router.push("/settings/admin")}>
          <Card style={styles.card}>
            <Text variant="headline">Admin dashboard</Text>
            <Text variant="footnote" muted>
              Reports, verification, and announcements
            </Text>
          </Card>
        </Pressable>
      ) : null}
      {profile?.is_admin ? (
        <Pressable onPress={() => router.push("/settings/admin/verification")}>
          <Card style={styles.card}>
            <Text variant="headline">Admin: Verification queue</Text>
            <Text variant="footnote" muted>
              Review pending seller verification submissions
            </Text>
          </Card>
        </Pressable>
      ) : null}
      <Pressable onPress={() => router.push("/settings/account")}>
        <Card style={styles.card}>
          <Text variant="headline">Account</Text>
          <Text variant="footnote" muted>
            Email, password, phone, and profile
          </Text>
        </Card>
      </Pressable>
      <Pressable onPress={() => router.push("/settings/privacy")}>
        <Card style={styles.card}>
          <Text variant="headline">Privacy</Text>
          <Text variant="footnote" muted>
            Online status, read receipts, and discoverability
          </Text>
        </Card>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
});
