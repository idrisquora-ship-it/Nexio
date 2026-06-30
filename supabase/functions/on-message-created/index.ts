import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getSupabaseAdmin, notifyUsers } from "./push.ts";

type MessageRecord = {
  id: string;
  conversation_id: string;
  sender_id: string;
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
  const record = (payload.record ?? payload) as MessageRecord;

  if (!record?.conversation_id || !record?.sender_id || !record?.body) {
    return new Response(JSON.stringify({ skipped: true, reason: "invalid payload" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: participants, error: participantsError } = await supabase
    .from("conversation_participants")
    .select("user_id, muted")
    .eq("conversation_id", record.conversation_id)
    .neq("user_id", record.sender_id);

  if (participantsError) {
    return new Response(JSON.stringify({ error: participantsError.message }), { status: 500 });
  }

  const recipientIds = (participants ?? [])
    .filter((p) => !p.muted)
    .map((p) => p.user_id);

  if (recipientIds.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", record.sender_id)
    .maybeSingle();

  const senderName = senderProfile?.display_name ?? senderProfile?.username ?? "Someone";
  const title = senderName;
  const body = record.body.length > 100 ? `${record.body.slice(0, 100)}…` : record.body;

  const { sent, errors } = await notifyUsers(supabase, recipientIds, {
    category: "message",
    title,
    body,
    data: {
      conversationId: record.conversation_id,
      messageId: record.id,
    },
  });

  return new Response(JSON.stringify({ sent, errors }), {
    headers: { "Content-Type": "application/json" },
  });
});
