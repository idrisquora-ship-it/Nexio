import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Flag } from "lucide-react-native";
import { fetchPublicProfile } from "../../src/features/auth/api/profileApi";
import { getOrCreateDirectConversation } from "../../src/features/messaging/api/messagingApi";
import { useReportStore } from "../../src/features/moderation/store/reportStore";
import { useAuthStore } from "../../src/features/auth/store/authStore";
import { Avatar, Button, Card, EmptyState, ScreenHeader, Text } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const openReport = useReportStore((s) => s.open);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof fetchPublicProfile>>>(null);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPublicProfile(id).then(setProfile).catch(() => setProfile(null));
  }, [id]);

  const messageUser = async () => {
    if (!id || !user) return;
    setMessaging(true);
    try {
      const conversationId = await getOrCreateDirectConversation(id);
      router.push(`/(tabs)/chats/${conversationId}`);
    } finally {
      setMessaging(false);
    }
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Profile" />
        {id ? (
          <ActivityIndicator style={styles.loader} color={colors.brand.primary} />
        ) : (
          <EmptyState title="Not found" message="This profile does not exist." />
        )}
      </View>
    );
  }

  const isSelf = user?.id === profile.id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title={profile.display_name} />
      <Card style={styles.card}>
        <View style={styles.row}>
          <Avatar name={profile.display_name} uri={profile.avatar_url} size={72} />
          <View style={styles.meta}>
            <Text variant="title2">{profile.display_name}</Text>
            <Text variant="subheadline" color="brand">
              @{profile.username}
            </Text>
            {profile.is_business ? (
              <Text variant="footnote" muted>
                Seller account
              </Text>
            ) : null}
          </View>
        </View>
        {profile.bio ? (
          <Text variant="body" style={styles.bio}>
            {profile.bio}
          </Text>
        ) : null}
      </Card>

      {!isSelf ? (
        <View style={styles.actions}>
          <Button label="Message" loading={messaging} onPress={messageUser} />
          <Pressable
            style={styles.reportBtn}
            onPress={() =>
              openReport({
                type: "profile",
                id: profile.id,
                label: `@${profile.username}`,
              })
            }
            accessibilityRole="button"
          >
            <Flag color={colors.text.secondary} size={18} />
            <Text variant="footnote" muted>
              Report profile
            </Text>
          </Pressable>
        </View>
      ) : (
        <Button label="Edit my profile" variant="secondary" onPress={() => router.push("/(tabs)/profile/edit")} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { paddingBottom: spacing.xxl },
  loader: { marginTop: spacing.xl },
  card: { marginHorizontal: spacing.md, gap: spacing.md },
  row: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  meta: { flex: 1, gap: spacing.xxs },
  bio: { marginTop: spacing.xs },
  actions: { marginHorizontal: spacing.md, marginTop: spacing.lg, gap: spacing.md },
  reportBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs },
});
