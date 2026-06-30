import { getSupabase } from "../../../shared/lib/supabase";
import type { Database } from "@nexio/supabase";

export type Story = Database["public"]["Tables"]["stories"]["Row"];
export type StoryType = Database["public"]["Enums"]["story_type"];
export type BusinessPost = Database["public"]["Tables"]["business_posts"]["Row"];
export type ChannelPost = Database["public"]["Tables"]["channel_posts"]["Row"];
export type Community = Database["public"]["Tables"]["communities"]["Row"];
export type Channel = Database["public"]["Tables"]["channels"]["Row"];
export type CommunityRole = Database["public"]["Enums"]["community_role"];

export type StoryTrayUser = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  hasUnviewed: boolean;
  stories: StoryWithMedia[];
};

export type StoryWithMedia = Story & { mediaSignedUrl?: string | null };

export type BusinessPostItem = BusinessPost & {
  business: {
    id: string;
    business_name: string;
    slug: string;
    logo_url: string | null;
  } | null;
};

export type ChannelPostItem = ChannelPost & {
  channel: Pick<Channel, "id" | "name" | "avatar_url"> | null;
  community?: Pick<Community, "id" | "name" | "slug"> | null;
};

export type CommunityDetail = Community & {
  memberCount: number;
  isMember: boolean;
  myRole: CommunityRole | null;
  channels: Channel[];
  groups: { id: string; name: string | null; avatar_url: string | null }[];
};

async function signedStoryUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data, error } = await getSupabase().storage.from("stories").createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

export async function uploadStoryMedia(userId: string, storyId: string, localUri: string, isVideo: boolean) {
  const ext = isVideo ? "mp4" : "jpg";
  const path = `${userId}/${storyId}.${ext}`;
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();
  const { error } = await getSupabase()
    .storage
    .from("stories")
    .upload(path, arrayBuffer, { contentType: isVideo ? "video/mp4" : "image/jpeg", upsert: true });
  if (error) throw error;
  return path;
}

export async function fetchStoryTray(currentUserId: string): Promise<StoryTrayUser[]> {
  const now = new Date().toISOString();
  const { data: rows, error } = await getSupabase()
    .from("stories")
    .select("*, profiles!inner(id, username, display_name, avatar_url)")
    .gt("expires_at", now)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!rows?.length) return [];

  const storyIds = rows.map((r) => r.id);
  const { data: views } = await getSupabase()
    .from("story_views")
    .select("story_id")
    .eq("viewer_id", currentUserId)
    .in("story_id", storyIds);

  const viewedSet = new Set((views ?? []).map((v) => v.story_id));
  const byUser = new Map<string, StoryTrayUser>();

  for (const row of rows) {
    const profile = row.profiles as {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
    };
    const story = row as Story & { profiles: typeof profile };
    const mediaSignedUrl = await signedStoryUrl(story.media_url);
    const item: StoryWithMedia = { ...story, mediaSignedUrl };

    const existing = byUser.get(profile.id);
    if (!existing) {
      byUser.set(profile.id, {
        userId: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        hasUnviewed: !viewedSet.has(story.id),
        stories: [item],
      });
    } else {
      existing.stories.push(item);
      if (!viewedSet.has(story.id)) existing.hasUnviewed = true;
    }
  }

  return Array.from(byUser.values());
}

export async function fetchUserStories(userId: string): Promise<StoryWithMedia[]> {
  const now = new Date().toISOString();
  const { data, error } = await getSupabase()
    .from("stories")
    .select("*")
    .eq("user_id", userId)
    .gt("expires_at", now)
    .order("created_at", { ascending: true });

  if (error) throw error;
  const stories = data ?? [];
  return Promise.all(
    stories.map(async (s) => ({
      ...s,
      mediaSignedUrl: await signedStoryUrl(s.media_url),
    })),
  );
}

export async function createStory(input: {
  storyType: StoryType;
  mediaPath?: string | null;
  textContent?: string | null;
  backgroundColor?: string | null;
}) {
  const { data, error } = await getSupabase().rpc("create_story", {
    p_story_type: input.storyType,
    p_media_url: input.mediaPath ?? undefined,
    p_text_content: input.textContent ?? undefined,
    p_background_color: input.backgroundColor ?? undefined,
  });
  if (error) throw error;
  return data as string;
}

export async function markStoryViewed(storyId: string) {
  const { error } = await getSupabase().rpc("view_story", { p_story_id: storyId });
  if (error) throw error;
}

export async function replyToStory(storyOwnerId: string, message: string, senderId: string) {
  const { getOrCreateDirectConversation, sendMessage } = await import("../../messaging/api/messagingApi");
  const conversationId = await getOrCreateDirectConversation(storyOwnerId);
  await sendMessage({
    conversationId,
    senderId,
    body: message,
    clientId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
  });
  return conversationId;
}

export async function fetchFollowedBusinessPosts(userId: string): Promise<BusinessPostItem[]> {
  const { data: follows, error: followError } = await getSupabase()
    .from("business_follows")
    .select("business_id")
    .eq("follower_id", userId);

  if (followError) throw followError;
  const ids = (follows ?? []).map((f) => f.business_id);
  if (!ids.length) return [];

  const { data, error } = await getSupabase()
    .from("business_posts")
    .select("*, business_profiles(id, business_name, slug, logo_url)")
    .in("business_id", ids)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    business: row.business_profiles as BusinessPostItem["business"],
  }));
}

export async function fetchFollowedChannelPosts(userId: string): Promise<ChannelPostItem[]> {
  const { data: follows, error: followError } = await getSupabase()
    .from("channel_followers")
    .select("channel_id")
    .eq("user_id", userId);

  if (followError) throw followError;
  const ids = (follows ?? []).map((f) => f.channel_id);
  if (!ids.length) return [];

  const { data, error } = await getSupabase()
    .from("channel_posts")
    .select("*, channels(id, name, avatar_url)")
    .in("channel_id", ids)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    channel: row.channels as ChannelPostItem["channel"],
  }));
}

export async function toggleBusinessFollow(businessId: string) {
  const { data, error } = await getSupabase().rpc("toggle_business_follow", {
    p_business_id: businessId,
  });
  if (error) throw error;
  return data as boolean;
}

export async function isBusinessFollowed(businessId: string, followerId: string) {
  const { data, error } = await getSupabase()
    .from("business_follows")
    .select("business_id")
    .eq("business_id", businessId)
    .eq("follower_id", followerId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function publishBusinessPost(
  businessId: string,
  body: string,
  mediaUrl?: string | null,
  mediaType?: string | null,
) {
  const { data, error } = await getSupabase().rpc("publish_business_post", {
    p_business_id: businessId,
    p_body: body,
    p_media_url: mediaUrl ?? undefined,
    p_media_type: mediaType ?? undefined,
  });
  if (error) throw error;
  return data as string;
}

export async function createCommunity(name: string, slug: string, description?: string) {
  const { data, error } = await getSupabase().rpc("create_community", {
    p_name: name,
    p_slug: slug,
    p_description: description ?? undefined,
    p_is_public: true,
  });
  if (error) throw error;
  return data as string;
}

export async function joinCommunity(communityId: string) {
  const { error } = await getSupabase().rpc("join_community", { p_community_id: communityId });
  if (error) throw error;
}

export async function fetchCommunity(communityId: string, userId?: string): Promise<CommunityDetail | null> {
  const { data: community, error } = await getSupabase()
    .from("communities")
    .select("*")
    .eq("id", communityId)
    .maybeSingle();

  if (error) throw error;
  if (!community) return null;

  const [{ count }, { data: membership }, { data: channels }, { data: groups }] = await Promise.all([
    getSupabase()
      .from("community_members")
      .select("*", { count: "exact", head: true })
      .eq("community_id", communityId),
    userId
      ? getSupabase()
          .from("community_members")
          .select("role")
          .eq("community_id", communityId)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    getSupabase().from("channels").select("*").eq("community_id", communityId).order("created_at"),
    getSupabase()
      .from("conversations")
      .select("id, name, avatar_url")
      .eq("community_id", communityId)
      .eq("type", "group")
      .order("created_at"),
  ]);

  return {
    ...community,
    memberCount: count ?? 0,
    isMember: !!membership,
    myRole: (membership?.role as CommunityRole | undefined) ?? null,
    channels: channels ?? [],
    groups: groups ?? [],
  };
}

export async function fetchPublicCommunities() {
  const { data, error } = await getSupabase()
    .from("communities")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function createChannel(name: string, communityId?: string, businessId?: string) {
  const { data, error } = await getSupabase().rpc("create_channel", {
    p_name: name,
    p_community_id: communityId ?? undefined,
    p_business_id: businessId ?? undefined,
    p_description: undefined,
  });
  if (error) throw error;
  return data as string;
}

export async function fetchChannel(channelId: string) {
  const { data, error } = await getSupabase()
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchChannelPosts(channelId: string) {
  const { data, error } = await getSupabase()
    .from("channel_posts")
    .select("*")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function isChannelFollowed(channelId: string, userId: string) {
  const { data, error } = await getSupabase()
    .from("channel_followers")
    .select("channel_id")
    .eq("channel_id", channelId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function createChannelPost(
  channelId: string,
  body: string,
  mediaUrl?: string | null,
  mediaType?: string | null,
) {
  const { data, error } = await getSupabase().rpc("create_channel_post", {
    p_channel_id: channelId,
    p_body: body,
    p_media_url: mediaUrl ?? undefined,
    p_media_type: mediaType ?? undefined,
  });
  if (error) throw error;
  return data as string;
}

export async function toggleChannelFollow(channelId: string) {
  const { data, error } = await getSupabase().rpc("toggle_channel_follow", {
    p_channel_id: channelId,
  });
  if (error) throw error;
  return data as boolean;
}

export async function fetchMyCommunities(userId: string) {
  const { data: memberships, error: memberError } = await getSupabase()
    .from("community_members")
    .select("community_id")
    .eq("user_id", userId);

  if (memberError) throw memberError;
  const ids = (memberships ?? []).map((m) => m.community_id);
  if (!ids.length) return [];

  const { data, error } = await getSupabase()
    .from("communities")
    .select("*")
    .in("id", ids)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function fetchCommunityAnnouncements(userId: string): Promise<ChannelPostItem[]> {
  const { data: memberships, error: memberError } = await getSupabase()
    .from("community_members")
    .select("community_id")
    .eq("user_id", userId);

  if (memberError) throw memberError;
  const communityIds = (memberships ?? []).map((m) => m.community_id);
  if (!communityIds.length) return [];

  const { data: channels, error: channelError } = await getSupabase()
    .from("channels")
    .select("id, community_id, communities(id, name, slug)")
    .in("community_id", communityIds);

  if (channelError) throw channelError;
  const channelIds = (channels ?? []).map((c) => c.id);
  if (!channelIds.length) return [];

  const channelCommunityMap = new Map(
    (channels ?? []).map((c) => [
      c.id,
      c.communities as Pick<Community, "id" | "name" | "slug"> | null,
    ]),
  );

  const { data, error } = await getSupabase()
    .from("channel_posts")
    .select("*, channels(id, name, avatar_url)")
    .in("channel_id", channelIds)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    channel: row.channels as ChannelPostItem["channel"],
    community: channelCommunityMap.get(row.channel_id) ?? null,
  }));
}

export async function canPostToChannel(channelId: string, userId: string): Promise<boolean> {
  const { data: channel, error } = await getSupabase()
    .from("channels")
    .select("owner_id, community_id, business_id")
    .eq("id", channelId)
    .maybeSingle();

  if (error || !channel) return false;
  if (channel.owner_id === userId) return true;

  if (channel.business_id) {
    const { data: biz } = await getSupabase()
      .from("business_profiles")
      .select("user_id")
      .eq("id", channel.business_id)
      .maybeSingle();
    if (biz?.user_id === userId) return true;
  }

  if (channel.community_id) {
    const { data: member } = await getSupabase()
      .from("community_members")
      .select("role")
      .eq("community_id", channel.community_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (member?.role === "owner" || member?.role === "admin") return true;
  }

  return false;
}

export async function fetchChannelPostReactions(postIds: string[], userId: string) {
  if (!postIds.length) return new Map<string, { emoji: string; count: number; reacted: boolean }[]>();

  const { data, error } = await getSupabase()
    .from("channel_post_reactions")
    .select("post_id, emoji, user_id")
    .in("post_id", postIds);

  if (error) throw error;

  const byPost = new Map<string, Map<string, { count: number; reacted: boolean }>>();
  for (const row of data ?? []) {
    if (!byPost.has(row.post_id)) byPost.set(row.post_id, new Map());
    const emojiMap = byPost.get(row.post_id)!;
    const existing = emojiMap.get(row.emoji) ?? { count: 0, reacted: false };
    emojiMap.set(row.emoji, {
      count: existing.count + 1,
      reacted: existing.reacted || row.user_id === userId,
    });
  }

  const result = new Map<string, { emoji: string; count: number; reacted: boolean }[]>();
  for (const postId of postIds) {
    const emojiMap = byPost.get(postId);
    result.set(
      postId,
      emojiMap
        ? Array.from(emojiMap.entries()).map(([emoji, meta]) => ({ emoji, ...meta }))
        : [],
    );
  }
  return result;
}

export async function toggleChannelPostReaction(postId: string, emoji: string) {
  const { data, error } = await getSupabase().rpc("toggle_channel_post_reaction", {
    p_post_id: postId,
    p_emoji: emoji,
  });
  if (error) throw error;
  return data as string | null;
}

export type StoryViewerProfile = {
  viewer_id: string;
  viewed_at: string;
  profiles: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
};

export async function fetchStoryViewers(storyId: string) {
  const { data, error } = await getSupabase()
    .from("story_views")
    .select("viewer_id, viewed_at, profiles(id, display_name, username, avatar_url)")
    .eq("story_id", storyId)
    .order("viewed_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as StoryViewerProfile[];
}

export function subscribeToChannelPosts(onInsert: () => void) {
  const channel = getSupabase()
    .channel("updates-channel-posts")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "channel_posts" },
      () => onInsert(),
    )
    .subscribe();

  return () => {
    getSupabase().removeChannel(channel);
  };
}
