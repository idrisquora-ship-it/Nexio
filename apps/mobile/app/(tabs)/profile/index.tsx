import { View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Avatar, Button, Card, ScreenHeader, Text } from "../../../src/shared/components";
import { signOut } from "../../../src/features/auth/api/authApi";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { unregisterPushToken } from "../../../src/shared/lib/pushNotifications";
import { colors, spacing } from "../../../src/shared/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user } = useAuthStore();

  const handleSignOut = async () => {
    if (user?.id) {
      await unregisterPushToken(user.id).catch(() => undefined);
    }
    await signOut();
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Profile" />
      <Card style={styles.card}>
        <View style={styles.row}>
          <Avatar name={profile?.display_name} uri={profile?.avatar_url} />
          <View style={styles.meta}>
            <Text variant="title2">{profile?.display_name ?? "Nexio user"}</Text>
            <Text variant="subheadline" color="brand">
              @{profile?.username ?? "username"}
            </Text>
          </View>
        </View>
      </Card>

      <Pressable onPress={() => router.push("/(tabs)/profile/edit")} style={styles.link}>
        <Text variant="headline">Edit profile</Text>
        <Text variant="footnote" muted>
          Photo, display name, and bio
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push("/profile/notifications")} style={styles.link}>
        <Text variant="headline">Notifications</Text>
        <Text variant="footnote" muted>
          Activity and alerts
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push("/(tabs)/profile/settings")} style={styles.link}>
        <Text variant="headline">Settings</Text>
        <Text variant="footnote" muted>
          Account, privacy, and preferences
        </Text>
      </Pressable>

      <Button label="Log out" variant="secondary" onPress={handleSignOut} style={styles.logout} />
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
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  meta: {
    gap: spacing.xxs,
  },
  link: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface.card,
    gap: spacing.xxs,
  },
  logout: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
});
