import { getSupabase } from "../../../shared/lib/supabase";
import type { Database } from "@nexio/supabase";

export type PrivacySettings = Database["public"]["Tables"]["privacy_settings"]["Row"];

export async function fetchPrivacySettings(userId: string) {
  const { data, error } = await getSupabase()
    .from("privacy_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updatePrivacySettings(
  userId: string,
  patch: Partial<
    Pick<
      PrivacySettings,
      "show_online" | "show_last_seen" | "show_typing" | "show_read_receipts" | "phone_discoverable"
    >
  >,
) {
  const { data, error } = await getSupabase()
    .from("privacy_settings")
    .update(patch)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
