import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  createPortfolioItem,
  deletePortfolioItem,
  fetchMyBusiness,
  fetchPortfolio,
  uploadPortfolioImage,
} from "../../src/features/marketplace/api/marketplaceApi";
import { PortfolioGrid } from "../../src/features/marketplace/components/PortfolioGrid";
import { useAuthStore } from "../../src/features/auth/store/authStore";
import { Button, EmptyState, ScreenHeader, TextField } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";
import type { PortfolioItem } from "../../src/features/marketplace/api/marketplaceApi";

export default function PortfolioManagerScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const business = await fetchMyBusiness(user.id);
    if (!business) {
      router.replace("/settings/become-business");
      return;
    }
    setBusinessId(business.id);
    const rows = await fetchPortfolio(business.id);
    setItems(rows);
  }, [user, router]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const addItem = async () => {
    if (!user || !businessId || !title.trim()) {
      Alert.alert("Portfolio", "Enter a title.");
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photos", "Allow photo access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;

    setLoading(true);
    try {
      const itemId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
      const mediaUrl = await uploadPortfolioImage(user.id, itemId, result.assets[0].uri);
      const item = await createPortfolioItem({
        businessId,
        title: title.trim(),
        description: description.trim() || undefined,
        mediaUrl,
        sortOrder: items.length,
      });
      setItems((prev) => [...prev, item]);
      setTitle("");
      setDescription("");
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (item: PortfolioItem) => {
    Alert.alert("Delete item", `Remove "${item.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deletePortfolioItem(item.id);
          setItems((prev) => prev.filter((i) => i.id !== item.id));
        },
      },
    ]);
  };

  if (!businessId) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Portfolio" />
        <EmptyState title="Loading…" message="" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Portfolio" subtitle="Showcase your best work" />
      <View style={styles.form}>
        <TextField label="Title" value={title} onChangeText={setTitle} />
        <TextField label="Description (optional)" value={description} onChangeText={setDescription} multiline />
        <Button label="Add portfolio item" loading={loading} onPress={addItem} />
      </View>
      <PortfolioGrid items={items} onPress={removeItem} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { paddingBottom: spacing.xxl },
  form: { padding: spacing.md, gap: spacing.md },
});
