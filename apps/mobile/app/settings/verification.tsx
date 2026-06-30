import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { fetchMyBusiness } from "../../src/features/marketplace/api/marketplaceApi";
import {
  fetchVerificationStatus,
  submitVerification,
  uploadVerificationDocument,
} from "../../src/features/orders/api/ordersApi";
import { useAuthStore } from "../../src/features/auth/store/authStore";
import { Button, EmptyState, ScreenHeader, Text } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

export default function VerificationScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchMyBusiness(user.id)
      .then((biz) => (biz ? fetchVerificationStatus(biz.id) : null))
      .then((sub) => setStatus(sub?.status ?? null))
      .catch(() => setStatus(null));
  }, [user]);

  const submit = async () => {
    if (!user) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photos", "Allow photo access to upload ID.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;

    setLoading(true);
    try {
      const path = await uploadVerificationDocument(user.id, result.assets[0].uri);
      await submitVerification(path);
      setStatus("pending");
      Alert.alert("Submitted", "We'll review your verification soon.");
    } catch (e) {
      Alert.alert("Verification", e instanceof Error ? e.message : "Try again");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Verification" />
        <EmptyState title="Sign in required" message="" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Get verified"
        subtitle="Build trust with a verified seller badge"
      />
      <View style={styles.body}>
        {status === "pending" ? (
          <Text variant="body">Your submission is under review.</Text>
        ) : status === "approved" ? (
          <Text variant="body" color="brand">
            You're verified!
          </Text>
        ) : status === "rejected" ? (
          <Text variant="body" muted>
            Previous submission was rejected. You may submit again.
          </Text>
        ) : (
          <Text variant="body" muted>
            Upload a government ID or business document. Only admins can view this file.
          </Text>
        )}
        {status !== "pending" && status !== "approved" ? (
          <Button label="Upload document" loading={loading} onPress={submit} />
        ) : null}
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { paddingBottom: spacing.xxl },
  body: { padding: spacing.md, gap: spacing.md },
});
