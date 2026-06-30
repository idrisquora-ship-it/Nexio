import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { getSupabase } from "../../../shared/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

function parseParamsFromUrl(url: string) {
  const parsed = new URL(url);
  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const queryParams = parsed.searchParams;
  return {
    access_token: hashParams.get("access_token") ?? queryParams.get("access_token"),
    refresh_token: hashParams.get("refresh_token") ?? queryParams.get("refresh_token"),
    code: queryParams.get("code"),
  };
}

export async function signInWithGoogle() {
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

  const params = parseParamsFromUrl(result.url);

  if (params.code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
    if (exchangeError) throw exchangeError;
    return;
  }

  if (params.access_token && params.refresh_token) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (sessionError) throw sessionError;
    return;
  }

  throw new Error("Could not complete Google sign-in");
}
