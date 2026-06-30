import { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  getOrCreateDirectConversation,
  searchProfiles,
} from "../../../src/features/messaging/api/messagingApi";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { Avatar, ScreenHeader, Text, TextField } from "../../../src/shared/components";
import { colors, spacing } from "../../../src/shared/theme";

export default function NewChatScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; username: string; display_name: string; avatar_url: string | null }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (!user || value.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await searchProfiles(value, user.id);
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (otherUserId: string) => {
    const conversationId = await getOrCreateDirectConversation(otherUserId);
    router.replace(`/(tabs)/chats/${conversationId}`);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="New chat" subtitle="Search by username or name" />
      <View style={styles.search}>
        <TextField
          label="Search"
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="@username"
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          query.length >= 2 && !loading ? (
            <Text variant="body" muted style={styles.empty}>
              No users found
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => startChat(item.id)}>
            <Avatar name={item.display_name} uri={item.avatar_url} size={48} />
            <View>
              <Text variant="headline">{item.display_name}</Text>
              <Text variant="subheadline" muted>
                @{item.username}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  search: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  empty: {
    padding: spacing.lg,
    textAlign: "center",
  },
});
