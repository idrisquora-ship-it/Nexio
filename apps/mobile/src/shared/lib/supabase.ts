import * as SecureStore from "expo-secure-store";
import { createSupabaseClient, NexioSupabaseClient } from "@nexio/supabase";
import { env } from "../config/env";

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

let client: NexioSupabaseClient | null = null;

export function getSupabase(): NexioSupabaseClient {
  if (!client) {
    client = createSupabaseClient(env.supabaseUrl, env.supabaseAnonKey, secureStoreAdapter);
  }
  return client;
}
