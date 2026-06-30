import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { MessageBubble } from "../../../src/features/messaging/components/MessageBubble";
import { fetchStarredMessages, type Message } from "../../../src/features/messaging/api/messagingApi";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { EmptyState, ScreenHeader } from "../../../src/shared/components";
import { colors } from "../../../src/shared/theme";

export default function StarredMessagesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await fetchStarredMessages(user.id);
    setMessages(data);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Starred messages" />
      {messages.length === 0 ? (
        <EmptyState title="No starred messages" message="Star messages from any chat to find them here." />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwn={item.sender_id === user?.id}
              onLongPress={() => router.push(`/(tabs)/chats/${item.conversation_id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
});
