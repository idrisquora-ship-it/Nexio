import { getSupabase } from "../../../shared/lib/supabase";
import type { Database } from "@nexio/supabase";
import { groupByRecency } from "@nexio/shared";

export type NotificationCategory = Database["public"]["Enums"]["notification_category"];
export type NotificationLog = Database["public"]["Tables"]["notification_log"]["Row"];
export type NotificationPreference = Database["public"]["Tables"]["notification_preferences"]["Row"];

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  message: "Messages",
  call: "Calls",
  story: "Stories",
  business_update: "Business updates",
  marketplace: "Marketplace",
  order: "Orders",
  review: "Reviews",
  verification: "Verification",
  mention: "Mentions",
  follower: "New followers",
  community: "Community",
  system: "System",
};

export type NotificationGroup = {
  title: string;
  items: NotificationLog[];
};

export function groupNotifications(items: NotificationLog[]): NotificationGroup[] {
  return groupByRecency(items);
}

export async function fetchNotifications(limit = 100) {
  const { data, error } = await getSupabase()
    .from("notification_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function fetchUnreadCount() {
  const { data, error } = await getSupabase().rpc("get_unread_notification_count");
  if (error) throw error;
  return data ?? 0;
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await getSupabase().rpc("mark_notification_read", {
    p_notification_id: notificationId,
  });
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const { data, error } = await getSupabase().rpc("mark_all_notifications_read");
  if (error) throw error;
  return data ?? 0;
}

export async function fetchNotificationPreferences() {
  const { data, error } = await getSupabase()
    .from("notification_preferences")
    .select("*")
    .order("category");

  if (error) throw error;
  return data ?? [];
}

export async function updateNotificationPreference(
  category: NotificationCategory,
  patch: Partial<Pick<NotificationPreference, "push_enabled" | "in_app_enabled">>,
) {
  const { data: session } = await getSupabase().auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error("Not signed in");

  const { data, error } = await getSupabase()
    .from("notification_preferences")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("category", category)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function getNotificationRoute(data: NotificationLog["data"]): string | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  if (record.conversationId) return `/(tabs)/chats/${String(record.conversationId)}`;
  if (record.businessPostId) return "/(tabs)/updates";
  if (record.businessId) return `/business/${String(record.businessId)}`;
  if (record.orderId) return `/marketplace/orders/${String(record.orderId)}`;
  if (record.gigId) return `/marketplace/gig/${String(record.gigId)}`;
  if (record.storyId || record.userId) return "/(tabs)/updates";
  if (record.channelId) return `/updates/channel/${String(record.channelId)}`;
  if (record.callId && record.conversationId) {
    return `/(tabs)/chats/${String(record.conversationId)}`;
  }
  return null;
}
