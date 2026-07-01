import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@nexio/shared";
import { Button, Text, TextField } from "../../src/shared/components";
import { signInWithGoogle, signUpWithEmail } from "../../src/features/auth/api/authApi";
import { useAuthStore } from "../../src/features/auth/store/authStore";
import { colors, spacing } from "../../src/shared/theme";

export default function SignupScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      const { session } = await signUpWithEmail(values);
      if (!session) {
        Alert.alert("Check your email", "Confirm your email address to finish signing up.");
        return;
      }
      setSession(session);
      router.replace("/");
    } catch (error) {
      Alert.alert("Signup failed", error instanceof Error ? error.message : "Try again");
    } finally {
      setLoading(false);
    }
  });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="largeTitle">Create account</Text>
        <Text variant="body" muted>Choose a username after signup. Phone is optional later.</Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="Email" autoCapitalize="none" keyboardType="email-address" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.email?.message} />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="Password" secureTextEntry onBlur={onBlur} onChangeText={onChange} value={value} error={errors.password?.message} />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="Confirm password" secureTextEntry onBlur={onBlur} onChangeText={onChange} value={value} error={errors.confirmPassword?.message} />
            )}
          />
          <Button label="Sign up" loading={loading} onPress={onSubmit} />
        </View>

        <View style={styles.oauth}>
          <Button
            label="Continue with Google"
            variant="secondary"
            onPress={() =>
              signInWithGoogle()
                .then((session) => {
                  setSession(session);
                  router.replace("/");
                })
                .catch((e) => Alert.alert("Google sign-in", e.message))
            }
          />
        </View>

        <Button label="Already have an account?" variant="ghost" onPress={() => router.replace("/(auth)/login")} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background.primary },
  container: { flexGrow: 1, padding: spacing.lg, gap: spacing.md },
  form: { gap: spacing.md, marginTop: spacing.md },
  oauth: { gap: spacing.sm },
});
