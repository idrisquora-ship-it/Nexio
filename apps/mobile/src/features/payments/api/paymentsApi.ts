import { getSupabase } from "../../../shared/lib/supabase";
import type { Database } from "@nexio/supabase";

export type PaymentShellConfig = {
  payments_enabled: boolean;
  platform_fee_percent: number;
  payout_delay_days: number;
  stripe_mode: string;
};

export type PaymentStatus = Database["public"]["Enums"]["payment_status"];

export async function fetchPaymentShellConfig(): Promise<PaymentShellConfig> {
  const { data, error } = await getSupabase().rpc("get_payment_shell_config");
  if (error) throw error;
  const raw = data as Record<string, unknown>;
  return {
    payments_enabled: Boolean(raw.payments_enabled),
    platform_fee_percent: Number(raw.platform_fee_percent ?? 10),
    payout_delay_days: Number(raw.payout_delay_days ?? 7),
    stripe_mode: String(raw.stripe_mode ?? "placeholder").replace(/"/g, ""),
  };
}

export async function fetchSellerPayoutAccount(businessId: string) {
  const { data, error } = await getSupabase()
    .from("seller_payout_accounts")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function requestPaymentIntent(orderId: string) {
  const { data: session } = await getSupabase().auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error("Sign in required");

  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderId }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message ?? body.error ?? "Payment unavailable");
  }
  return body;
}

export function paymentStatusLabel(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    not_required: "No payment required",
    pending: "Payment pending",
    held: "Funds in escrow",
    released: "Paid to seller",
    refunded: "Refunded",
    failed: "Payment failed",
  };
  return labels[status] ?? status;
}
