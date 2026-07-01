import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { MessageCircle, Store, Radio, Phone, User } from "lucide-react-native";
import { needsOnboarding, useAuthStore } from "../../src/features/auth/store/authStore";
import { colors } from "../../src/shared/theme";

export default function TabsLayout() {
  const { session, profile, isLoading } = useAuthStore();

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

  if (!session || needsOnboarding(profile)) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      initialRouteName="chats"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.border.subtle,
        },
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.secondary,
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: "Marketplace",
          tabBarIcon: ({ color, size }) => <Store color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="updates"
        options={{
          title: "Updates",
          tabBarIcon: ({ color, size }) => <Radio color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: "Calls",
          tabBarIcon: ({ color, size }) => <Phone color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
