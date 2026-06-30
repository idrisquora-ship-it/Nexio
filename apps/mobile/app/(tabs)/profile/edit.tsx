import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Redirect } from "expo-router";
import { updateProfile, uploadAvatar } from "../../../src/features/auth/api/profileApi";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { Avatar, Button, ScreenHeader, Text, TextField } from "../../../src/shared/components";
import { colors, spacing } from "../../../src/shared/theme";

export default function EditProfileScreen() {
  const { session, profile, setProfile } = useAuthStore();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url ?? null);
  const [loading, setLoading] = useState(false);

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photos", "Allow photo access to change your avatar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const save = async () => {
    if (!session.user || !displayName.trim()) {
      Alert.alert("Profile", "Display name is required.");
      return;
    }
    setLoading(true);
    try {
      let avatarUrl = profile?.avatar_url ?? null;
      if (avatarUri && avatarUri !== profile?.avatar_url && !avatarUri.startsWith("http")) {
        avatarUrl = await uploadAvatar(session.user.id, avatarUri);
      } else if (avatarUri?.startsWith("http")) {
        avatarUrl = avatarUri;
      }
      const updated = await updateProfile(session.user.id, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl,
      });
      setProfile(updated);
      Alert.alert("Saved", "Your profile was updated.");
    } catch (e) {
      Alert.alert("Profile", e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Edit profile" />
        <Pressable onPress={pickAvatar} style={styles.avatarRow}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Avatar name={displayName} uri={profile?.avatar_url} size={72} />
          )}
          <Text variant="subheadline" color="brand">
            Change photo
          </Text>
        </Pressable>
        <TextField label="Display name" value={displayName} onChangeText={setDisplayName} />
        <TextField label="Bio" value={bio} onChangeText={setBio} multiline placeholder="Tell others about yourself" />
        <Text variant="footnote" muted>
          Username @{profile?.username} cannot be changed here.
        </Text>
        <Button label="Save changes" loading={loading} onPress={save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background.primary },
  container: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
});
