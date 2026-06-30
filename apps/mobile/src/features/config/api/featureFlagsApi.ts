import { getSupabase } from "../../../shared/lib/supabase";

export type FeatureFlags = Record<string, boolean>;

export async function fetchFeatureFlags(): Promise<FeatureFlags> {
  const { data, error } = await getSupabase().rpc("get_feature_flags");
  if (error) throw error;
  return (data ?? {}) as FeatureFlags;
}

export function isFeatureEnabled(flags: FeatureFlags | null, key: string, defaultValue = false) {
  if (!flags) return defaultValue;
  return flags[key] ?? defaultValue;
}
