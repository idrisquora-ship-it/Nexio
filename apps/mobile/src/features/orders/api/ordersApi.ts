import { getSupabase } from "../../../shared/lib/supabase";
import type { Database } from "@nexio/supabase";
import type { MediaMetadata } from "../../messaging/api/messagingApi";
import { formatPrice } from "../../marketplace/api/marketplaceApi";

export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type PackageTier = Database["public"]["Enums"]["package_tier"];

export type OrderCardMetadata = MediaMetadata & {
  orderId: string;
  status: OrderStatus;
  gigId: string;
  gigTitle: string;
  packageTier: PackageTier;
  priceCents: number;
  currency: string;
  deliveryDays: number;
  buyerId?: string;
  sellerId?: string;
};

export function parseOrderCardMetadata(raw: MediaMetadata | null): OrderCardMetadata | null {
  if (!raw?.orderId || !raw.status || !raw.gigId) return null;
  return raw as OrderCardMetadata;
}

export function orderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
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

export async function fetchOrderById(orderId: string) {
  const { data, error } = await getSupabase()
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchConversationOrders(conversationId: string) {
  const { data, error } = await getSupabase()
    .from("orders")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createInquiryOrder(conversationId: string, gigId: string) {
  const { data, error } = await getSupabase().rpc("create_inquiry_order", {
    p_conversation_id: conversationId,
    p_gig_id: gigId,
  });
  if (error) throw error;
  return data as string;
}

export async function createOrderAgreement(input: {
  conversationId: string;
  gigId: string;
  packageTier: PackageTier;
  terms?: string;
}) {
  const { data, error } = await getSupabase().rpc("create_order_agreement", {
    p_conversation_id: input.conversationId,
    p_gig_id: input.gigId,
    p_package_tier: input.packageTier,
    p_terms: input.terms ?? undefined,
  });
  if (error) throw error;
  return data as Order;
}

export async function acceptOrderAgreement(orderId: string) {
  const { data, error } = await getSupabase().rpc("accept_order_agreement", {
    p_order_id: orderId,
  });
  if (error) throw error;
  return data as Order;
}

export async function markOrderDelivered(orderId: string, note?: string) {
  const { data, error } = await getSupabase().rpc("mark_order_delivered", {
    p_order_id: orderId,
    p_note: note ?? undefined,
  });
  if (error) throw error;
  return data as Order;
}

export async function acceptOrderDelivery(orderId: string) {
  const { data, error } = await getSupabase().rpc("accept_order_delivery", {
    p_order_id: orderId,
  });
  if (error) throw error;
  return data as Order;
}

export async function requestOrderRevision(orderId: string, note?: string) {
  const { data, error } = await getSupabase().rpc("request_order_revision", {
    p_order_id: orderId,
    p_note: note ?? undefined,
  });
  if (error) throw error;
  return data as Order;
}

export async function resumeOrderWork(orderId: string) {
  const { data, error } = await getSupabase().rpc("resume_order_work", {
    p_order_id: orderId,
  });
  if (error) throw error;
  return data as Order;
}

export async function cancelOrder(orderId: string, reason?: string) {
  const { data, error } = await getSupabase().rpc("cancel_order", {
    p_order_id: orderId,
    p_reason: reason ?? undefined,
  });
  if (error) throw error;
  return data as Order;
}

export async function submitOrderReview(input: {
  orderId: string;
  role: "buyer" | "seller";
  overall?: number;
  communication: number;
  quality?: number;
  professionalism?: number;
  delivery?: number;
  requirementsQuality?: number;
  wouldRecommend?: boolean;
  comment?: string;
}) {
  const { data, error } = await getSupabase().rpc("submit_order_review", {
    p_order_id: input.orderId,
    p_overall: input.role === "buyer" ? input.overall ?? undefined : undefined,
    p_communication: input.communication,
    p_quality: input.role === "buyer" ? input.quality ?? undefined : undefined,
    p_professionalism: input.professionalism ?? undefined,
    p_delivery: input.role === "buyer" ? input.delivery ?? undefined : undefined,
    p_requirements_quality: input.role === "seller" ? input.requirementsQuality ?? undefined : undefined,
    p_would_recommend: input.role === "buyer" ? input.wouldRecommend ?? undefined : undefined,
    p_comment: input.comment ?? undefined,
  });
  if (error) throw error;
  return data as Review;
}

export async function fetchMyReviewForOrder(orderId: string, userId: string) {
  const { data, error } = await getSupabase()
    .from("reviews")
    .select("*")
    .eq("order_id", orderId)
    .eq("reviewer_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function uploadVerificationDocument(userId: string, localUri: string) {
  const path = `${userId}/${Date.now()}.jpg`;
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();
  const { error } = await getSupabase()
    .storage
    .from("verification")
    .upload(path, arrayBuffer, { contentType: "image/jpeg", upsert: false });
  if (error) throw error;
  return path;
}

export async function submitVerification(documentPath: string) {
  const { data, error } = await getSupabase().rpc("submit_verification", {
    p_document_url: documentPath,
  });
  if (error) throw error;
  return data as string;
}

export async function fetchVerificationStatus(businessId: string) {
  const { data, error } = await getSupabase()
    .from("verification_submissions")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function formatOrderSummary(meta: OrderCardMetadata) {
  return `${meta.gigTitle} · ${meta.packageTier} · ${formatPrice(meta.priceCents, meta.currency)}`;
}
