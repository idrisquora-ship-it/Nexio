import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type SortMode = "ranked" | "newest" | "rating" | "price_asc" | "price_desc";

type SearchRequest = {
  query?: string;
  category?: string;
  limit?: number;
  offset?: number;
  sort?: SortMode;
  minRating?: number;
  maxPriceCents?: number;
};

type RankingWeights = {
  verified?: number;
  rating?: number;
  completed_orders?: number;
  keyword?: number;
  recent_activity?: number;
  vacation_penalty?: number;
};

type GigRow = {
  id: string;
  title: string;
  category: string;
  sub_category: string;
  short_description: string | null;
  cover_image_url: string | null;
  starting_price_cents: number | null;
  currency: string;
  rating_avg: number;
  rating_count: number;
  order_count: number;
  published_at: string | null;
  business_profiles: {
    id: string;
    business_name: string;
    slug: string;
    logo_url: string | null;
    user_id: string;
    is_verified: boolean;
    is_vacation_mode: boolean;
    seller_level: number;
  };
};

function scoreGig(gig: GigRow, query: string | undefined, weights: RankingWeights): number {
  const w = {
    verified: weights.verified ?? 10,
    rating: weights.rating ?? 20,
    completed_orders: weights.completed_orders ?? 15,
    keyword: weights.keyword ?? 25,
    recent_activity: weights.recent_activity ?? 5,
    vacation_penalty: weights.vacation_penalty ?? 30,
  };

  let score = 0;
  const biz = gig.business_profiles;

  if (biz.is_verified) score += w.verified;
  score += (Number(gig.rating_avg) || 0) * (w.rating / 5);
  score += Math.min(gig.order_count, 100) * (w.completed_orders / 100);
  score += (biz.seller_level ?? 0) * 2;

  if (query?.trim()) {
    const q = query.trim().toLowerCase();
    const title = gig.title.toLowerCase();
    const desc = (gig.short_description ?? "").toLowerCase();
    if (title.includes(q)) score += w.keyword;
    else if (desc.includes(q)) score += w.keyword * 0.6;
    else if (title.split(" ").some((word) => word.startsWith(q))) score += w.keyword * 0.4;
  }

  if (gig.published_at) {
    const daysSince = (Date.now() - new Date(gig.published_at).getTime()) / 86400000;
    score += Math.max(0, w.recent_activity * (1 - daysSince / 90));
  }

  if (biz.is_vacation_mode) score -= w.vacation_penalty;

  return score;
}

function sortGigs(gigs: GigRow[], sort: SortMode, query: string | undefined, weights: RankingWeights) {
  const rows = [...gigs];
  switch (sort) {
    case "newest":
      return rows.sort(
        (a, b) =>
          new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime(),
      );
    case "rating":
      return rows.sort(
        (a, b) =>
          Number(b.rating_avg) - Number(a.rating_avg) ||
          b.rating_count - a.rating_count ||
          b.order_count - a.order_count,
      );
    case "price_asc":
      return rows.sort(
        (a, b) => (a.starting_price_cents ?? 0) - (b.starting_price_cents ?? 0),
      );
    case "price_desc":
      return rows.sort(
        (a, b) => (b.starting_price_cents ?? 0) - (a.starting_price_cents ?? 0),
      );
    default:
      return rows
        .map((gig) => ({ gig, score: scoreGig(gig, query, weights) }))
        .sort((a, b) => b.score - a.score || b.gig.order_count - a.gig.order_count)
        .map((row) => row.gig);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: authHeader ? { headers: { Authorization: authHeader } } : {},
  });

  const body = (await req.json()) as SearchRequest;
  const limit = Math.min(body.limit ?? 20, 50);
  const offset = body.offset ?? 0;
  const sort = body.sort ?? "ranked";
  const fetchLimit = Math.min(offset + limit + 50, 150);

  const { data: weightRow } = await supabase
    .from("marketplace_config")
    .select("value")
    .eq("key", "ranking_weights")
    .maybeSingle();

  const weights = (weightRow?.value ?? {}) as RankingWeights;

  let query = supabase
    .from("gigs")
    .select(`
      id, title, category, sub_category, short_description, cover_image_url,
      starting_price_cents, currency, rating_avg, rating_count, order_count, published_at,
      business_profiles!inner(id, business_name, slug, logo_url, user_id, is_verified, is_vacation_mode, seller_level)
    `)
    .eq("status", "published");

  if (body.category) {
    query = query.eq("category", body.category);
  }

  if (body.query?.trim()) {
    const q = body.query.trim();
    query = query.or(`title.ilike.%${q}%,short_description.ilike.%${q}%`);
  }

  if (body.maxPriceCents != null) {
    query = query.lte("starting_price_cents", body.maxPriceCents);
  }

  const { data, error } = await query.limit(fetchLimit);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let gigs = (data ?? []) as GigRow[];

  if (body.minRating != null) {
    gigs = gigs.filter((g) => Number(g.rating_avg) >= body.minRating!);
  }

  if (sort === "rating") {
    gigs = gigs.filter((g) => g.rating_count > 0);
  }

  const sorted = sortGigs(gigs, sort, body.query, weights).slice(offset, offset + limit);

  return new Response(JSON.stringify({ gigs: sorted }), {
    headers: { "Content-Type": "application/json" },
  });
});
