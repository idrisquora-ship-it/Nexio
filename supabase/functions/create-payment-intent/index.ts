import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: flags } = await admin.from("feature_flags").select("enabled").eq("key", "ff_payments_enabled").maybeSingle();
  if (!flags?.enabled) {
    return new Response(
      JSON.stringify({
        enabled: false,
        message: "Payments are not enabled yet. Orders continue without card capture.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const body = await req.json();
  const orderId = String(body.orderId ?? "");
  if (!orderId) {
    return new Response(JSON.stringify({ error: "orderId required" }), { status: 400 });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecret) {
    return new Response(
      JSON.stringify({
        enabled: true,
        configured: false,
        message: "Stripe secret not configured on server.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      enabled: true,
      configured: true,
      message: "Stripe integration hook ready — implement PaymentIntent creation in a future release.",
      orderId,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
