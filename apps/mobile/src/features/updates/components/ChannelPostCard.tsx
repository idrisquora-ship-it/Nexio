import { Image, Pressable, StyleSheet, View } from "react-native";
import { Flag } from "lucide-react-native";
import { Avatar, Card, Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";
import type { ChannelPostItem } from "../api/updatesApi";
import { ChannelPostReactions, type ReactionSummary } from "./ChannelPostReactions";

interface ChannelPostCardProps {
  post: ChannelPostItem;
  reactions?: ReactionSummary[];
  onPressChannel?: (channelId: string) => void;
  onPressCommunity?: (communityId: string) => void;
  onReact?: (emoji: string) => void;
  onReport?: () => void;
}

export function ChannelPostCard({
  post,
  reactions = [],
  onPressChannel,
  onPressCommunity,
  onReact,
  onReport,
}: ChannelPostCardProps) {
  const channel = post.channel;
  const community = post.community;

  return (
    <Card style={styles.card}>
      {community ? (
        <Pressable onPress={() => onPressCommunity?.(community.id)} style={styles.communityTag}>
          <Text variant="caption" color="brand">
            {community.name}
          </Text>
        </Pressable>
      ) : null}
      <Pressable
        style={styles.header}
        onPress={() => channel && onPressChannel?.(channel.id)}
        disabled={!channel}
      >
        <Avatar uri={channel?.avatar_url} name={channel?.name ?? "Channel"} size={40} />
        <View style={styles.meta}>
          <Text variant="headline">{channel?.name ?? "Channel"}</Text>
          <Text variant="caption" muted>
            {new Date(post.created_at).toLocaleString()}
          </Text>
        </View>
        {onReport ? (
          <Pressable onPress={onReport} accessibilityLabel="Report post" hitSlop={8}>
            <Flag color={colors.text.secondary} size={16} />
          </Pressable>
        ) : null}
      </Pressable>
      <Text variant="body" style={styles.body}>
        {post.body}
      </Text>
      {post.media_url && post.media_type === "image" ? (
        <Image source={{ uri: post.media_url }} style={styles.media} resizeMode="cover" />
      ) : null}
      {onReact ? (
        <ChannelPostReactions summaries={reactions} onReact={onReact} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  communityTag: { marginBottom: spacing.xs },
  header: { flexDirection: "row", gap: spacing.sm, alignItems: "center", marginBottom: spacing.sm },
  meta: { flex: 1 },
  body: { marginBottom: spacing.sm },
  media: { width: "100%", height: 200, borderRadius: 8, backgroundColor: colors.background.tertiary },
});
