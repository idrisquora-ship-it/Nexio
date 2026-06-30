import { useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createGroupConversation } from "../../../src/features/messaging/api/groupsApi";
import { searchProfiles } from "../../../src/features/messaging/api/messagingApi";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { Avatar, Button, ScreenHeader, Text, TextField } from "../../../src/shared/components";
import { colors, spacing } from "../../../src/shared/theme";

export default function NewGroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ communityId?: string }>();
  const communityId = Array.isArray(params.communityId) ? params.communityId[0] : params.communityId;
  const { user } = useAuthStore();
  const [groupName, setGroupName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; username: string; display_name: string; avatar_url: string | null }[]
  >([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleMember = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (!user || value.trim().length < 2) {
      setResults([]);
      return;
    }
    const data = await searchProfiles(value, user.id);
    setResults(data);
  };

  const createGroup = async () => {
    if (!groupName.trim() || selected.length === 0) {
      Alert.alert("Group", "Enter a name and select at least one member.");
      return;
    }
    setLoading(true);
    try {
      const id = await createGroupConversation(groupName.trim(), selected, communityId);
      router.replace(`/(tabs)/chats/${id}`);
    } catch (e) {
      Alert.alert("Could not create group", e instanceof Error ? e.message : "Try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="New group" subtitle="Add members by search" />
      <View style={styles.form}>
        <TextField label="Group name" value={groupName} onChangeText={setGroupName} />
        <TextField
          label="Search members"
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          placeholder="@username"
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selected.includes(item.id);
          return (
            <Pressable style={styles.row} onPress={() => toggleMember(item.id)}>
              <Avatar name={item.display_name} uri={item.avatar_url} size={44} />
              <View style={styles.meta}>
                <Text variant="headline">{item.display_name}</Text>
                <Text variant="footnote" muted>
                  @{item.username}
                </Text>
              </View>
              <Text variant="headline" color={isSelected ? "brand" : undefined}>
                {isSelected ? "✓" : "+"}
              </Text>
            </Pressable>
          );
        }}
      />
      <Button
        label={`Create group (${selected.length})`}
        loading={loading}
        onPress={createGroup}
        style={styles.create}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  form: { paddingHorizontal: spacing.md, gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  meta: { flex: 1 },
  create: { margin: spacing.md },
});
