import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Flag } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  contactSellerAboutGig,
  fetchGigById,
  formatPrice,
  parseFaq,
  type GigPackage,
} from "../../../src/features/marketplace/api/marketplaceApi";
import { FavoriteButton } from "../../../src/features/marketplace/components/FavoriteButton";
import { VacationBanner } from "../../../src/features/marketplace/components/VacationBanner";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { useReportStore } from "../../../src/features/moderation/store/reportStore";
import { Button, ScreenHeader, Text } from "../../../src/shared/components";
import { colors, spacing } from "../../../src/shared/theme";

type GigDetail = NonNullable<Awaited<ReturnType<typeof fetchGigById>>>;

export default function GigDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const openReport = useReportStore((s) => s.open);
  const [gig, setGig] = useState<GigDetail | null>(null);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchGigById(id).then(setGig).catch(() => setGig(null));
  }, [id]);

  const contactSeller = async () => {
    if (!user || !gig) return;
    setContacting(true);
    try {
      const conversationId = await contactSellerAboutGig(gig, user.id);
      router.push(`/(tabs)/chats/${conversationId}`);
    } finally {
      setContacting(false);
    }
  };

  if (!gig) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Gig" />
        <ActivityIndicator style={styles.loader} color={colors.brand.primary} />
      </View>
    );
  }

  const packages = [...(gig.packages ?? [])].sort((a, b) => a.tier.localeCompare(b.tier));
  const faq = parseFaq(gig.faq);
  const gallery = gig.gallery_urls ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {gig.cover_image_url ? (
        <Image source={{ uri: gig.cover_image_url }} style={styles.hero} />
      ) : null}
      {gig.business?.is_vacation_mode ? <VacationBanner /> : null}
      <View style={styles.headerRow}>
        <ScreenHeader title={gig.title} />
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => openReport({ type: "gig", id: gig.id, label: gig.title })}
            accessibilityRole="button"
            accessibilityLabel="Report gig"
            style={styles.reportBtn}
          >
            <Flag color={colors.text.secondary} size={20} />
          </Pressable>
          <FavoriteButton targetType="gig" targetId={gig.id} />
        </View>
      </View>
      <Text
        variant="footnote"
        color="brand"
        style={styles.businessLink}
        onPress={() => gig.business?.slug && router.push(`/business/${gig.business.slug}`)}
      >
        {gig.business?.business_name ?? "Seller"}
      </Text>
      <Text variant="title2" color="brand" style={styles.price}>
        From {formatPrice(gig.starting_price_cents, gig.currency)}
      </Text>
      {gig.short_description ? (
        <Text variant="body" style={styles.section}>
          {gig.short_description}
        </Text>
      ) : null}
      {gig.description ? (
        <Text variant="body" muted style={styles.section}>
          {gig.description}
        </Text>
      ) : null}

      {gallery.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
          {gallery.map((url) => (
            <Image key={url} source={{ uri: url }} style={styles.galleryImage} />
          ))}
        </ScrollView>
      ) : null}

      {packages.length > 0 ? (
        <View style={styles.section}>
          <Text variant="headline">Packages</Text>
          {packages.map((pkg: GigPackage) => (
            <View key={pkg.id} style={styles.package}>
              <Text variant="headline">{pkg.tier}</Text>
              <Text variant="body" color="brand">
                {formatPrice(pkg.price_cents, gig.currency)}
              </Text>
              <Text variant="footnote" muted>
                {pkg.delivery_days} day delivery · {pkg.revisions} revisions
              </Text>
              <Text variant="body">{pkg.description}</Text>
              {pkg.features?.length ? (
                <Text variant="footnote" muted>
                  {pkg.features.map((f) => `• ${f}`).join("\n")}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {gig.buyer_requirements ? (
        <View style={styles.section}>
          <Text variant="headline">Requirements</Text>
          <Text variant="body" muted>
            {gig.buyer_requirements}
          </Text>
        </View>
      ) : null}

      {faq.length > 0 ? (
        <View style={styles.section}>
          <Text variant="headline">FAQ</Text>
          {faq.map((item, i) => (
            <View key={i} style={styles.faq}>
              <Text variant="headline">{item.question}</Text>
              <Text variant="body" muted>
                {item.answer}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Button label="Contact Seller" loading={contacting} onPress={contactSeller} style={styles.cta} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { paddingBottom: spacing.xxl },
  loader: { marginTop: spacing.xl },
  hero: { width: "100%", height: 200 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", paddingRight: spacing.md },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingTop: spacing.sm },
  reportBtn: { padding: spacing.xs },
  businessLink: { paddingHorizontal: spacing.md, marginTop: -spacing.sm },
  price: { marginTop: spacing.sm, paddingHorizontal: spacing.md },
  section: { marginTop: spacing.lg, paddingHorizontal: spacing.md, gap: spacing.sm },
  gallery: { paddingHorizontal: spacing.md, gap: spacing.sm, marginTop: spacing.md },
  galleryImage: { width: 120, height: 90, borderRadius: 8 },
  package: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface.card,
    borderRadius: 12,
    gap: spacing.xxs,
  },
  faq: { marginTop: spacing.md, gap: spacing.xxs },
  cta: { margin: spacing.md, marginTop: spacing.xl },
});
