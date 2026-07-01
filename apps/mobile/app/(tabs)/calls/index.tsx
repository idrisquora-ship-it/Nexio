import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Phone, Video } from "lucide-react-native";
import { fetchCallHistory, type CallSession } from "../../../src/features/calls/api/callsApi";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { EmptyState, ScreenHeader, Text } from "../../../src/shared/components";
import { useScreenFocusEffect } from "../../../src/shared/hooks/useScreenFocusEffect";
import { colors, spacing } from "../../../src/shared/theme";

export default function CallsScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [calls, setCalls] = useState<CallSession[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await fetchCallHistory(user.id);
    setCalls(data);
  }, [user]);

  useScreenFocusEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Calls" subtitle="Voice and video via LiveKit" />
      {calls.length === 0 ? (
        <EmptyState
          title="No calls yet"
          message="Start a voice or video call from any chat thread."
        />
      ) : (
        <FlatList
          data={calls}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                router.push({
                  pathname: "/call/[roomId]",
                  params: {
                    roomId: item.room_name,
                    conversationId: item.conversation_id,
                    callId: item.id,
                    callType: item.call_type,
                  },
                })
              }
            >
              {item.call_type === "video" ? (
                <Video color={colors.brand.primary} size={22} />
              ) : (
                <Phone color={colors.brand.primary} size={22} />
              )}
              <View style={styles.meta}>
                <Text variant="headline">{item.room_name}</Text>
                <Text variant="footnote" muted>
                  {item.status} · {new Date(item.created_at).toLocaleString()}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  meta: { gap: spacing.xxs },
});
