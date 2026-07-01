import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "../../../shared/lib/supabase";
import { parseAuthRedirectParams } from "../lib/parseAuthRedirect";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle(): Promise<Session> {
  const redirectTo = makeRedirectUri({ scheme: "nexio", path: "auth/callback" });
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error("Missing Google OAuth URL");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") {
    throw new Error("Google sign-in was cancelled");
  }

  const params = parseAuthRedirectParams(result.url);

  if (params.code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
    if (exchangeError) throw exchangeError;
  } else if (params.access_token && params.refresh_token) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (sessionError) throw sessionError;
  } else {
    throw new Error("Could not complete Google sign-in");
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session) throw new Error("Could not complete Google sign-in");
  return session;
}
