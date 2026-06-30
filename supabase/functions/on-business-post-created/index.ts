import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getSupabaseAdmin, notifyUsers } from "./push.ts";

type BusinessPostRecord = {
  id: string;
  business_id: string;
  body: string;
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const webhookSecret = Deno.env.get("PUSH_WEBHOOK_SECRET");
  if (webhookSecret && req.headers.get("x-webhook-secret") !== webhookSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const payload = await req.json();
  const record = (payload.record ?? payload) as BusinessPostRecord;

  if (!record?.business_id || !record?.body) {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: business } = await supabase
    .from("business_profiles")
    .select("business_name")
    .eq("id", record.business_id)
    .maybeSingle();

  const { data: follows } = await supabase
    .from("business_follows")
    .select("follower_id")
    .eq("business_id", record.business_id);

  const followerIds = (follows ?? []).map((f) => f.follower_id);
  if (!followerIds.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const businessName = business?.business_name ?? "A business you follow";
  const title = `${businessName} posted`;
  const body = record.body.length > 100 ? `${record.body.slice(0, 100)}…` : record.body;

  const { sent, errors } = await notifyUsers(supabase, followerIds, {
    category: "business_update",
    title,
    body,
    data: {
      businessPostId: record.id,
      businessId: record.business_id,
    },
  });

  return new Response(JSON.stringify({ sent, errors }), {
    headers: { "Content-Type": "application/json" },
  });
});
