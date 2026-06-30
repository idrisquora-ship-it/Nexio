import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { getSupabase } from "../../src/shared/lib/supabase";
import { useAuthStore } from "../../src/features/auth/store/authStore";
import { Button, ScreenHeader, Text, TextField, Card } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

export default function PhoneSettingsScreen() {
  const { user } = useAuthStore();
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      Alert.alert("Phone", "Enter a phone number with country code, e.g. +15551234567");
      return;
    }
    setLoading(true);
    try {
      const { error } = await getSupabase().auth.updateUser({ phone: trimmed });
      if (error) throw error;
      Alert.alert(
        "Verify your number",
        "Supabase sent an OTP to your phone. Complete verification when SMS auth is enabled in your project.",
      );
    } catch (e) {
      Alert.alert("Phone", e instanceof Error ? e.message : "Could not update phone.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Phone" subtitle="Optional — add for account recovery" />
      <Card style={styles.card}>
        <Text variant="body" muted>
          Phone is optional on Nexio. Adding a number can help with recovery and lets others find you if you enable
          discoverability in Privacy settings.
        </Text>
      </Card>
      <TextField
        label="Phone number"
        value={phone}
        onChangeText={setPhone}
        placeholder="+1 555 123 4567"
        keyboardType="phone-pad"
        autoComplete="tel"
      />
      <Button label="Save phone" loading={loading} onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { gap: spacing.sm },
});
