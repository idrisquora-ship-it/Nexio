import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../src/features/auth/store/authStore";
import { useReportStore } from "../../src/features/moderation/store/reportStore";
import {
  CHANNEL_REACTION_EMOJIS,
} from "../../src/features/updates/components/ChannelPostReactions";
import {
  fetchChannelPostReactions,
  fetchCommunityAnnouncements,
  fetchFollowedBusinessPosts,
  fetchFollowedChannelPosts,
  fetchMyCommunities,
  fetchStoryTray,
  subscribeToChannelPosts,
  toggleChannelPostReaction,
  type BusinessPostItem,
  type ChannelPostItem,
  type Community,
  type StoryTrayUser,
} from "../../src/features/updates/api/updatesApi";
import { fetchActiveAnnouncements } from "../../src/features/moderation/api/reportsApi";
import { AnnouncementCard } from "../../src/features/updates/components/AnnouncementCard";
import { BusinessPostCard } from "../../src/features/updates/components/BusinessPostCard";
import { ChannelPostCard } from "../../src/features/updates/components/ChannelPostCard";
import { StoryRing } from "../../src/features/updates/components/StoryRing";
import { UpdatesFeedSection } from "../../src/features/updates/components/UpdatesFeedSection";
import { EmptyState, ScreenHeader, Text } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";
import type { Announcement } from "../../src/features/moderation/api/reportsApi";
import type { ReactionSummary } from "../../src/features/updates/components/ChannelPostReactions";

function withDefaultReactions(
  summaries: { emoji: string; count: number; reacted: boolean }[],
): ReactionSummary[] {
  return CHANNEL_REACTION_EMOJIS.map((emoji) => {
    const found = summaries.find((s) => s.emoji === emoji);
    return found ?? { emoji, count: 0, reacted: false };
  });
}

export default function UpdatesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const openReport = useReportStore((s) => s.open);
  const [tray, setTray] = useState<StoryTrayUser[]>([]);
  const [announcements, setAnnouncements] = useState<ChannelPostItem[]>([]);
  const [channelPosts, setChannelPosts] = useState<ChannelPostItem[]>([]);
  const [businessPosts, setBusinessPosts] = useState<BusinessPostItem[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [platformAnnouncements, setPlatformAnnouncements] = useState<Announcement[]>([]);
  const [reactionsByPost, setReactionsByPost] = useState<
    Map<string, ReactionSummary[]>
  >(new Map());
  const [refreshing, setRefreshing] = useState(false);

  const loadReactions = useCallback(
    async (posts: ChannelPostItem[]) => {
      if (!user || !posts.length) {
        setReactionsByPost(new Map());
        return;
      }
      const map = await fetchChannelPostReactions(
        posts.map((p) => p.id),
        user.id,
      );
      const enriched = new Map<string, ReactionSummary[]>();
      for (const post of posts) {
        enriched.set(post.id, withDefaultReactions(map.get(post.id) ?? []));
      }
      setReactionsByPost(enriched);
    },
    [user],
  );

  const load = useCallback(async () => {
    if (!user) return;
    const [trayRows, communityPosts, channels, businesses, joined, platform] = await Promise.all([
      fetchStoryTray(user.id),
      fetchCommunityAnnouncements(user.id),
      fetchFollowedChannelPosts(user.id),
      fetchFollowedBusinessPosts(user.id),
      fetchMyCommunities(user.id),
      fetchActiveAnnouncements(),
    ]);
    setTray(trayRows);
    setAnnouncements(communityPosts);
    setChannelPosts(channels);
    setBusinessPosts(businesses);
    setMyCommunities(joined);
    setPlatformAnnouncements(platform);
    await loadReactions([...communityPosts, ...channels]);
  }, [user, loadReactions]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  useEffect(() => {
    return subscribeToChannelPosts(() => {
      load().catch(() => undefined);
    });
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const handleReact = async (postId: string, emoji: string) => {
    if (!user) return;
    await toggleChannelPostReaction(postId, emoji);
    const allPosts = [...announcements, ...channelPosts];
    await loadReactions(allPosts);
  };

  const hasFeed =
    platformAnnouncements.length > 0 ||
    announcements.length > 0 ||
    channelPosts.length > 0 ||
    businessPosts.length > 0;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Updates" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
      >
        <StoryRing
          tray={tray}
          currentUserId={user?.id}
          onAddStory={() => router.push("/updates/story/create")}
          onOpenUser={(userId) => router.push(`/updates/story/${userId}`)}
        />

        <View style={styles.actions}>
          <Pressable onPress={() => router.push("/community/create")}>
            <Text variant="subheadline" color="brand">
              Create community
            </Text>
          </Pressable>
        </View>

        {platformAnnouncements.length > 0 ? (
          <UpdatesFeedSection title="From Nexio" isEmpty={false}>
            {platformAnnouncements.map((item) => (
              <AnnouncementCard key={`platform-${item.id}`} item={item} />
            ))}
          </UpdatesFeedSection>
        ) : null}

        <UpdatesFeedSection
          title="Community announcements"
          isEmpty={announcements.length === 0}
          emptyMessage="Join communities to see announcements here."
        >
          {announcements.map((post) => (
            <ChannelPostCard
              key={`ann-${post.id}`}
              post={post}
              reactions={reactionsByPost.get(post.id) ?? []}
              onPressChannel={(id) => router.push(`/updates/channel/${id}`)}
              onPressCommunity={(id) => router.push(`/community/${id}`)}
              onReact={(emoji) => handleReact(post.id, emoji)}
              onReport={() =>
                openReport({
                  type: "channel_post",
                  id: post.id,
                  label: post.body.slice(0, 80),
                })
              }
            />
          ))}
        </UpdatesFeedSection>

        <UpdatesFeedSection
          title="Channels"
          isEmpty={channelPosts.length === 0}
          emptyMessage="Follow channels to see posts here."
        >
          {channelPosts.map((post) => (
            <ChannelPostCard
              key={post.id}
              post={post}
              reactions={reactionsByPost.get(post.id) ?? []}
              onPressChannel={(id) => router.push(`/updates/channel/${id}`)}
              onReact={(emoji) => handleReact(post.id, emoji)}
              onReport={() =>
                openReport({
                  type: "channel_post",
                  id: post.id,
                  label: post.body.slice(0, 80),
                })
              }
            />
          ))}
        </UpdatesFeedSection>

        <UpdatesFeedSection
          title="Business updates"
          isEmpty={businessPosts.length === 0}
          emptyMessage="Follow businesses to see their posts."
        >
          {businessPosts.map((post) => (
            <BusinessPostCard
              key={post.id}
              post={post}
              onPressBusiness={(slug) => router.push(`/business/${slug}`)}
            />
          ))}
        </UpdatesFeedSection>

        <UpdatesFeedSection
          title="Your communities"
          isEmpty={myCommunities.length === 0}
          emptyMessage="Join or create a community."
        >
          {myCommunities.map((community) => (
            <Pressable
              key={community.id}
              style={styles.communityRow}
              onPress={() => router.push(`/community/${community.id}`)}
            >
              <Text variant="headline">{community.name}</Text>
              <Text variant="footnote" muted>
                @{community.slug}
              </Text>
            </Pressable>
          ))}
        </UpdatesFeedSection>

        {!hasFeed && tray.length === 0 ? (
          <EmptyState
            title="Your feed is quiet"
            message="Post a story, follow a business, or join a community to get started."
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { paddingBottom: spacing.xxl },
  actions: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  communityRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
});
