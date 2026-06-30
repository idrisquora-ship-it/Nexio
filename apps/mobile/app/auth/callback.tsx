import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { getSupabase } from "../../src/shared/lib/supabase";
import { colors } from "../../src/shared/theme";

export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = async (url: string) => {
      const supabase = getSupabase();
      const parsed = Linking.parse(url);
      const code = typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : null;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        router.replace("/");
        return;
      }

      router.replace("/(auth)/login");
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url).catch(() => router.replace("/(auth)/login"));
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url).catch(() => router.replace("/(auth)/login"));
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background.primary }}>
      <ActivityIndicator color={colors.brand.primary} />
    </View>
  );
}
