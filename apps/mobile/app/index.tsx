import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { needsOnboarding, useAuthStore } from "../src/features/auth/store/authStore";
import { colors } from "../src/shared/theme";

export default function Index() {
  const { session, profile, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background.primary }}>
        <ActivityIndicator color={colors.brand.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (needsOnboarding(profile)) {
    return <Redirect href="/(auth)/username" />;
  }

  return <Redirect href="/(tabs)/chats" />;
}
