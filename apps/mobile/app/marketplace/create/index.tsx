import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { createGigDraft, fetchMyBusiness, fetchMyGigs } from "../../../src/features/marketplace/api/marketplaceApi";
import { SellerDashboardCard } from "../../../src/features/marketplace/components/SellerDashboardCard";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { Button, EmptyState, ScreenHeader, Text } from "../../../src/shared/components";
import { colors, spacing } from "../../../src/shared/theme";
import type { Gig } from "../../../src/features/marketplace/api/marketplaceApi";

export default function CreateGigIndexScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [drafts, setDrafts] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchMyBusiness(user.id)
      .then((biz) => (biz ? fetchMyGigs(biz.id) : []))
      .then((gigs) => setDrafts(gigs.filter((g) => g.status === "draft")))
      .catch(() => setDrafts([]))
      .finally(() => setLoading(false));
  }, [user]);

  const startNew = async () => {
    if (!user) return;
    const business = await fetchMyBusiness(user.id);
    if (!business) {
      router.push("/settings/become-business");
      return;
    }
    try {
      const gig = await createGigDraft({
        businessId: business.id,
        title: "Untitled gig",
        category: "Design",
        subCategory: "General",
        shortDescription: "",
      });
      router.push(`/marketplace/create/${gig.id}`);
    } catch (e) {
      Alert.alert("Could not start", e instanceof Error ? e.message : "Try again");
    }
  };

  if (!profile?.is_business) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Create gig" />
        <EmptyState
          title="Seller account required"
          message="Upgrade to a business profile to publish gigs."
          actionLabel="Become a seller"
          onAction={() => router.push("/settings/become-business")}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Create gig" subtitle="Start new or continue a draft" />
      <View style={styles.form}>
        <Button label="Start new gig" onPress={startNew} />

        {!loading && drafts.length > 0 ? (
          <>
            <Text variant="headline" style={styles.section}>
              Your drafts
            </Text>
            {drafts.map((gig) => (
              <SellerDashboardCard
                key={gig.id}
                gig={gig}
                onPress={() => router.push(`/marketplace/gig/${gig.id}`)}
                onEdit={() => router.push(`/marketplace/create/${gig.id}`)}
              />
            ))}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { paddingBottom: spacing.xxl },
  form: { padding: spacing.md, gap: spacing.md },
  section: { marginTop: spacing.md },
});
