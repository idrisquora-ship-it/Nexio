import { Redirect, Stack, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { needsOnboarding, useAuthStore } from "../../src/features/auth/store/authStore";
import { colors } from "../../src/shared/theme";

export default function AuthLayout() {
  const { session, profile, isLoading } = useAuthStore();
  const segments = useSegments();
  const onOnboardingScreen = segments.includes("username");

  if (isLoading) {
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

  if (session && !onOnboardingScreen) {
    if (needsOnboarding(profile)) {
      return <Redirect href="/(auth)/username" />;
    }
    return <Redirect href="/(tabs)/chats" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
