import { createClient, SupabaseClient, SupportedStorage } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type NexioSupabaseClient = SupabaseClient<Database>;

export function createSupabaseClient(
  url: string,
  anonKey: string,
  storage?: SupportedStorage,
): NexioSupabaseClient {
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage,
    },
  });
}

export type { Database };
