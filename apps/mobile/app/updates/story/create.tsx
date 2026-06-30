import { useState } from "react";
import { Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import {
  createStory,
  uploadStoryMedia,
} from "../../../src/features/updates/api/updatesApi";
import { enqueueStory } from "../../../src/shared/lib/storyQueue";
import { useOfflineSync } from "../../../src/providers/OfflineSyncProvider";
import { Button, ScreenHeader, Text } from "../../../src/shared/components";
import { colors, spacing } from "../../../src/shared/theme";

const TEXT_BACKGROUNDS = ["#6C5CE7", "#00B894", "#E17055", "#0984E3", "#2D3436"];

export default function CreateStoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { refreshPending } = useOfflineSync();
  const [mode, setMode] = useState<"text" | "photo">("photo");
  const [text, setText] = useState("");
  const [bg, setBg] = useState(TEXT_BACKGROUNDS[0]);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to post a story.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (!result.canceled && result.assets[0]) {
      setLocalUri(result.assets[0].uri);
      setMode("photo");
    }
  };

  const publish = async () => {
    if (!user) return;
    setPosting(true);
    try {
      if (mode === "text") {
        if (!text.trim()) {
          Alert.alert("Story", "Enter text for your story.");
          return;
        }
        await createStory({
          storyType: "text",
          textContent: text.trim(),
          backgroundColor: bg,
        });
      } else {
        if (!localUri) {
          Alert.alert("Story", "Pick a photo first.");
          return;
        }
        const tempId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
        const path = await uploadStoryMedia(user.id, tempId, localUri, false);
        await createStory({ storyType: "photo", mediaPath: path });
      }
      router.back();
    } catch (e) {
      if (!user) return;
      try {
        if (mode === "text") {
          await enqueueStory({
            userId: user.id,
            storyType: "text",
            textContent: text.trim(),
            backgroundColor: bg,
          });
        } else if (localUri) {
          await enqueueStory({
            userId: user.id,
            storyType: "photo",
            localUri,
          });
        }
        await refreshPending();
        Alert.alert("Queued", "Story will post when you're back online.");
        router.back();
        return;
      } catch {
        Alert.alert("Story failed", e instanceof Error ? e.message : "Could not post story.");
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="New story" />
      <View style={styles.modes}>
        <Pressable onPress={() => setMode("photo")}>
          <Text variant="subheadline" color={mode === "photo" ? "brand" : "secondary"}>
            Photo
          </Text>
        </Pressable>
        <Pressable onPress={() => setMode("text")}>
          <Text variant="subheadline" color={mode === "text" ? "brand" : "secondary"}>
            Text
          </Text>
        </Pressable>
      </View>

      {mode === "photo" ? (
        <View style={styles.section}>
          <Button label={localUri ? "Change photo" : "Pick photo"} onPress={pickPhoto} />
          {localUri ? (
            <Text variant="footnote" muted>
              Photo selected
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.section}>
          <TextInput
            style={[styles.textInput, { backgroundColor: bg }]}
            placeholder="What's happening?"
            placeholderTextColor="rgba(255,255,255,0.7)"
            multiline
            value={text}
            onChangeText={setText}
          />
          <View style={styles.swatches}>
            {TEXT_BACKGROUNDS.map((color) => (
              <Pressable
                key={color}
                style={[styles.swatch, { backgroundColor: color }, bg === color && styles.swatchActive]}
                onPress={() => setBg(color)}
              />
            ))}
          </View>
        </View>
      )}

      <Button label="Post story" onPress={publish} loading={posting} style={styles.post} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  modes: { flexDirection: "row", gap: spacing.lg, padding: spacing.md },
  section: { padding: spacing.md, gap: spacing.md },
  textInput: {
    minHeight: 180,
    borderRadius: 12,
    padding: spacing.md,
    color: "#fff",
    textAlignVertical: "top",
  },
  swatches: { flexDirection: "row", gap: spacing.sm },
  swatch: { width: 32, height: 32, borderRadius: 16 },
  swatchActive: { borderWidth: 2, borderColor: colors.text.primary },
  post: { margin: spacing.md },
});
