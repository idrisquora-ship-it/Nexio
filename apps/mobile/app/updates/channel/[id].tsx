import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  canPostToChannel,
  createChannelPost,
  fetchChannel,
  fetchChannelPostReactions,
  fetchChannelPosts,
  isChannelFollowed,
  toggleChannelFollow,
  toggleChannelPostReaction,
  type Channel,
} from "../../../src/features/updates/api/updatesApi";
import {
  CHANNEL_REACTION_EMOJIS,
  ChannelPostReactions,
  type ReactionSummary,
} from "../../../src/features/updates/components/ChannelPostReactions";
import { Button, ScreenHeader, Text } from "../../../src/shared/components";
import { colors, spacing } from "../../../src/shared/theme";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { useReportStore } from "../../../src/features/moderation/store/reportStore";

function withDefaultReactions(
  summaries: { emoji: string; count: number; reacted: boolean }[],
): ReactionSummary[] {
  return CHANNEL_REACTION_EMOJIS.map((emoji) => {
    const found = summaries.find((s) => s.emoji === emoji);
    return found ?? { emoji, count: 0, reacted: false };
  });
}

export default function ChannelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const openReport = useReportStore((s) => s.open);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [posts, setPosts] = useState<Awaited<ReturnType<typeof fetchChannelPosts>>>([]);
  const [following, setFollowing] = useState(false);
  const [canPost, setCanPost] = useState(false);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [reactionsByPost, setReactionsByPost] = useState<Map<string, ReactionSummary[]>>(new Map());

  const loadReactions = async (postRows: typeof posts) => {
    if (!user || !postRows.length) {
      setReactionsByPost(new Map());
      return;
    }
    const map = await fetchChannelPostReactions(
      postRows.map((p) => p.id),
      user.id,
    );
    const enriched = new Map<string, ReactionSummary[]>();
    for (const post of postRows) {
      enriched.set(post.id, withDefaultReactions(map.get(post.id) ?? []));
    }
    setReactionsByPost(enriched);
  };

  const load = async () => {
    if (!id || !user) return;
    const [ch, postRows, isFollowing, allowed] = await Promise.all([
      fetchChannel(id),
      fetchChannelPosts(id),
      isChannelFollowed(id, user.id),
      canPostToChannel(id, user.id),
    ]);
    setChannel(ch);
    setPosts(postRows);
    setFollowing(isFollowing);
    setCanPost(allowed);
    await loadReactions(postRows);
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [id, user?.id]);

  const toggleFollow = async () => {
    if (!id) return;
    const next = await toggleChannelFollow(id);
    setFollowing(next);
  };

  const publish = async () => {
    if (!id || !body.trim()) return;
    setPosting(true);
    try {
      await createChannelPost(id, body.trim());
      setBody("");
      await load();
    } catch (e) {
      Alert.alert("Post failed", e instanceof Error ? e.message : "Could not post.");
    } finally {
      setPosting(false);
    }
  };

  const handleReact = async (postId: string, emoji: string) => {
    await toggleChannelPostReaction(postId, emoji);
    await loadReactions(posts);
  };

  if (!channel) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Channel" />
        <Text variant="body" muted style={styles.pad}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={channel.name} />
      <ScrollView contentContainerStyle={styles.content}>
        {channel.description ? (
          <Text variant="body" muted style={styles.pad}>
            {channel.description}
          </Text>
        ) : null}
        <Pressable style={styles.pad} onPress={toggleFollow}>
          <Text variant="subheadline" color="brand">
            {following ? "Unfollow channel" : "Follow channel"}
          </Text>
        </Pressable>

        {canPost ? (
          <View style={styles.compose}>
            <TextInput
              style={styles.input}
              placeholder="Write an announcement..."
              placeholderTextColor={colors.text.secondary}
              value={body}
              onChangeText={setBody}
              multiline
            />
            <Button label="Post" onPress={publish} loading={posting} />
          </View>
        ) : (
          <Text variant="footnote" muted style={styles.pad}>
            Only channel admins can post. Follow to react to updates.
          </Text>
        )}

        {posts.map((post) => (
          <View key={post.id} style={styles.post}>
            <View style={styles.postHeader}>
              <Text variant="footnote" muted>
                {new Date(post.created_at).toLocaleString()}
              </Text>
              <Pressable
                onPress={() =>
                  openReport({
                    type: "channel_post",
                    id: post.id,
                    label: post.body.slice(0, 80),
                  })
                }
              >
                <Text variant="caption" muted>
                  Report
                </Text>
              </Pressable>
            </View>
            <Text variant="body">{post.body}</Text>
            <ChannelPostReactions
              summaries={reactionsByPost.get(post.id) ?? []}
              onReact={(emoji) => handleReact(post.id, emoji)}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { paddingBottom: spacing.xxl },
  pad: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  compose: { padding: spacing.md, gap: spacing.sm },
  input: {
    minHeight: 80,
    borderRadius: 8,
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    color: colors.text.primary,
    textAlignVertical: "top",
  },
  post: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
    gap: spacing.xs,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
