import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { publishAnnouncement } from "../../../src/features/moderation/api/reportsApi";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { Button, EmptyState, ScreenHeader, Text, TextField } from "../../../src/shared/components";
import { colors, spacing } from "../../../src/shared/theme";

export default function AdminAnnouncementsScreen() {
  const { profile } = useAuthStore();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Announcement", "Title and body are required.");
      return;
    }
    setLoading(true);
    try {
      await publishAnnouncement({ title: title.trim(), body: body.trim(), priority: "normal" });
      setTitle("");
      setBody("");
      Alert.alert("Published", "Announcement is live in Updates.");
    } catch (e) {
      Alert.alert("Failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setLoading(false);
    }
  };

  if (!profile?.is_admin) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Announcements" />
        <EmptyState title="Admin only" message="You cannot publish announcements." />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Announcements" subtitle="Publish in-app Updates cards" />
      <TextField label="Title" value={title} onChangeText={setTitle} />
      <TextField label="Body" value={body} onChangeText={setBody} multiline />
      <Text variant="footnote" muted>
        Audience defaults to everyone. Push is optional and controlled by notification preferences.
      </Text>
      <Button label="Publish" loading={loading} onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
});
