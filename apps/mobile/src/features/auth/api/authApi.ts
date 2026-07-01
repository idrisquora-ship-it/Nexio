import { getSupabase } from "../../../shared/lib/supabase";
import type { LoginInput, SignupInput } from "@nexio/shared";
import type { ProfileSetupInput } from "@nexio/shared";

export { signInWithGoogle } from "./googleAuth";

export async function signInWithEmail({ email, password }: LoginInput) {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail({ email, password }: SignupInput) {
  const { data, error } = await getSupabase().auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function isUsernameAvailable(username: string, excludeUserId?: string) {
  let query = getSupabase()
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase());

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return !data;
}

export async function completeProfileSetup(userId: string, input: ProfileSetupInput) {
  const username = input.username.toLowerCase();
  const available = await isUsernameAvailable(username, userId);
  if (!available) {
    throw new Error("Username is already taken");
  }

  const { data, error } = await getSupabase()
    .from("profiles")
    .update({
      username,
      display_name: input.displayName.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
