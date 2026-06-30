import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Phone, Video } from "lucide-react-native";
import {
  fetchConversation,
  fetchParticipants,
  type ParticipantProfile,
} from "../../../src/features/messaging/api/messagingApi";
import { requestLiveKitToken } from "../../../src/features/calls/api/callsApi";
import { Avatar, ScreenHeader, Text } from "../../../src/shared/components";
import { colors, spacing } from "../../../src/shared/theme";

export default function GroupInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState("Group");
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantProfile[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const [conversation, members] = await Promise.all([
      fetchConversation(id),
      fetchParticipants(id),
    ]);
    if (conversation?.name) setName(conversation.name);
    setCommunityId(conversation?.community_id ?? null);
    setParticipants(members);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const startCall = async (callType: "voice" | "video") => {
    if (!id) return;
    try {
      const result = await requestLiveKitToken(id, callType);
      router.push({
        pathname: "/call/[roomId]",
        params: {
          roomId: result.room_name,
          callId: result.call_id,
          callType,
          token: result.token,
          url: result.url,
          participantCount: String(participants.length),
        },
      });
    } catch (e) {
      Alert.alert("Call failed", e instanceof Error ? e.message : "Try again");
    }
  };

  if (!id) {
    router.back();
    return null;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Group info" />
      <View style={styles.hero}>
        <Text variant="largeTitle">{name}</Text>
        <Text variant="footnote" muted>
          {participants.length} members · Group call supported
        </Text>
        {communityId ? (
          <Pressable onPress={() => router.push(`/community/${communityId}`)}>
            <Text variant="subheadline" color="brand">
              View community →
            </Text>
          </Pressable>
        ) : null}
        <View style={styles.callRow}>
          <Pressable style={styles.callBtn} onPress={() => startCall("voice")}>
            <Phone color={colors.brand.primary} size={22} />
            <Text variant="footnote" color="brand">
              Group voice
            </Text>
          </Pressable>
          <Pressable style={styles.callBtn} onPress={() => startCall("video")}>
            <Video color={colors.brand.primary} size={22} />
            <Text variant="footnote" color="brand">
              Group video
            </Text>
          </Pressable>
        </View>
      </View>
      <FlatList
        data={participants}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item }) => {
          const profile = item.profiles;
          if (!profile) return null;
          return (
            <View style={styles.row}>
              <Avatar name={profile.display_name} uri={profile.avatar_url} size={44} />
              <View style={styles.meta}>
                <Text variant="headline">{profile.display_name}</Text>
                <Text variant="footnote" muted>
                  @{profile.username} · {item.role}
                </Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  hero: {
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  callRow: {
    flexDirection: "row",
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  callBtn: {
    alignItems: "center",
    gap: spacing.xxs,
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  meta: {
    flex: 1,
  },
});
