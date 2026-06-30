import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getSupabaseAdmin, notifyUsers } from "./push.ts";

type DispatchType =
  | "order"
  | "review"
  | "verification"
  | "story"
  | "follower"
  | "community"
  | "marketplace"
  | "mention"
  | "report";

type DispatchPayload = {
  type: DispatchType;
  record: Record<string, unknown>;
};

const MENTION_RE = /@([a-zA-Z0-9_]{3,30})/g;

function orderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    inquiry: "Inquiry",
    waiting: "Awaiting acceptance",
    accepted: "Accepted",
    in_progress: "In progress",
    revision_requested: "Revision requested",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    archived: "Archived",
  };
  return labels[status] ?? status;
}

async function handleOrder(supabase: ReturnType<typeof getSupabaseAdmin>, record: Record<string, unknown>) {
  const orderId = String(record.order_id ?? "");
  const toStatus = String(record.to_status ?? "");
  if (!orderId || !toStatus) return { sent: 0, errors: [] as string[] };

  const { data: order } = await supabase
    .from("orders")
    .select("id, buyer_id, seller_id, gig_id, status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { sent: 0, errors: [] };

  const { data: gig } = await supabase.from("gigs").select("title").eq("id", order.gig_id).maybeSingle();
  const title = "Order update";
  const body = `${gig?.title ?? "Your order"} is now ${orderStatusLabel(toStatus)}`;
  const recipientIds = [order.buyer_id, order.seller_id].filter(
    (id) => id && id !== String(record.actor_id ?? ""),
  );

  return notifyUsers(supabase, recipientIds, {
    category: "order",
    title,
    body,
    data: { orderId: order.id, status: toStatus },
  });
}

async function handleReview(supabase: ReturnType<typeof getSupabaseAdmin>, record: Record<string, unknown>) {
  const revieweeId = String(record.reviewee_id ?? "");
  const reviewerId = String(record.reviewer_id ?? "");
  const orderId = String(record.order_id ?? "");
  if (!revieweeId) return { sent: 0, errors: [] };

  const { data: reviewer } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", reviewerId)
    .maybeSingle();

  const name = reviewer?.display_name ?? reviewer?.username ?? "Someone";
  return notifyUsers(supabase, [revieweeId], {
    category: "review",
    title: "New review",
    body: `${name} left you a review`,
    data: { orderId, reviewerId },
  });
}

async function handleVerification(supabase: ReturnType<typeof getSupabaseAdmin>, record: Record<string, unknown>) {
  const businessId = String(record.business_id ?? "");
  const status = String(record.status ?? "");
  if (!businessId || status === "pending") return { sent: 0, errors: [] };

  const { data: business } = await supabase
    .from("business_profiles")
    .select("user_id, business_name")
    .eq("id", businessId)
    .maybeSingle();
  if (!business?.user_id) return { sent: 0, errors: [] };

  const approved = status === "approved";
  return notifyUsers(supabase, [business.user_id], {
    category: "verification",
    title: approved ? "Verification approved" : "Verification update",
    body: approved
      ? `${business.business_name} is now verified`
      : `Your verification submission was ${status}`,
    data: { businessId, status },
  });
}

async function handleStory(supabase: ReturnType<typeof getSupabaseAdmin>, record: Record<string, unknown>) {
  const authorId = String(record.user_id ?? "");
  if (!authorId) return { sent: 0, errors: [] };

  const { data: author } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", authorId)
    .maybeSingle();
  const authorName = author?.display_name ?? author?.username ?? "Someone";

  const { data: participantRows } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", authorId);

  const conversationIds = (participantRows ?? []).map((row) => row.conversation_id);
  if (!conversationIds.length) return { sent: 0, errors: [] };

  const { data: directConversations } = await supabase
    .from("conversations")
    .select("id")
    .in("id", conversationIds)
    .eq("type", "direct");

  const directConversationIds = (directConversations ?? []).map((c) => c.id);

  const { data: others } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .in("conversation_id", directConversationIds)
    .neq("user_id", authorId);

  const recipientIds = [...new Set((others ?? []).map((r) => r.user_id))];
  if (!recipientIds.length) return { sent: 0, errors: [] };

  return notifyUsers(supabase, recipientIds, {
    category: "story",
    title: "New story",
    body: `${authorName} posted a story`,
    data: { userId: authorId, storyId: String(record.id ?? "") },
  });
}

async function handleFollower(supabase: ReturnType<typeof getSupabaseAdmin>, record: Record<string, unknown>) {
  const businessId = String(record.business_id ?? "");
  const followerId = String(record.follower_id ?? "");
  if (!businessId) return { sent: 0, errors: [] };

  const { data: business } = await supabase
    .from("business_profiles")
    .select("user_id, business_name")
    .eq("id", businessId)
    .maybeSingle();
  if (!business?.user_id || business.user_id === followerId) return { sent: 0, errors: [] };

  const { data: follower } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", followerId)
    .maybeSingle();
  const followerName = follower?.display_name ?? follower?.username ?? "Someone";

  return notifyUsers(supabase, [business.user_id], {
    category: "follower",
    title: "New follower",
    body: `${followerName} followed ${business.business_name}`,
    data: { businessId, followerId },
  });
}

async function handleCommunity(supabase: ReturnType<typeof getSupabaseAdmin>, record: Record<string, unknown>) {
  const channelId = String(record.channel_id ?? "");
  const authorId = String(record.author_id ?? "");
  if (!channelId) return { sent: 0, errors: [] };

  const { data: channel } = await supabase
    .from("channels")
    .select("id, name, community_id")
    .eq("id", channelId)
    .maybeSingle();
  if (!channel?.community_id) return { sent: 0, errors: [] };

  const { data: members } = await supabase
    .from("community_members")
    .select("user_id")
    .eq("community_id", channel.community_id)
    .neq("user_id", authorId);

  const recipientIds = (members ?? []).map((m) => m.user_id);
  if (!recipientIds.length) return { sent: 0, errors: [] };

  const body = String(record.body ?? "");
  const preview = body.length > 100 ? `${body.slice(0, 100)}…` : body;

  return notifyUsers(supabase, recipientIds, {
    category: "community",
    title: `${channel.name} announcement`,
    body: preview || "New community post",
    data: { channelId, postId: String(record.id ?? ""), communityId: channel.community_id },
  });
}

async function handleMarketplace(supabase: ReturnType<typeof getSupabaseAdmin>, record: Record<string, unknown>) {
  const gigId = String(record.id ?? "");
  const businessId = String(record.business_id ?? "");
  const title = String(record.title ?? "New gig");
  if (!gigId || !businessId) return { sent: 0, errors: [] };

  const { data: follows } = await supabase
    .from("business_follows")
    .select("follower_id")
    .eq("business_id", businessId);

  const recipientIds = (follows ?? []).map((f) => f.follower_id);
  if (!recipientIds.length) return { sent: 0, errors: [] };

  const { data: business } = await supabase
    .from("business_profiles")
    .select("business_name")
    .eq("id", businessId)
    .maybeSingle();

  return notifyUsers(supabase, recipientIds, {
    category: "marketplace",
    title: `${business?.business_name ?? "A business you follow"} published a gig`,
    body: title,
    data: { gigId, businessId },
  });
}

async function handleMention(supabase: ReturnType<typeof getSupabaseAdmin>, record: Record<string, unknown>) {
  const body = String(record.body ?? "");
  const senderId = String(record.sender_id ?? "");
  const conversationId = String(record.conversation_id ?? "");
  if (!body || !senderId) return { sent: 0, errors: [] };

  const usernames = new Set<string>();
  for (const match of body.matchAll(MENTION_RE)) {
    if (match[1]) usernames.add(match[1].toLowerCase());
  }
  if (!usernames.size) return { sent: 0, errors: [] };

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("username", [...usernames]);

  const recipientIds = (profiles ?? [])
    .map((p) => p.id)
    .filter((id) => id !== senderId);
  if (!recipientIds.length) return { sent: 0, errors: [] };

  const { data: sender } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", senderId)
    .maybeSingle();
  const senderName = sender?.display_name ?? sender?.username ?? "Someone";
  const preview = body.length > 100 ? `${body.slice(0, 100)}…` : body;

  return notifyUsers(supabase, recipientIds, {
    category: "mention",
    title: `${senderName} mentioned you`,
    body: preview,
    data: { conversationId, messageId: String(record.id ?? ""), senderId },
  });
}

async function handleReport(supabase: ReturnType<typeof getSupabaseAdmin>, record: Record<string, unknown>) {
  const reportId = String(record.id ?? "");
  const targetType = String(record.target_type ?? "content");
  const reason = String(record.reason ?? "other");

  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_admin", true);

  const adminIds = (admins ?? []).map((a) => a.id);
  if (!adminIds.length) return { sent: 0, errors: [] as string[] };

  return notifyUsers(supabase, adminIds, {
    category: "system",
    title: "New report",
    body: `${targetType} reported (${reason})`,
    data: { reportId, targetType, reason },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const webhookSecret = Deno.env.get("PUSH_WEBHOOK_SECRET");
  if (webhookSecret && req.headers.get("x-webhook-secret") !== webhookSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const payload = (await req.json()) as DispatchPayload;
  const type = payload?.type;
  const record = payload?.record ?? {};

  if (!type) {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  let result = { sent: 0, errors: [] as string[] };

  switch (type) {
    case "order":
      result = await handleOrder(supabase, record);
      break;
    case "review":
      result = await handleReview(supabase, record);
      break;
    case "verification":
      result = await handleVerification(supabase, record);
      break;
    case "story":
      result = await handleStory(supabase, record);
      break;
    case "follower":
      result = await handleFollower(supabase, record);
      break;
    case "community":
      result = await handleCommunity(supabase, record);
      break;
    case "marketplace":
      result = await handleMarketplace(supabase, record);
      break;
    case "mention":
      result = await handleMention(supabase, record);
      break;
    case "report":
      result = await handleReport(supabase, record);
      break;
    default:
      return new Response(JSON.stringify({ skipped: true, reason: "unknown type" }), {
        headers: { "Content-Type": "application/json" },
      });
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});
