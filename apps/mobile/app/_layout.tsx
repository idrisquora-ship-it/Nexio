import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";
import { registerGlobals } from "@livekit/react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProviders } from "../src/providers/AppProviders";
import { AuthProvider } from "../src/providers/AuthProvider";
import { CallProvider } from "../src/providers/CallProvider";
import { FeatureFlagsProvider } from "../src/providers/FeatureFlagsProvider";
import { OfflineSyncProvider, useOfflineSync } from "../src/providers/OfflineSyncProvider";
import { OfflineBanner, SyncStatusIndicator } from "../src/shared/components";
import { ReportSheet } from "../src/features/moderation/components/ReportSheet";
import { initSentry } from "../src/shared/lib/sentry";
import { colors } from "../src/shared/theme";

registerGlobals();
initSentry();

function AppShell({ children }: { children: React.ReactNode }) {
  const { isOnline, syncing, pendingCount } = useOfflineSync();

  return (
    <View style={styles.shell}>
      <OfflineBanner visible={!isOnline} pendingCount={pendingCount} />
      <SyncStatusIndicator syncing={syncing} pendingCount={pendingCount} />
      {children}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <SafeAreaProvider>
        <AppProviders>
          <FeatureFlagsProvider>
            <AuthProvider>
              <CallProvider>
                <OfflineSyncProvider>
                  <AppShell>
                    <StatusBar style="light" />
                    <ReportSheet />
                    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background.primary } }} />
                  </AppShell>
                </OfflineSyncProvider>
              </CallProvider>
            </AuthProvider>
          </FeatureFlagsProvider>
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
});
