import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { Card, EmptyState, ScreenHeader, Text } from "../../../src/shared/components";
import { colors, spacing } from "../../../src/shared/theme";

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();

  if (!profile?.is_admin) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Admin" />
        <EmptyState title="Admin only" message="You do not have access to admin tools." />
      </View>
    );
  }

  const links = [
    { title: "Reports queue", subtitle: "Review user reports", href: "/settings/admin/reports" },
    { title: "Verification queue", subtitle: "Seller document review", href: "/settings/admin/verification" },
    { title: "Announcements", subtitle: "Publish Updates cards", href: "/settings/admin/announcements" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Admin" subtitle="Moderation and platform tools" />
      {links.map((link) => (
        <Pressable key={link.href} onPress={() => router.push(link.href as never)}>
          <Card style={styles.card}>
            <Text variant="headline">{link.title}</Text>
            <Text variant="footnote" muted>
              {link.subtitle}
            </Text>
          </Card>
        </Pressable>
      ))}
      <Text variant="footnote" muted style={styles.note}>
        Admin does not gate signup, business creation, gigs, stories, or groups.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { paddingBottom: spacing.xxl },
  card: { marginHorizontal: spacing.md, marginBottom: spacing.sm, gap: spacing.xxs },
  note: { marginHorizontal: spacing.md, marginTop: spacing.md },
});
