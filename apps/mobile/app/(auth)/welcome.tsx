import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Button, Text } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text variant="largeTitle">Nexio</Text>
        <Text variant="body" muted style={styles.tagline}>
          Messaging-first social commerce. Connect, chat, and discover.
        </Text>
      </View>
      <View style={styles.actions}>
        <Button label="Create account" onPress={() => router.push("/(auth)/signup")} />
        <Button label="Log in" variant="secondary" onPress={() => router.push("/(auth)/login")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
    justifyContent: "space-between",
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.sm,
  },
  tagline: {
    maxWidth: 320,
  },
  actions: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
});
