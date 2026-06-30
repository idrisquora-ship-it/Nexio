import { getSupabase } from "../../../shared/lib/supabase";
import { getOrCreateDirectConversation, sendMessage } from "../../messaging/api/messagingApi";
import type { Database } from "@nexio/supabase";

export type Gig = Database["public"]["Tables"]["gigs"]["Row"];
export type BusinessProfile = Database["public"]["Tables"]["business_profiles"]["Row"];
export type GigPackage = Database["public"]["Tables"]["gig_packages"]["Row"];
export type PortfolioItem = Database["public"]["Tables"]["portfolio_items"]["Row"];
export type PackageTier = Database["public"]["Enums"]["package_tier"];
export type FavoriteTargetType = Database["public"]["Enums"]["favorite_target_type"];

export type GigFaqItem = { question: string; answer: string };

export type GigListItem = Gig & {
  business_profiles: Pick<
    BusinessProfile,
    "id" | "business_name" | "slug" | "logo_url" | "is_verified" | "seller_level"
  > | null;
};

export type GigDetail = Gig & {
  business: Pick<
    BusinessProfile,
    | "id"
    | "business_name"
    | "slug"
    | "logo_url"
    | "tagline"
    | "user_id"
    | "description"
    | "banner_url"
    | "is_vacation_mode"
    | "is_verified"
    | "seller_level"
  > | null;
  packages: GigPackage[];
};

export type PackageInput = {
  tier: PackageTier;
  priceCents: number;
  deliveryDays: number;
  revisions: number;
  description: string;
  features: string[];
  enabled: boolean;
};

const EMPTY_PACKAGES: PackageInput[] = [
  { tier: "basic", priceCents: 0, deliveryDays: 3, revisions: 1, description: "", features: [], enabled: true },
  { tier: "standard", priceCents: 0, deliveryDays: 5, revisions: 2, description: "", features: [], enabled: false },
  { tier: "premium", priceCents: 0, deliveryDays: 7, revisions: 3, description: "", features: [], enabled: false },
];

export function defaultPackageInputs(existing?: GigPackage[]): PackageInput[] {
  return EMPTY_PACKAGES.map((defaults) => {
    const row = existing?.find((p) => p.tier === defaults.tier);
    if (!row) return { ...defaults };
    return {
      tier: row.tier,
      priceCents: row.price_cents,
      deliveryDays: row.delivery_days,
      revisions: row.revisions,
      description: row.description,
      features: row.features ?? [],
      enabled: true,
    };
  });
}

export function parseFaq(raw: Gig["faq"]): GigFaqItem[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is GigFaqItem =>
      typeof item === "object" &&
      item !== null &&
      "question" in item &&
      "answer" in item &&
      typeof (item as GigFaqItem).question === "string",
  );
}

export async function searchGigs(input?: {
  query?: string;
  category?: string;
  limit?: number;
  offset?: number;
  sort?: "ranked" | "newest" | "rating" | "price_asc" | "price_desc";
  minRating?: number;
  maxPriceCents?: number;
}) {
  const { data: sessionData } = await getSupabase().auth.getSession();
  const accessToken = sessionData.session?.access_token;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL");

  const response = await fetch(`${supabaseUrl}/functions/v1/search-gigs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(input ?? {}),
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Search failed");
  return (payload.gigs ?? []) as GigListItem[];
}

export type MarketplaceFilters = {
  sort: "ranked" | "newest" | "rating" | "price_asc" | "price_desc";
  minRating: number | null;
  maxPriceCents: number | null;
};

export const DEFAULT_MARKETPLACE_FILTERS: MarketplaceFilters = {
  sort: "ranked",
  minRating: null,
  maxPriceCents: null,
};

export async function fetchMarketplaceHome(category?: string) {
  const base = category ? { category } : {};
  const [featured, topRated, newArrivals] = await Promise.all([
    searchGigs({ ...base, limit: 8, sort: "ranked" }),
    searchGigs({ ...base, limit: 8, sort: "rating", minRating: 4 }),
    searchGigs({ ...base, limit: 8, sort: "newest" }),
  ]);
  return { featured, topRated, newArrivals };
}

export async function fetchGigById(gigId: string): Promise<GigDetail | null> {
  const { data: gig, error } = await getSupabase()
    .from("gigs")
    .select("*")
    .eq("id", gigId)
    .maybeSingle();

  if (error) throw error;
  if (!gig) return null;

  const { data: business } = await getSupabase()
    .from("business_profiles")
    .select("id, business_name, slug, logo_url, tagline, user_id, description, banner_url, is_vacation_mode, is_verified, seller_level")
    .eq("id", gig.business_id)
    .maybeSingle();

  const { data: packages } = await getSupabase()
    .from("gig_packages")
    .select("*")
    .eq("gig_id", gigId);

  return { ...gig, business: business ?? null, packages: packages ?? [] };
}

export async function fetchMyBusiness(userId: string) {
  const { data, error } = await getSupabase()
    .from("business_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchBusinessBySlug(slug: string) {
  const { data, error } = await getSupabase()
    .from("business_profiles")
    .select("*")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchBusinessGigs(businessId: string, includeDrafts = false) {
  let query = getSupabase().from("gigs").select("*").eq("business_id", businessId);
  if (!includeDrafts) {
    query = query.eq("status", "published");
  }
  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyGigs(businessId: string) {
  const { data, error } = await getSupabase()
    .from("gigs")
    .select("*")
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function becomeBusiness(name: string, slug: string, category?: string) {
  const { data, error } = await getSupabase().rpc("become_business", {
    p_business_name: name,
    p_slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    p_category: category ?? undefined,
  });

  if (error) throw error;
  return data as string;
}

export async function updateBusinessProfile(
  businessId: string,
  input: Partial<Pick<BusinessProfile, "business_name" | "tagline" | "description" | "category" | "logo_url" | "banner_url">>,
) {
  const { data, error } = await getSupabase()
    .from("business_profiles")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", businessId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateBusinessProfileResilient(
  businessId: string,
  input: Partial<Pick<BusinessProfile, "business_name" | "tagline" | "description" | "category" | "logo_url" | "banner_url">>,
) {
  try {
    return await updateBusinessProfile(businessId, input);
  } catch {
    const { enqueueBusinessEdit } = await import("../../../shared/lib/businessEditQueue");
    await enqueueBusinessEdit(businessId, input);
    throw new Error("Saved offline — will sync when you're back online.");
  }
}

export async function createGigDraft(input: {
  businessId: string;
  title: string;
  category: string;
  subCategory: string;
  shortDescription: string;
  tags?: string[];
}) {
  const { data, error } = await getSupabase()
    .from("gigs")
    .insert({
      business_id: input.businessId,
      title: input.title,
      category: input.category,
      sub_category: input.subCategory,
      short_description: input.shortDescription,
      tags: input.tags ?? [],
      status: "draft",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateGigBasics(
  gigId: string,
  input: {
    title: string;
    category: string;
    subCategory: string;
    shortDescription: string;
    tags: string[];
  },
) {
  const { data, error } = await getSupabase()
    .from("gigs")
    .update({
      title: input.title,
      category: input.category,
      sub_category: input.subCategory,
      short_description: input.shortDescription,
      tags: input.tags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", gigId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function upsertGigPackages(gigId: string, packages: PackageInput[]) {
  const enabled = packages.filter((p) => p.enabled && p.tier === "basic" ? true : p.enabled && p.priceCents > 0);

  if (!enabled.some((p) => p.tier === "basic")) {
    throw new Error("Basic package is required");
  }

  const { data: existing } = await getSupabase()
    .from("gig_packages")
    .select("tier")
    .eq("gig_id", gigId);

  const keepTiers = new Set(enabled.map((p) => p.tier));
  const removeTiers = (existing ?? []).map((r) => r.tier).filter((t) => !keepTiers.has(t));

  if (removeTiers.length) {
    const { error: deleteError } = await getSupabase()
      .from("gig_packages")
      .delete()
      .eq("gig_id", gigId)
      .in("tier", removeTiers);
    if (deleteError) throw deleteError;
  }

  for (const pkg of enabled) {
    const { error } = await getSupabase()
      .from("gig_packages")
      .upsert(
        {
          gig_id: gigId,
          tier: pkg.tier,
          price_cents: pkg.priceCents,
          delivery_days: pkg.deliveryDays,
          revisions: pkg.revisions,
          description: pkg.description.trim(),
          features: pkg.features.filter(Boolean),
        },
        { onConflict: "gig_id,tier" },
      );
    if (error) throw error;
  }
}

export async function updateGigMedia(
  gigId: string,
  input: { coverImageUrl?: string | null; galleryUrls?: string[] },
) {
  const patch: {
    updated_at: string;
    cover_image_url?: string | null;
    gallery_urls?: string[];
  } = { updated_at: new Date().toISOString() };
  if (input.coverImageUrl !== undefined) patch.cover_image_url = input.coverImageUrl;
  if (input.galleryUrls !== undefined) patch.gallery_urls = input.galleryUrls;

  const { data, error } = await getSupabase()
    .from("gigs")
    .update(patch)
    .eq("id", gigId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateGigDetails(
  gigId: string,
  input: { description?: string; buyerRequirements?: string; faq?: GigFaqItem[] },
) {
  const { data, error } = await getSupabase()
    .from("gigs")
    .update({
      description: input.description ?? null,
      buyer_requirements: input.buyerRequirements ?? null,
      faq: (input.faq ?? []) as unknown as Gig["faq"],
      updated_at: new Date().toISOString(),
    })
    .eq("id", gigId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function publishGig(gigId: string) {
  const { data, error } = await getSupabase().rpc("publish_gig", { p_gig_id: gigId });
  if (error) throw error;
  return data as Gig;
}

export async function getActiveGigLimit(businessId: string) {
  const { data, error } = await getSupabase().rpc("get_active_gig_limit", {
    p_business_id: businessId,
  });
  if (error) throw error;
  return data as number;
}

export async function countPublishedGigs(businessId: string) {
  const { count, error } = await getSupabase()
    .from("gigs")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "published");

  if (error) throw error;
  return count ?? 0;
}

export async function fetchCategories() {
  const { data } = await getSupabase()
    .from("marketplace_config")
    .select("value")
    .eq("key", "categories")
    .maybeSingle();

  if (data?.value && Array.isArray(data.value)) {
    return data.value as string[];
  }
  return ["Design", "Development", "Marketing", "Writing", "Video", "Other"];
}

async function uploadPublicImage(bucket: string, path: string, localUri: string) {
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();
  const { error } = await getSupabase()
    .storage
    .from(bucket)
    .upload(path, arrayBuffer, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  const { data } = getSupabase().storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadGigCover(userId: string, gigId: string, localUri: string) {
  return uploadPublicImage("gig_images", `${userId}/${gigId}/cover.jpg`, localUri);
}

export async function uploadGigGalleryImage(userId: string, gigId: string, localUri: string, index: number) {
  return uploadPublicImage("gig_images", `${userId}/${gigId}/gallery-${index}.jpg`, localUri);
}

export async function uploadBusinessLogo(userId: string, localUri: string) {
  return uploadPublicImage("business_logos", `${userId}/logo.jpg`, localUri);
}

export async function uploadBusinessBanner(userId: string, localUri: string) {
  return uploadPublicImage("business_banners", `${userId}/banner.jpg`, localUri);
}

export async function uploadPortfolioImage(userId: string, itemId: string, localUri: string) {
  return uploadPublicImage("portfolio", `${userId}/${itemId}.jpg`, localUri);
}

export async function fetchPortfolio(businessId: string) {
  const { data, error } = await getSupabase()
    .from("portfolio_items")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createPortfolioItem(input: {
  businessId: string;
  title: string;
  description?: string;
  mediaUrl: string;
  mediaType?: "image" | "video";
  sortOrder?: number;
}) {
  const { data, error } = await getSupabase()
    .from("portfolio_items")
    .insert({
      business_id: input.businessId,
      title: input.title,
      description: input.description ?? null,
      media_url: input.mediaUrl,
      media_type: input.mediaType ?? "image",
      sort_order: input.sortOrder ?? 0,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updatePortfolioItem(
  itemId: string,
  input: Partial<Pick<PortfolioItem, "title" | "description" | "media_url" | "sort_order">>,
) {
  const { data, error } = await getSupabase()
    .from("portfolio_items")
    .update(input)
    .eq("id", itemId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deletePortfolioItem(itemId: string) {
  const { error } = await getSupabase().from("portfolio_items").delete().eq("id", itemId);
  if (error) throw error;
}

export async function isFavorited(userId: string, targetType: FavoriteTargetType, targetId: string) {
  const { data, error } = await getSupabase()
    .from("favorites")
    .select("user_id")
    .eq("user_id", userId)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function toggleFavorite(userId: string, targetType: FavoriteTargetType, targetId: string) {
  const existing = await isFavorited(userId, targetType, targetId);
  if (existing) {
    const { error } = await getSupabase()
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("target_type", targetType)
      .eq("target_id", targetId);
    if (error) throw error;
    return false;
  }

  const { error } = await getSupabase()
    .from("favorites")
    .insert({ user_id: userId, target_type: targetType, target_id: targetId });
  if (error) throw error;
  return true;
}

export async function fetchFavoriteGigs(userId: string): Promise<GigListItem[]> {
  const { data: favs, error } = await getSupabase()
    .from("favorites")
    .select("target_id, created_at")
    .eq("user_id", userId)
    .eq("target_type", "gig")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!favs?.length) return [];

  const ids = favs.map((f) => f.target_id);
  const { data: gigs, error: gigError } = await getSupabase()
    .from("gigs")
    .select("*")
    .in("id", ids)
    .eq("status", "published");

  if (gigError) throw gigError;

  const businessIds = [...new Set((gigs ?? []).map((g) => g.business_id))];
  const { data: businesses } = await getSupabase()
    .from("business_profiles")
    .select("id, business_name, slug, logo_url")
    .in("id", businessIds);

  const bizById = new Map((businesses ?? []).map((b) => [b.id, b]));
  const gigById = new Map((gigs ?? []).map((g) => [g.id, g]));

  return favs
    .map((f) => {
      const gig = gigById.get(f.target_id);
      if (!gig) return null;
      return { ...gig, business_profiles: bizById.get(gig.business_id) ?? null };
    })
    .filter(Boolean) as GigListItem[];
}

export async function fetchFavoriteBusinesses(userId: string) {
  const { data: favs, error } = await getSupabase()
    .from("favorites")
    .select("target_id")
    .eq("user_id", userId)
    .eq("target_type", "business");

  if (error) throw error;
  if (!favs?.length) return [];

  const ids = favs.map((f) => f.target_id);
  const { data, error: bizError } = await getSupabase()
    .from("business_profiles")
    .select("*")
    .in("id", ids);

  if (bizError) throw bizError;
  return data ?? [];
}

export async function contactSellerAboutGig(gig: GigDetail, senderId: string) {
  if (!gig.business?.user_id) throw new Error("Seller not found");
  const conversationId = await getOrCreateDirectConversation(gig.business.user_id);

  await sendMessage({
    conversationId,
    senderId,
    body: `Hi! I'm interested in "${gig.title}".`,
    clientId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    contentType: "gig_inquiry",
    mediaMetadata: {
      gigId: gig.id,
      title: gig.title,
      coverImageUrl: gig.cover_image_url,
      startingPriceCents: gig.starting_price_cents,
      currency: gig.currency,
      businessName: gig.business.business_name,
    },
  });

  try {
    await getSupabase().rpc("create_inquiry_order", {
      p_conversation_id: conversationId,
      p_gig_id: gig.id,
    });
  } catch {
    // Inquiry order is optional if one already exists
  }

  return conversationId;
}

export function formatPrice(cents: number | null, currency = "USD") {
  if (cents == null) return "Contact";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
