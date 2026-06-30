import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { createCommunity } from "../../src/features/updates/api/updatesApi";
import { Button, ScreenHeader, TextField } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export default function CreateCommunityScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const onNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === slugify(name)) setSlug(slugify(value));
  };

  const submit = async () => {
    if (!name.trim() || !slug.trim()) {
      Alert.alert("Community", "Name and slug are required.");
      return;
    }
    setSaving(true);
    try {
      const id = await createCommunity(name.trim(), slug.trim(), description.trim() || undefined);
      router.replace(`/community/${id}`);
    } catch (e) {
      Alert.alert("Create failed", e instanceof Error ? e.message : "Could not create community.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Create community" />
      <View style={styles.form}>
        <TextField label="Name" value={name} onChangeText={onNameChange} />
        <TextField label="Slug" value={slug} onChangeText={setSlug} autoCapitalize="none" />
        <TextField
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Button label="Create" onPress={submit} loading={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  form: { padding: spacing.md, gap: spacing.md },
});
