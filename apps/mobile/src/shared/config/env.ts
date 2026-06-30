import Constants from "expo-constants";

function requireEnv(name: string): string {
  const value = process.env[name] ?? Constants.expoConfig?.extra?.[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabaseUrl: requireEnv("EXPO_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: requireEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
};
