import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@nexio/shared";
import { Button, Text, TextField } from "../../src/shared/components";
import { signInWithEmail, signInWithGoogle } from "../../src/features/auth/api/authApi";
import { useAuthStore } from "../../src/features/auth/store/authStore";
import { colors, spacing } from "../../src/shared/theme";

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      const { session } = await signInWithEmail(values);
      if (session) setSession(session);
      router.replace("/");
    } catch (error) {
      Alert.alert("Login failed", error instanceof Error ? error.message : "Try again");
    } finally {
      setLoading(false);
    }
  });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="largeTitle">Welcome back</Text>
        <Text variant="body" muted>Sign in to continue to Nexio</Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Password"
                secureTextEntry
                autoComplete="password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />
          <Button label="Log in" loading={loading} onPress={onSubmit} />
        </View>

        <Button
          label="Continue with Google"
          variant="secondary"
          loading={googleLoading}
          onPress={() => {
            setGoogleLoading(true);
            signInWithGoogle()
              .then((session) => {
                setSession(session);
                router.replace("/");
              })
              .catch((e) => Alert.alert("Google sign-in", e.message))
              .finally(() => setGoogleLoading(false));
          }}
        />

        <Button label="Create account" variant="ghost" onPress={() => router.replace("/(auth)/signup")} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background.primary },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
