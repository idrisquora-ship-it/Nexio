import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { getSupabase } from "../../src/shared/lib/supabase";
import { parseAuthRedirectParams } from "../../src/features/auth/lib/parseAuthRedirect";
import { colors } from "../../src/shared/theme";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    const supabase = getSupabase();

    const finish = async (destination: "/" | "/(auth)/login") => {
      if (handled.current) return;
      handled.current = true;
      router.replace(destination);
    };

    const handleUrl = async (url: string) => {
      const params = parseAuthRedirectParams(url);

      if (params.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(params.code);
        if (error) {
          await finish("/(auth)/login");
          return;
        }
      } else if (params.access_token && params.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (error) {
          await finish("/(auth)/login");
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      await finish(session ? "/" : "/(auth)/login");
    };

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await finish("/");
        return;
      }

      const initialUrl = await Linking.getInitialURL();
      if (initialUrl?.includes("auth/callback")) {
        await handleUrl(initialUrl);
        return;
      }

      setTimeout(async () => {
        const { data: { session: latest } } = await supabase.auth.getSession();
        await finish(latest ? "/" : "/(auth)/login");
      }, 1500);
    };

    bootstrap().catch(() => finish("/(auth)/login"));

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "SIGNED_IN") {
        finish("/").catch(() => undefined);
      }
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (url.includes("auth/callback")) {
        handleUrl(url).catch(() => finish("/(auth)/login"));
      }
    });

    return () => {
      authSubscription.unsubscribe();
      subscription.remove();
    };
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background.primary,
      }}
    >
      <ActivityIndicator color={colors.brand.primary} />
    </View>
  );
}
