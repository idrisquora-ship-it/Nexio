import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { becomeBusiness } from "../../src/features/marketplace/api/marketplaceApi";
import { useAuthStore } from "../../src/features/auth/store/authStore";
import { fetchProfile } from "../../src/features/auth/api/authApi";
import { Button, ScreenHeader, Text, TextField } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

export default function BecomeBusinessScreen() {
  const router = useRouter();
  const { user, setProfile } = useAuthStore();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user || !name.trim() || !slug.trim()) {
      Alert.alert("Business", "Enter a business name and URL slug.");
      return;
    }
    setLoading(true);
    try {
      await becomeBusiness(name.trim(), slug.trim(), category.trim() || undefined);
      const profile = await fetchProfile(user.id);
      setProfile(profile);
      router.replace("/marketplace/create");
    } catch (e) {
      Alert.alert("Could not upgrade", e instanceof Error ? e.message : "Try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Become a seller" subtitle="Keep your personal profile — add a business identity" />
      <View style={styles.form}>
        <TextField label="Business name" value={name} onChangeText={setName} />
        <TextField
          label="Public URL slug"
          value={slug}
          onChangeText={(v: string) => setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          autoCapitalize="none"
          placeholder="my-studio"
        />
        <TextField label="Category (optional)" value={category} onChangeText={setCategory} />
        <Text variant="footnote" muted>
          Payments are planned for a later phase. You can publish gigs and receive inquiries in chat now.
        </Text>
        <Button label="Create business profile" loading={loading} onPress={submit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  form: { padding: spacing.md, gap: spacing.md },
});
