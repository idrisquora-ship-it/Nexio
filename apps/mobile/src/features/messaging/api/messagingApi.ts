import { getSupabase } from "../../../shared/lib/supabase";
import type { Database } from "@nexio/supabase";

type Json = Database["public"]["Tables"]["messages"]["Row"]["media_metadata"];

export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type ContentType = Database["public"]["Enums"]["message_content_type"];

export type UploadableContentType = Exclude<
  ContentType,
  "text" | "gig_inquiry" | "order_card" | "sticker" | "location" | "contact"
>;

export type MediaMetadata = {
  durationMs?: number;
  fileName?: string;
  mimeType?: string;
  waveform?: number[];
  gigId?: string;
  title?: string;
  coverImageUrl?: string | null;
  startingPriceCents?: number | null;
  currency?: string;
  businessName?: string;
  orderId?: string;
  status?: string;
  gigTitle?: string;
  packageTier?: string;
  priceCents?: number;
  deliveryDays?: number;
  buyerId?: string;
  sellerId?: string;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
  contactUserId?: string;
  contactUsername?: string;
  contactDisplayName?: string;
  contactAvatarUrl?: string | null;
  stickerId?: string;
};

export type ConversationListItem = Conversation & {
  other_user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  participant?: {
    pinned: boolean;
    last_read_at: string | null;
    muted: boolean;
  };
  has_unread?: boolean;
};

export type ParticipantProfile = {
  user_id: string;
  role: string;
  profiles: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
};

const BUCKET_BY_TYPE: Record<UploadableContentType, string> = {
  image: "chat_images",
  video: "chat_videos",
  voice: "voice_notes",
  document: "documents",
  gif: "chat_images",
};

const EXT_BY_TYPE: Record<UploadableContentType, string> = {
  image: "jpg",
  video: "mp4",
  voice: "m4a",
  document: "bin",
  gif: "gif",
};

export function getConversationTitle(item: ConversationListItem): string {
  if (item.type === "group") {
    return item.name ?? "Group chat";
  }
  return item.other_user?.display_name ?? item.other_user?.username ?? "Chat";
}

export function parseMediaMetadata(raw: Json | null): MediaMetadata | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as MediaMetadata;
}

export async function fetchConversation(conversationId: string) {
  const { data, error } = await getSupabase()
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchParticipants(conversationId: string): Promise<ParticipantProfile[]> {
  const { data: rows, error } = await getSupabase()
    .from("conversation_participants")
    .select("user_id, role")
    .eq("conversation_id", conversationId);

  if (error) throw error;
  if (!rows?.length) return [];

  const userIds = rows.map((r) => r.user_id);
  const { data: profiles, error: profileError } = await getSupabase()
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", userIds);

  if (profileError) throw profileError;

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((row) => ({
    user_id: row.user_id,
    role: row.role,
    profiles: profileById.get(row.user_id) ?? null,
  }));
}

export async function fetchConversations(userId: string): Promise<ConversationListItem[]> {
  const { data: memberships, error } = await getSupabase()
    .from("conversation_participants")
    .select("conversation_id, pinned, last_read_at, muted")
    .eq("user_id", userId)
    .eq("archived", false);

  if (error) throw error;
  if (!memberships?.length) return [];

  const membershipByConv = new Map(memberships.map((m) => [m.conversation_id, m]));
  const conversationIds = memberships.map((m) => m.conversation_id);

  const { data: conversations, error: convError } = await getSupabase()
    .from("conversations")
    .select("*")
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (convError) throw convError;

  const results: ConversationListItem[] = [];

  for (const conversation of conversations ?? []) {
    const membership = membershipByConv.get(conversation.id);
    const { data: otherRows } = await getSupabase()
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversation.id)
      .neq("user_id", userId)
      .limit(1);

    const otherUserId = otherRows?.[0]?.user_id;
    let otherUser: ConversationListItem["other_user"] = null;

    if (otherUserId) {
      const { data: profile } = await getSupabase()
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", otherUserId)
        .maybeSingle();
      otherUser = profile;
    }

    const lastRead = membership?.last_read_at ? new Date(membership.last_read_at).getTime() : 0;
    const lastMsg = conversation.last_message_at ? new Date(conversation.last_message_at).getTime() : 0;
    const hasUnread = lastMsg > lastRead;

    results.push({
      ...conversation,
      other_user: otherUser,
      participant: membership
        ? {
            pinned: membership.pinned,
            last_read_at: membership.last_read_at,
            muted: membership.muted,
          }
        : undefined,
      has_unread: hasUnread,
    });
  }

  return results.sort((a, b) => {
    const aPin = a.participant?.pinned ? 1 : 0;
    const bPin = b.participant?.pinned ? 1 : 0;
    if (aPin !== bPin) return bPin - aPin;
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bTime - aTime;
  });
}

export async function searchProfiles(query: string, excludeUserId: string) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
    .neq("id", excludeUserId)
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function getOrCreateDirectConversation(otherUserId: string) {
  const { data, error } = await getSupabase().rpc("get_or_create_direct_conversation", {
    other_user_id: otherUserId,
  });

  if (error) throw error;
  return data as string;
}

export async function fetchMessages(conversationId: string) {
  const { data, error } = await getSupabase()
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchMessageById(messageId: string) {
  const { data, error } = await getSupabase()
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getSignedMediaUrl(contentType: ContentType, storagePath: string) {
  if (
    contentType === "text" ||
    contentType === "gig_inquiry" ||
    contentType === "order_card" ||
    contentType === "sticker" ||
    contentType === "location" ||
    contentType === "contact" ||
    !storagePath
  ) {
    return null;
  }
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }
  const bucket = BUCKET_BY_TYPE[contentType as keyof typeof BUCKET_BY_TYPE];
  if (!bucket) return null;
  const { data, error } = await getSupabase().storage.from(bucket).createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

async function uploadToBucket(
  bucket: string,
  storagePath: string,
  localUri: string,
  contentType: string,
) {
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await getSupabase()
    .storage
    .from(bucket)
    .upload(storagePath, arrayBuffer, { contentType, upsert: false });

  if (error) throw error;
  return storagePath;
}

export async function uploadChatMedia(
  conversationId: string,
  userId: string,
  localUri: string,
  type: UploadableContentType,
  options?: { extension?: string; mimeType?: string },
) {
  const ext = options?.extension ?? EXT_BY_TYPE[type];
  const storagePath = `${conversationId}/${userId}-${Date.now()}.${ext}`;
  const mimeType = options?.mimeType ?? "application/octet-stream";
  return uploadToBucket(BUCKET_BY_TYPE[type], storagePath, localUri, mimeType);
}

export async function uploadChatImage(conversationId: string, userId: string, localUri: string) {
  return uploadChatMedia(conversationId, userId, localUri, "image", {
    extension: "jpg",
    mimeType: "image/jpeg",
  });
}

export async function sendMessage(input: {
  conversationId: string;
  senderId: string;
  body: string;
  clientId: string;
  contentType?: ContentType;
  mediaUrl?: string | null;
  mediaMetadata?: MediaMetadata | null;
  replyToId?: string | null;
}) {
  const { data, error } = await getSupabase()
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      body: input.body.trim(),
      client_id: input.clientId,
      status: "sent",
      content_type: input.contentType ?? "text",
      media_url: input.mediaUrl ?? null,
      media_metadata: (input.mediaMetadata ?? null) as Json | null,
      reply_to_id: input.replyToId ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMessage(messageId: string) {
  const { error } = await getSupabase()
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId);

  if (error) throw error;
}

export async function forwardMessage(
  message: Message,
  targetConversationId: string,
  senderId: string,
) {
  let mediaUrl = message.media_url;
  const metadata = parseMediaMetadata(message.media_metadata);

  if (
    message.content_type !== "text" &&
    message.content_type !== "gig_inquiry" &&
    message.content_type !== "order_card" &&
    message.media_url
  ) {
    if (
      message.content_type === "gif" &&
      (message.media_url.startsWith("http://") || message.media_url.startsWith("https://"))
    ) {
      mediaUrl = message.media_url;
    } else if (
      message.content_type === "image" ||
      message.content_type === "video" ||
      message.content_type === "voice" ||
      message.content_type === "document" ||
      message.content_type === "gif"
    ) {
      const signed = await getSignedMediaUrl(message.content_type, message.media_url);
      if (signed) {
        const mediaType = message.content_type as UploadableContentType;
        mediaUrl = await uploadChatMedia(targetConversationId, senderId, signed, mediaType, {
          extension: message.media_url.split(".").pop() ?? EXT_BY_TYPE[mediaType],
          mimeType: metadata?.mimeType,
        });
      }
    }
  }

  const prefix = message.content_type === "text" ? "↪ " : "";
  const body = message.body ? `${prefix}${message.body}` : prefix.trim();

  return sendMessage({
    conversationId: targetConversationId,
    senderId,
    body,
    clientId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    contentType: message.content_type,
    mediaUrl,
    mediaMetadata: metadata,
  });
}

export async function toggleReaction(messageId: string, userId: string, emoji: string) {
  const { data: existing } = await getSupabase()
    .from("message_reactions")
    .select("*")
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    const { error } = await getSupabase()
      .from("message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("emoji", emoji);
    if (error) throw error;
    return { added: false };
  }

  const { error } = await getSupabase()
    .from("message_reactions")
    .insert({ message_id: messageId, user_id: userId, emoji });

  if (error) throw error;
  return { added: true };
}

export async function fetchReactions(messageIds: string[]) {
  if (!messageIds.length) return {};
  const { data, error } = await getSupabase()
    .from("message_reactions")
    .select("message_id, emoji, user_id")
    .in("message_id", messageIds);

  if (error) throw error;

  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    if (!map[row.message_id]) map[row.message_id] = [];
    map[row.message_id].push(row.emoji);
  }
  return map;
}

export function subscribeToMessages(
  conversationId: string,
  onInsert: (message: Message) => void,
) {
  const channel = getSupabase()
    .channel(`conversation:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onInsert(payload.new as Message),
    )
    .subscribe();

  return () => {
    getSupabase().removeChannel(channel);
  };
}

export function subscribeToConversations(userId: string, onChange: () => void) {
  const channel = getSupabase()
    .channel(`user-conversations:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "conversations" },
      () => onChange(),
    )
    .subscribe();

  return () => {
    getSupabase().removeChannel(channel);
  };
}

export async function fetchPinnedMessages(conversationId: string) {
  const { data, error } = await getSupabase()
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .not("pinned_at", "is", null)
    .order("pinned_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchStarredMessages(userId: string) {
  const { data: stars, error } = await getSupabase()
    .from("starred_messages")
    .select("message_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!stars?.length) return [];

  const ids = stars.map((s) => s.message_id);
  const { data: messages, error: msgError } = await getSupabase()
    .from("messages")
    .select("*")
    .in("id", ids)
    .is("deleted_at", null);

  if (msgError) throw msgError;
  const byId = new Map((messages ?? []).map((m) => [m.id, m]));
  return stars.map((s) => byId.get(s.message_id)).filter(Boolean) as Message[];
}

export async function editMessage(messageId: string, body: string) {
  const { data, error } = await getSupabase().rpc("edit_message", {
    p_message_id: messageId,
    p_body: body,
  });
  if (error) throw error;
  return data as Message;
}

export async function pinMessage(messageId: string) {
  const { data, error } = await getSupabase().rpc("pin_message", { p_message_id: messageId });
  if (error) throw error;
  return data as Message;
}

export async function unpinMessage(messageId: string) {
  const { data, error } = await getSupabase().rpc("unpin_message", { p_message_id: messageId });
  if (error) throw error;
  return data as Message;
}

export async function toggleStarMessage(messageId: string) {
  const { data, error } = await getSupabase().rpc("toggle_star_message", {
    p_message_id: messageId,
  });
  if (error) throw error;
  return data as boolean;
}

export async function markConversationUnread(conversationId: string) {
  const { error } = await getSupabase().rpc("mark_conversation_unread", {
    p_conversation_id: conversationId,
  });
  if (error) throw error;
}

export async function markConversationRead(conversationId: string) {
  const { error } = await getSupabase().rpc("mark_conversation_read", {
    p_conversation_id: conversationId,
  });
  if (error) throw error;
}

export async function fetchStarredMessageIds(userId: string) {
  const { data, error } = await getSupabase()
    .from("starred_messages")
    .select("message_id")
    .eq("user_id", userId);

  if (error) throw error;
  return new Set((data ?? []).map((r) => r.message_id));
}

export async function updateConversationParticipant(
  conversationId: string,
  patch: { pinned?: boolean; muted?: boolean; archived?: boolean },
) {
  const { error } = await getSupabase()
    .from("conversation_participants")
    .update(patch)
    .eq("conversation_id", conversationId);

  if (error) throw error;
}

export async function fetchOtherParticipantReadAt(conversationId: string, userId: string) {
  const { data, error } = await getSupabase()
    .from("conversation_participants")
    .select("last_read_at, user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.last_read_at ?? null;
}

let typingChannel: ReturnType<ReturnType<typeof getSupabase>["channel"]> | null = null;

export function subscribeToTyping(
  conversationId: string,
  currentUserId: string,
  onTyping: (userId: string) => void,
) {
  const channel = getSupabase()
    .channel(`typing:${conversationId}`)
    .on("broadcast", { event: "typing" }, (payload) => {
      const uid = (payload.payload as { userId?: string })?.userId;
      if (uid && uid !== currentUserId) onTyping(uid);
    })
    .subscribe();

  typingChannel = channel;
  return () => {
    getSupabase().removeChannel(channel);
    if (typingChannel === channel) typingChannel = null;
  };
}

export function broadcastTyping(conversationId: string, userId: string) {
  const channel =
    typingChannel ?? getSupabase().channel(`typing:${conversationId}`);
  if (!typingChannel) {
    channel.subscribe();
    typingChannel = channel;
  }
  channel.send({
    type: "broadcast",
    event: "typing",
    payload: { userId },
  });
}
