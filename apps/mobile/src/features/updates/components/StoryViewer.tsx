import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Eye, Flag, X } from "lucide-react-native";
import { useAuthStore } from "../../../features/auth/store/authStore";
import { Avatar, Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";
import type { StoryWithMedia } from "../api/updatesApi";
import { fetchStoryViewers, markStoryViewed, replyToStory } from "../api/updatesApi";
import { useReportStore } from "../../moderation/store/reportStore";

interface StoryViewerProps {
  stories: StoryWithMedia[];
  ownerName: string;
  ownerId: string;
  onClose: () => void;
}

export function StoryViewer({ stories, ownerName, ownerId, onClose }: StoryViewerProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const openReport = useReportStore((s) => s.open);
  const [index, setIndex] = useState(0);
  const [reply, setReply] = useState("");
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<Awaited<ReturnType<typeof fetchStoryViewers>>>([]);
  const story = stories[index];
  const isOwner = user?.id === ownerId;

  useEffect(() => {
    if (!story) return;
    markStoryViewed(story.id).catch(() => undefined);
  }, [story?.id]);

  useEffect(() => {
    if (!story || !isOwner || !showViewers) return;
    fetchStoryViewers(story.id).then(setViewers).catch(() => setViewers([]));
  }, [story?.id, isOwner, showViewers]);

  if (!story) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.close} onPress={onClose}>
          <X color={colors.text.primary} size={24} />
        </Pressable>
        <Text variant="body" muted>
          No stories available.
        </Text>
      </View>
    );
  }

  const next = () => {
    if (index < stories.length - 1) setIndex((i) => i + 1);
    else onClose();
  };

  const sendReply = async () => {
    const text = reply.trim();
    if (!text || !user) return;
    const conversationId = await replyToStory(story.user_id, `Replied to your story: ${text}`, user.id);
    setReply("");
    router.push(`/(tabs)/chats/${conversationId}`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pressable style={styles.tapZone} onPress={next}>
        {story.story_type === "text" ? (
          <View style={[styles.textStory, { backgroundColor: story.background_color ?? colors.brand.primary }]}>
            <Text variant="title2" style={styles.textContent}>
              {story.text_content}
            </Text>
          </View>
        ) : story.mediaSignedUrl ? (
          <Image source={{ uri: story.mediaSignedUrl }} style={styles.media} resizeMode="contain" />
        ) : (
          <View style={styles.textStory}>
            <Text variant="body" muted>
              Media unavailable
            </Text>
          </View>
        )}
      </Pressable>

      <View style={styles.topBar}>
        <Text variant="headline" style={styles.owner}>
          {ownerName}
        </Text>
        <View style={styles.topActions}>
          {isOwner ? (
            <Pressable onPress={() => setShowViewers((v) => !v)} style={styles.viewersBtn}>
              <Eye color={colors.text.primary} size={22} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() =>
                openReport({
                  type: "story",
                  id: story.id,
                  label: `${ownerName}'s story`,
                })
              }
              style={styles.viewersBtn}
              accessibilityLabel="Report story"
            >
              <Flag color={colors.text.primary} size={20} />
            </Pressable>
          )}
          <Pressable onPress={onClose}>
            <X color={colors.text.primary} size={24} />
          </Pressable>
        </View>
      </View>

      {showViewers && isOwner ? (
        <View style={styles.viewersPanel}>
          <Text variant="headline" style={styles.viewersTitle}>
            Viewers
          </Text>
          <ScrollView style={styles.viewersList}>
            {viewers.length === 0 ? (
              <Text variant="body" muted>
                No views yet
              </Text>
            ) : (
              viewers.map((row) => {
                const profile = row.profiles;
                if (!profile) return null;
                return (
                  <View key={row.viewer_id} style={styles.viewerRow}>
                    <Avatar name={profile.display_name} uri={profile.avatar_url} size={36} />
                    <Text variant="body">{profile.display_name}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.replyBar}>
        <TextInput
          style={styles.replyInput}
          placeholder="Reply..."
          placeholderTextColor={colors.text.secondary}
          value={reply}
          onChangeText={setReply}
          onSubmitEditing={sendReply}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  tapZone: { flex: 1 },
  media: { flex: 1, width: "100%" },
  textStory: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  textContent: { textAlign: "center", color: colors.text.primary },
  topBar: {
    position: "absolute",
    top: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  owner: { color: colors.text.primary },
  topActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  viewersBtn: { padding: spacing.xxs },
  viewersPanel: {
    position: "absolute",
    bottom: 100,
    left: spacing.md,
    right: spacing.md,
    maxHeight: 200,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
  },
  viewersTitle: { marginBottom: spacing.sm },
  viewersList: { maxHeight: 140 },
  viewerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xxs },
  close: { padding: spacing.md },
  replyBar: {
    position: "absolute",
    bottom: spacing.xl,
    left: spacing.md,
    right: spacing.md,
  },
  replyInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
  },
});
