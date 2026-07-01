import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSetupSchema, type ProfileSetupInput } from "@nexio/shared";
import { Button, Text, TextField } from "../../src/shared/components";
import { completeProfileSetup } from "../../src/features/auth/api/authApi";
import { needsOnboarding, useAuthStore } from "../../src/features/auth/store/authStore";
import { formatErrorMessage } from "../../src/shared/lib/formatErrorMessage";
import { colors, spacing } from "../../src/shared/theme";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { session, profile, setProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      username: profile?.username?.startsWith("user_") ? "" : profile?.username ?? "",
      displayName: profile?.display_name ?? "",
    },
  });

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (profile && !needsOnboarding(profile)) {
    return <Redirect href="/" />;
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!session.user) return;
    setLoading(true);
    try {
      const updated = await completeProfileSetup(session.user.id, values);
      setProfile(updated);
      router.replace("/");
    } catch (error) {
      Alert.alert("Could not save profile", formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="largeTitle">Choose your @username</Text>
        <Text variant="body" muted>
          Your username is your primary identity on Nexio. Phone number is optional and can be added later in Settings.
        </Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Username"
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={(text) => onChange(text.toLowerCase())}
                value={value}
                error={errors.username?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="displayName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="Display name" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.displayName?.message} />
            )}
          />
          <Button label="Continue" loading={loading} onPress={onSubmit} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background.primary },
  container: { flexGrow: 1, padding: spacing.lg, gap: spacing.md },
  form: { gap: spacing.md, marginTop: spacing.md },
});
