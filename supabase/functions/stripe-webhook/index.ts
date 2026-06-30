import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (webhookSecret) {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature" }), { status: 400 });
    }
  }

  const payload = await req.text();
  let event: { type?: string; id?: string };
  try {
    event = JSON.parse(payload);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  return new Response(
    JSON.stringify({
      received: true,
      stub: true,
      message: "Stripe webhook shell — enable ff_payments_enabled and verify signatures before processing events.",
      type: event.type ?? "unknown",
      id: event.id ?? null,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
