import { getSupabase } from "../../../shared/lib/supabase";
import type { Database } from "@nexio/supabase";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function updateProfile(
  userId: string,
  input: { displayName?: string; bio?: string; avatarUrl?: string | null },
) {
  const patch: Database["public"]["Tables"]["profiles"]["Update"] = {
    updated_at: new Date().toISOString(),
  };
  if (input.displayName !== undefined) patch.display_name = input.displayName.trim();
  if (input.bio !== undefined) patch.bio = input.bio.trim() || null;
  if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;

  const { data, error } = await getSupabase()
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function uploadAvatar(userId: string, localUri: string) {
  const path = `${userId}/${Date.now()}.jpg`;
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await getSupabase()
    .storage
    .from("avatars")
    .upload(path, arrayBuffer, { contentType: "image/jpeg", upsert: true });

  if (uploadError) throw uploadError;

  const { data } = getSupabase().storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchPublicProfile(userId: string) {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, is_business, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
