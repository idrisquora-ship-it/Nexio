import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type SearchRequest = {
  query?: string;
  limit?: number;
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: SearchRequest = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const query = (body.query ?? "").trim();
  const limit = Math.min(Math.max(body.limit ?? 8, 1), 20);

  if (!query) {
    return new Response(
      JSON.stringify({ people: [], businesses: [], gigs: [], communities: [], channels: [] }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const pattern = `%${query}%`;

  const [people, businesses, gigs, communities, channels] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
      .limit(limit),
    supabase
      .from("business_profiles")
      .select("id, business_name, slug, logo_url, category, is_verified")
      .or(`business_name.ilike.${pattern},slug.ilike.${pattern}`)
      .limit(limit),
    supabase
      .from("gigs")
      .select("id, title, category, cover_image_url, starting_price_cents, currency, business_profiles(id, business_name, slug, logo_url)")
      .eq("status", "published")
      .or(`title.ilike.${pattern},category.ilike.${pattern}`)
      .limit(limit),
    supabase
      .from("communities")
      .select("id, name, slug, avatar_url, is_public")
      .eq("is_public", true)
      .or(`name.ilike.${pattern},slug.ilike.${pattern}`)
      .limit(limit),
    supabase
      .from("channels")
      .select("id, name, description, avatar_url, community_id, business_id")
      .ilike("name", pattern)
      .limit(limit),
  ]);

  const firstError =
    people.error ?? businesses.error ?? gigs.error ?? communities.error ?? channels.error;
  if (firstError) {
    return new Response(JSON.stringify({ error: firstError.message }), { status: 500 });
  }

  return new Response(
    JSON.stringify({
      people: people.data ?? [],
      businesses: businesses.data ?? [],
      gigs: gigs.data ?? [],
      communities: communities.data ?? [],
      channels: channels.data ?? [],
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
