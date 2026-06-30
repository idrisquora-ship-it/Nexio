import { getSupabase } from "../../../shared/lib/supabase";

export type GlobalSearchResults = {
  people: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  }[];
  businesses: {
    id: string;
    business_name: string;
    slug: string;
    logo_url: string | null;
    category: string | null;
    is_verified: boolean;
  }[];
  gigs: {
    id: string;
    title: string;
    category: string;
    cover_image_url: string | null;
    starting_price_cents: number | null;
    currency: string;
    business_profiles: {
      id: string;
      business_name: string;
      slug: string;
      logo_url: string | null;
    } | null;
  }[];
  communities: {
    id: string;
    name: string;
    slug: string;
    avatar_url: string | null;
    is_public: boolean;
  }[];
  channels: {
    id: string;
    name: string;
    description: string | null;
    avatar_url: string | null;
    community_id: string | null;
    business_id: string | null;
  }[];
};

export async function searchGlobal(query: string, limit = 8): Promise<GlobalSearchResults> {
  const { data: sessionData } = await getSupabase().auth.getSession();
  const accessToken = sessionData.session?.access_token;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL");

  const response = await fetch(`${supabaseUrl}/functions/v1/search-global`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ query, limit }),
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Search failed");

  return {
    people: payload.people ?? [],
    businesses: payload.businesses ?? [],
    gigs: payload.gigs ?? [],
    communities: payload.communities ?? [],
    channels: payload.channels ?? [],
  };
}
