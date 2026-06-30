import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { signOut } from "../../src/features/auth/api/authApi";
import { useAuthStore } from "../../src/features/auth/store/authStore";
import { unregisterPushToken } from "../../src/shared/lib/pushNotifications";
import { Button, Card, ScreenHeader, Text } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();

  const handleSignOut = async () => {
    if (user?.id) {
      await unregisterPushToken(user.id).catch(() => undefined);
    }
    await signOut();
  };

  const changePassword = () => {
    Alert.alert(
      "Change password",
      "Use the reset link from the login screen, or update your password in Supabase Auth settings for now.",
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Account" subtitle="Sign-in and identity" />
      <Card style={styles.card}>
        <Text variant="headline">Email</Text>
        <Text variant="body" muted>
          {user?.email ?? "Not available"}
        </Text>
      </Card>
      <Card style={styles.card}>
        <Text variant="headline">Username</Text>
        <Text variant="body" color="brand">
          @{profile?.username ?? "—"}
        </Text>
      </Card>
      <Button label="Edit profile" variant="secondary" onPress={() => router.push("/(tabs)/profile/edit")} />
      <Button label="Phone number" variant="secondary" onPress={() => router.push("/settings/phone")} />
      <Button label="Change password" variant="secondary" onPress={changePassword} />
      <Button label="Log out" onPress={handleSignOut} style={styles.logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { gap: spacing.xs },
  logout: { marginTop: spacing.lg },
});
