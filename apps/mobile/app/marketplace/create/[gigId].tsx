import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  countPublishedGigs,
  createGigDraft,
  defaultPackageInputs,
  fetchCategories,
  fetchGigById,
  fetchMyBusiness,
  formatPrice,
  getActiveGigLimit,
  parseFaq,
  publishGig,
  updateGigBasics,
  updateGigDetails,
  updateGigMedia,
  uploadGigCover,
  uploadGigGalleryImage,
  upsertGigPackages,
  type GigFaqItem,
  type PackageInput,
} from "../../../src/features/marketplace/api/marketplaceApi";
import { PackageTierForm } from "../../../src/features/marketplace/components/PackageTierForm";
import { WizardProgress } from "../../../src/features/marketplace/components/WizardProgress";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { useOfflineSync } from "../../../src/providers/OfflineSyncProvider";
import { saveGigWizardSnapshot } from "../../../src/shared/lib/gigWizardQueue";
import { Button, ScreenHeader, Text, TextField } from "../../../src/shared/components";
import { colors, spacing } from "../../../src/shared/theme";

const STEP_LABELS = ["Basics", "Packages", "Media", "FAQ", "Publish"];

export default function GigWizardScreen() {
  const { gigId: paramGigId } = useLocalSearchParams<{ gigId?: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { refreshPending } = useOfflineSync();

  const [step, setStep] = useState(1);
  const [gigId, setGigId] = useState<string | null>(paramGigId ?? null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Design");
  const [subCategory, setSubCategory] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [packages, setPackages] = useState<PackageInput[]>(defaultPackageInputs());
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [buyerRequirements, setBuyerRequirements] = useState("");
  const [faq, setFaq] = useState<GigFaqItem[]>([{ question: "", answer: "" }]);
  const [publishLimit, setPublishLimit] = useState<{ count: number; limit: number } | null>(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!gigId) return;
    fetchGigById(gigId).then((gig) => {
      if (!gig) return;
      setTitle(gig.title);
      setCategory(gig.category);
      setSubCategory(gig.sub_category);
      setShortDescription(gig.short_description ?? "");
      setTagsText((gig.tags ?? []).join(", "));
      setPackages(defaultPackageInputs(gig.packages));
      setCoverUrl(gig.cover_image_url);
      setGalleryUrls(gig.gallery_urls ?? []);
      setDescription(gig.description ?? "");
      setBuyerRequirements(gig.buyer_requirements ?? "");
      const parsed = parseFaq(gig.faq);
      setFaq(parsed.length ? parsed : [{ question: "", answer: "" }]);
    }).catch(() => undefined);
  }, [gigId]);

  useEffect(() => {
    if (!user || step !== 5) return;
    fetchMyBusiness(user.id).then(async (biz) => {
      if (!biz) return;
      const [count, limit] = await Promise.all([
        countPublishedGigs(biz.id),
        getActiveGigLimit(biz.id),
      ]);
      setPublishLimit({ count, limit });
    }).catch(() => undefined);
  }, [user, step]);

  const ensureBusiness = async () => {
    if (!user) throw new Error("Sign in required");
    const business = await fetchMyBusiness(user.id);
    if (!business) {
      router.replace("/settings/become-business");
      throw new Error("Business profile required");
    }
    return business;
  };

  const queueWizard = async (publishOnSync = false) => {
    if (!user) return;
    const business = await fetchMyBusiness(user.id);
    if (!business) return;
    await saveGigWizardSnapshot({
      gigId,
      businessId: business.id,
      step,
      title,
      category,
      subCategory,
      shortDescription,
      tagsText,
      packages,
      coverUrl,
      galleryUrls,
      description,
      buyerRequirements,
      faq,
      publishOnSync,
    });
    await refreshPending();
  };

  const saveStep1 = async () => {
    if (!title.trim() || !subCategory.trim()) {
      Alert.alert("Basics", "Title and sub-category are required.");
      return;
    }
    setLoading(true);
    try {
      const business = await ensureBusiness();
      const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5);
      if (gigId) {
        await updateGigBasics(gigId, {
          title: title.trim(),
          category,
          subCategory: subCategory.trim(),
          shortDescription: shortDescription.trim(),
          tags,
        });
      } else {
        const gig = await createGigDraft({
          businessId: business.id,
          title: title.trim(),
          category,
          subCategory: subCategory.trim(),
          shortDescription: shortDescription.trim(),
          tags,
        });
        setGigId(gig.id);
      }
      setStep(2);
    } catch (e) {
      try {
        await queueWizard(false);
        Alert.alert("Queued", "Gig draft saved offline and will sync when you're back online.");
        setStep(2);
      } catch {
        Alert.alert("Save failed", e instanceof Error ? e.message : "Try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const saveStep2 = async () => {
    if (!gigId) return;
    const basic = packages.find((p) => p.tier === "basic");
    if (!basic?.description.trim() || basic.priceCents <= 0) {
      Alert.alert("Packages", "Basic package needs a price and description.");
      return;
    }
    setLoading(true);
    try {
      await upsertGigPackages(gigId, packages);
      setStep(3);
    } catch (e) {
      try {
        await queueWizard(false);
        Alert.alert("Queued", "Package changes saved offline.");
        setStep(3);
      } catch {
        Alert.alert("Packages", e instanceof Error ? e.message : "Try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const pickCover = async () => {
    if (!user || !gigId) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photos", "Allow photo access to upload a cover.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    setLoading(true);
    try {
      const url = await uploadGigCover(user.id, gigId, result.assets[0].uri);
      await updateGigMedia(gigId, { coverImageUrl: url });
      setCoverUrl(url);
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setLoading(false);
    }
  };

  const addGalleryImage = async () => {
    if (!user || !gigId) return;
    if (galleryUrls.length >= 10) {
      Alert.alert("Gallery", "Maximum 10 images.");
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    setLoading(true);
    try {
      const url = await uploadGigGalleryImage(user.id, gigId, result.assets[0].uri, galleryUrls.length);
      const next = [...galleryUrls, url];
      await updateGigMedia(gigId, { galleryUrls: next });
      setGalleryUrls(next);
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setLoading(false);
    }
  };

  const saveStep3 = async () => {
    if (!coverUrl) {
      Alert.alert("Media", "Cover image is required.");
      return;
    }
    setStep(4);
  };

  const saveStep4 = async () => {
    if (!gigId) return;
    setLoading(true);
    try {
      const cleanFaq = faq.filter((f) => f.question.trim() && f.answer.trim());
      await updateGigDetails(gigId, {
        description: description.trim(),
        buyerRequirements: buyerRequirements.trim(),
        faq: cleanFaq,
      });
      setStep(5);
    } catch (e) {
      try {
        await queueWizard(false);
        Alert.alert("Queued", "Details saved offline.");
        setStep(5);
      } catch {
        Alert.alert("Save failed", e instanceof Error ? e.message : "Try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!gigId) return;
    setLoading(true);
    try {
      await publishGig(gigId);
      Alert.alert("Published!", "Your gig is live in the marketplace.");
      router.replace(`/marketplace/gig/${gigId}`);
    } catch (e) {
      try {
        await queueWizard(true);
        Alert.alert("Queued", "Publish will complete when you're back online.");
        router.replace("/marketplace/create");
      } catch {
        Alert.alert("Publish failed", e instanceof Error ? e.message : "Try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const updatePackage = (tier: PackageInput["tier"], next: PackageInput) => {
    setPackages((prev) => prev.map((p) => (p.tier === tier ? next : p)));
  };

  const updateFaq = (index: number, field: keyof GigFaqItem, value: string) => {
    setFaq((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Create gig" subtitle="Build your listing in 5 steps" />
      <WizardProgress step={step} labels={STEP_LABELS} />

      {step === 1 ? (
        <View style={styles.form}>
          <TextField label="Gig title" value={title} onChangeText={setTitle} maxLength={80} />
          <TextField label="Category" value={category} onChangeText={setCategory} placeholder={categories[0]} />
          <TextField label="Sub-category" value={subCategory} onChangeText={setSubCategory} />
          <TextField
            label="Short description"
            value={shortDescription}
            onChangeText={setShortDescription}
            maxLength={200}
            multiline
          />
          <TextField label="Tags (up to 5, comma-separated)" value={tagsText} onChangeText={setTagsText} />
          <Button label="Continue" loading={loading} onPress={saveStep1} />
        </View>
      ) : null}

      {step === 2 && gigId ? (
        <View style={styles.form}>
          {packages.map((pkg) => (
            <PackageTierForm
              key={pkg.tier}
              pkg={pkg}
              required={pkg.tier === "basic"}
              onChange={(next) => updatePackage(pkg.tier, next)}
            />
          ))}
          <View style={styles.row}>
            <Button label="Back" variant="secondary" onPress={() => setStep(1)} style={styles.halfBtn} />
            <Button label="Continue" loading={loading} onPress={saveStep2} style={styles.halfBtn} />
          </View>
        </View>
      ) : null}

      {step === 3 && gigId ? (
        <View style={styles.form}>
          <Text variant="headline">Cover image</Text>
          {coverUrl ? <Image source={{ uri: coverUrl }} style={styles.cover} /> : null}
          <Button label={coverUrl ? "Change cover" : "Upload cover"} variant="secondary" onPress={pickCover} loading={loading} />
          <Text variant="headline" style={styles.sectionTitle}>
            Gallery ({galleryUrls.length}/10)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
            {galleryUrls.map((url) => (
              <Image key={url} source={{ uri: url }} style={styles.thumb} />
            ))}
          </ScrollView>
          <Button label="Add gallery image" variant="secondary" onPress={addGalleryImage} disabled={loading} />
          <View style={styles.row}>
            <Button label="Back" variant="secondary" onPress={() => setStep(2)} style={styles.halfBtn} />
            <Button label="Continue" onPress={saveStep3} style={styles.halfBtn} />
          </View>
        </View>
      ) : null}

      {step === 4 && gigId ? (
        <View style={styles.form}>
          <TextField label="Full description" value={description} onChangeText={setDescription} multiline />
          <TextField
            label="Requirements from buyer"
            value={buyerRequirements}
            onChangeText={setBuyerRequirements}
            multiline
          />
          <Text variant="headline">FAQ</Text>
          {faq.map((item, index) => (
            <View key={index} style={styles.faqBlock}>
              <TextField label="Question" value={item.question} onChangeText={(v) => updateFaq(index, "question", v)} />
              <TextField label="Answer" value={item.answer} onChangeText={(v) => updateFaq(index, "answer", v)} multiline />
            </View>
          ))}
          <Pressable onPress={() => setFaq((prev) => [...prev, { question: "", answer: "" }])}>
            <Text variant="footnote" color="brand">
              + Add FAQ
            </Text>
          </Pressable>
          <View style={styles.row}>
            <Button label="Back" variant="secondary" onPress={() => setStep(3)} style={styles.halfBtn} />
            <Button label="Preview" loading={loading} onPress={saveStep4} style={styles.halfBtn} />
          </View>
        </View>
      ) : null}

      {step === 5 && gigId ? (
        <View style={styles.form}>
          <Text variant="title2">{title}</Text>
          <Text variant="footnote" muted>
            {category} · {subCategory}
          </Text>
          {coverUrl ? <Image source={{ uri: coverUrl }} style={styles.cover} /> : null}
          <Text variant="body">{shortDescription}</Text>
          {packages.filter((p) => p.enabled || p.tier === "basic").map((pkg) => (
            <View key={pkg.tier} style={styles.previewPkg}>
              <Text variant="headline">{pkg.tier}</Text>
              <Text variant="body" color="brand">
                {formatPrice(pkg.priceCents)}
              </Text>
              <Text variant="footnote" muted>
                {pkg.deliveryDays} days · {pkg.revisions} revisions
              </Text>
            </View>
          ))}
          {publishLimit ? (
            <Text variant="footnote" muted>
              Active gigs: {publishLimit.count} / {publishLimit.limit}
            </Text>
          ) : null}
          <Button label="Publish gig" loading={loading} onPress={handlePublish} />
          <Button label="Save as draft" variant="secondary" onPress={() => router.replace("/(tabs)/marketplace")} />
          <Button label="Back to edit" variant="secondary" onPress={() => setStep(4)} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { paddingBottom: spacing.xxl },
  form: { padding: spacing.md, gap: spacing.md },
  row: { flexDirection: "row", gap: spacing.sm },
  halfBtn: { flex: 1 },
  cover: { width: "100%", height: 180, borderRadius: 12 },
  sectionTitle: { marginTop: spacing.sm },
  galleryRow: { gap: spacing.sm },
  thumb: { width: 80, height: 80, borderRadius: 8 },
  faqBlock: { gap: spacing.sm },
  previewPkg: {
    padding: spacing.md,
    backgroundColor: colors.surface.card,
    borderRadius: 12,
    gap: spacing.xxs,
  },
});
