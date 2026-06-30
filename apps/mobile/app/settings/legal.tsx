import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { ScreenHeader, Text, Card, Button } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL ?? "https://nexio.app/privacy";
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL ?? "https://nexio.app/terms";

export default function LegalScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Legal" subtitle="Policies for Nexio v1.0" />
      <Card style={styles.card}>
        <Text variant="headline">Privacy policy</Text>
        <Text variant="body" muted>
          Describes how Nexio collects, uses, and protects your data.
        </Text>
        <Button label="Open privacy policy" variant="secondary" onPress={() => Linking.openURL(PRIVACY_URL)} />
      </Card>
      <Card style={styles.card}>
        <Text variant="headline">Terms of service</Text>
        <Text variant="body" muted>
          Rules for using Nexio messaging, marketplace, and community features.
        </Text>
        <Button label="Open terms" variant="secondary" onPress={() => Linking.openURL(TERMS_URL)} />
      </Card>
      <Text variant="footnote" muted>
        Set EXPO_PUBLIC_PRIVACY_URL and EXPO_PUBLIC_TERMS_URL before App Store submission.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { gap: spacing.sm },
});
