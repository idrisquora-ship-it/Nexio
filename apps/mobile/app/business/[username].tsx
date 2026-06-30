import { useEffect, useState } from "react";
import { Alert, ScrollView, Share, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  fetchBusinessBySlug,
  fetchBusinessGigs,
  fetchPortfolio,
} from "../../src/features/marketplace/api/marketplaceApi";
import { BusinessProfileHeader } from "../../src/features/marketplace/components/BusinessProfileHeader";
import { BusinessQrSheet } from "../../src/features/marketplace/components/BusinessQrSheet";
import { GigCard } from "../../src/features/marketplace/components/GigCard";
import { PortfolioGrid } from "../../src/features/marketplace/components/PortfolioGrid";
import { useAuthStore } from "../../src/features/auth/store/authStore";
import { useReportStore } from "../../src/features/moderation/store/reportStore";
import { EmptyState, ScreenHeader, Text } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";
import type { BusinessProfile, Gig, PortfolioItem } from "../../src/features/marketplace/api/marketplaceApi";

export default function BusinessProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const openReport = useReportStore((s) => s.open);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (!username) return;
    fetchBusinessBySlug(username)
      .then(async (biz) => {
        if (!biz) {
          setBusiness(null);
          return;
        }
        setBusiness(biz);
        const [gigRows, portfolioRows] = await Promise.all([
          fetchBusinessGigs(biz.id, biz.user_id === user?.id),
          fetchPortfolio(biz.id),
        ]);
        setGigs(gigRows);
        setPortfolio(portfolioRows);
      })
      .catch(() => setBusiness(null));
  }, [username, user?.id]);

  const shareProfile = async () => {
    if (!business) return;
    try {
      await Share.share({
        message: `Check out ${business.business_name} on Nexio — @${business.slug}`,
      });
    } catch {
      Alert.alert("Share", "Could not share profile.");
    }
  };

  if (!business) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Business" />
        <EmptyState title="Not found" message="This business profile does not exist." />
      </View>
    );
  }

  const isOwner = user?.id === business.user_id;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ScreenHeader title={business.business_name} />
        <BusinessProfileHeader
          business={business}
          isOwner={isOwner}
          onShare={shareProfile}
          onQr={() => setShowQr(true)}
          onEditPortfolio={isOwner ? () => router.push("/marketplace/portfolio") : undefined}
          onReport={
            !isOwner
              ? () =>
                  openReport({
                    type: "business",
                    id: business.id,
                    label: business.business_name,
                  })
              : undefined
          }
        />

        <Text variant="headline" style={styles.section}>
          Gigs
        </Text>
        {gigs.length === 0 ? (
          <Text variant="body" muted style={styles.empty}>
            No published gigs yet.
          </Text>
        ) : (
          gigs.map((gig) => (
            <GigCard
              key={gig.id}
              gig={{ ...gig, business_profiles: business }}
              onPress={() => router.push(`/marketplace/gig/${gig.id}`)}
            />
          ))
        )}

        <Text variant="headline" style={styles.section}>
          Portfolio
        </Text>
        <PortfolioGrid items={portfolio} />
      </ScrollView>

      <BusinessQrSheet
        visible={showQr}
        businessName={business.business_name}
        slug={business.slug}
        onClose={() => setShowQr(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { paddingBottom: spacing.xxl },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm },
  empty: { paddingHorizontal: spacing.md },
});
