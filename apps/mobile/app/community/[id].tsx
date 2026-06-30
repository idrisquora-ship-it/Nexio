import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  createChannel,
  fetchCommunity,
  joinCommunity,
  type CommunityDetail,
} from "../../src/features/updates/api/updatesApi";
import { CommunityHeader } from "../../src/features/updates/components/CommunityHeader";
import { useAuthStore } from "../../src/features/auth/store/authStore";
import { useReportStore } from "../../src/features/moderation/store/reportStore";
import { Button, ScreenHeader, Text } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

export default function CommunityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const openReport = useReportStore((s) => s.open);
  const [community, setCommunity] = useState<CommunityDetail | null>(null);

  const load = async () => {
    if (!id) return;
    const data = await fetchCommunity(id, user?.id);
    setCommunity(data);
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [id, user?.id]);

  const onJoin = async () => {
    if (!id) return;
    try {
      await joinCommunity(id);
      await load();
    } catch (e) {
      Alert.alert("Join failed", e instanceof Error ? e.message : "Could not join.");
    }
  };

  const onCreateChannel = async () => {
    if (!id) return;
    try {
      const channelId = await createChannel("Announcements", id);
      router.push(`/updates/channel/${channelId}`);
    } catch (e) {
      Alert.alert("Channel failed", e instanceof Error ? e.message : "Could not create channel.");
    }
  };

  if (!community) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Community" />
        <Text variant="body" muted style={styles.pad}>
          Loading...
        </Text>
      </View>
    );
  }

  const isAdmin = community.myRole === "owner" || community.myRole === "admin";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title={community.name} />
      <CommunityHeader community={community} memberCount={community.memberCount} />

      {community.isMember ? (
        <Pressable
          style={styles.reportRow}
          onPress={() =>
            openReport({
              type: "community",
              id: community.id,
              label: community.name,
            })
          }
        >
          <Text variant="footnote" muted>
            Report community
          </Text>
        </Pressable>
      ) : null}

      {!community.isMember ? (
        <Button label="Join community" onPress={onJoin} style={styles.pad} />
      ) : null}

      {isAdmin ? (
        <Button label="Create announcement channel" onPress={onCreateChannel} style={styles.pad} />
      ) : null}

      {community.isMember ? (
        <Button
          label="Create group"
          onPress={() => router.push(`/(tabs)/chats/new-group?communityId=${id}`)}
          style={styles.pad}
        />
      ) : null}

      <Text variant="title2" style={styles.section}>
        Groups
      </Text>
      {community.groups.length === 0 ? (
        <Text variant="body" muted style={styles.pad}>
          No groups linked yet.
        </Text>
      ) : (
        community.groups.map((group) => (
          <Pressable
            key={group.id}
            style={styles.channelRow}
            onPress={() => router.push(`/(tabs)/chats/${group.id}`)}
          >
            <Text variant="headline">{group.name ?? "Group"}</Text>
            <Text variant="footnote" muted>
              Community group chat
            </Text>
          </Pressable>
        ))
      )}

      <Text variant="title2" style={styles.section}>
        Channels
      </Text>
      {community.channels.length === 0 ? (
        <Text variant="body" muted style={styles.pad}>
          No channels yet.
        </Text>
      ) : (
        community.channels.map((channel) => (
          <Pressable
            key={channel.id}
            style={styles.channelRow}
            onPress={() => router.push(`/updates/channel/${channel.id}`)}
          >
            <Text variant="headline">{channel.name}</Text>
            {channel.description ? (
              <Text variant="footnote" muted>
                {channel.description}
              </Text>
            ) : null}
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { paddingBottom: spacing.xxl },
  pad: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  reportRow: { alignItems: "center", marginBottom: spacing.sm },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm },
  channelRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
});
