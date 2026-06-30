import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { fetchMyBusiness } from "../../../src/features/marketplace/api/marketplaceApi";
import { publishBusinessPost } from "../../../src/features/updates/api/updatesApi";
import { Button, ScreenHeader, Text, TextField } from "../../../src/shared/components";
import { colors, spacing } from "../../../src/shared/theme";

export default function CreateBusinessPostScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchMyBusiness(user.id).then((biz) => setBusinessId(biz?.id ?? null));
  }, [user]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (!result.canceled && result.assets[0]) setMediaUrl(result.assets[0].uri);
  };

  const publish = async () => {
    if (!businessId || !body.trim()) {
      Alert.alert("Post", "Business account and post text are required.");
      return;
    }
    setPosting(true);
    try {
      await publishBusinessPost(businessId, body.trim(), mediaUrl, mediaUrl ? "image" : null);
      router.back();
    } catch (e) {
      Alert.alert("Post failed", e instanceof Error ? e.message : "Could not publish.");
    } finally {
      setPosting(false);
    }
  };

  if (!businessId) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="New post" />
        <Text variant="body" muted style={styles.pad}>
          Become a business account to post updates.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="New business post" />
      <View style={styles.form}>
        <TextField label="Update" value={body} onChangeText={setBody} multiline />
        <Button label={mediaUrl ? "Change image" : "Add image (optional)"} onPress={pickImage} />
        <Button label="Publish" onPress={publish} loading={posting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  form: { padding: spacing.md, gap: spacing.md },
  pad: { padding: spacing.md },
});
