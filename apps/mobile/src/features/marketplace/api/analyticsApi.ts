import { getSupabase } from "../../../shared/lib/supabase";

export type SellerAnalytics = {
  completed_orders: number;
  active_gigs: number;
  gig_limit: number;
  average_rating: number;
  repeat_buyers: number;
  favorites_count: number;
  profile_views: number;
  gig_views: number;
  seller_level: number;
  seller_level_name: string;
  is_verified: boolean;
  is_vacation_mode: boolean;
};

export async function fetchSellerAnalytics(businessId: string): Promise<SellerAnalytics> {
  const { data, error } = await getSupabase().rpc("get_seller_analytics", {
    p_business_id: businessId,
  });
  if (error) throw error;
  return data as SellerAnalytics;
}

export async function toggleVacationMode(enabled: boolean) {
  const { data, error } = await getSupabase().rpc("toggle_vacation_mode", {
    p_enabled: enabled,
  });
  if (error) throw error;
  return data;
}

export async function fetchSellerLevelDefinitions() {
  const { data, error } = await getSupabase()
    .from("seller_level_definitions")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listPendingVerifications() {
  const { data, error } = await getSupabase().rpc("list_pending_verifications");
  if (error) throw error;
  return data ?? [];
}

export async function processVerificationSubmission(
  submissionId: string,
  approve: boolean,
  adminNote?: string,
) {
  const { data, error } = await getSupabase().rpc("process_verification_submission", {
    p_submission_id: submissionId,
    p_approve: approve,
    p_admin_note: adminNote ?? undefined,
  });
  if (error) throw error;
  return data;
}

export async function runEvaluateSellerLevels() {
  const { data, error } = await getSupabase().rpc("evaluate_seller_levels");
  if (error) throw error;
  return data as number;
}

export type AnalyticsSeriesPoint = {
  label: string;
  orders: number;
  revenue_cents: number;
};

export async function fetchSellerAnalyticsSeries(
  businessId: string,
  period: "daily" | "weekly" | "monthly" | "yearly" = "weekly",
) {
  const { data, error } = await getSupabase().rpc("get_seller_analytics_series", {
    p_business_id: businessId,
    p_period: period,
  });
  if (error) throw error;
  return (data ?? []) as AnalyticsSeriesPoint[];
}
