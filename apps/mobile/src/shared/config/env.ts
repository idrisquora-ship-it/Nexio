import Constants from "expo-constants";

type Extra = Record<string, string | undefined>;

function fromExtra(key: string): string | undefined {
  const extra = Constants.expoConfig?.extra as Extra | undefined;
  return extra?.[key];
}

function required(label: string, ...candidates: (string | undefined)[]): string {
  const value = candidates.find((v) => typeof v === "string" && v.length > 0);
  if (!value) {
    throw new Error(`Missing required environment variable: ${label}`);
  }
  return value;
}

/** Static process.env access is required — dynamic process.env[key] is not inlined in release builds. */
export const env = {
  supabaseUrl: required(
    "EXPO_PUBLIC_SUPABASE_URL",
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    fromExtra("EXPO_PUBLIC_SUPABASE_URL"),
  ),
  supabaseAnonKey: required(
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    fromExtra("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  ),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? fromExtra("EXPO_PUBLIC_SENTRY_DSN"),
  livekitUrl: process.env.EXPO_PUBLIC_LIVEKIT_URL ?? fromExtra("EXPO_PUBLIC_LIVEKIT_URL"),
  giphyApiKey: process.env.EXPO_PUBLIC_GIPHY_API_KEY ?? fromExtra("EXPO_PUBLIC_GIPHY_API_KEY"),
  privacyUrl:
    process.env.EXPO_PUBLIC_PRIVACY_URL ??
    fromExtra("EXPO_PUBLIC_PRIVACY_URL") ??
    "https://nexio.app/privacy",
  termsUrl:
    process.env.EXPO_PUBLIC_TERMS_URL ??
    fromExtra("EXPO_PUBLIC_TERMS_URL") ??
    "https://nexio.app/terms",
};
