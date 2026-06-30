import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getSupabaseAdmin, notifyUsers } from "./push.ts";

type CallRecord = {
  id: string;
  conversation_id: string;
  room_name: string;
  call_type: "voice" | "video";
  status: string;
  initiated_by: string;
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = getSupabaseAdmin();
  const payload = await req.json();
  const record = (payload.record ?? payload) as CallRecord;

  if (!record?.id || !record?.conversation_id || record?.status !== "ringing") {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: participants, error: participantsError } = await supabase
    .from("conversation_participants")
    .select("user_id, muted")
    .eq("conversation_id", record.conversation_id)
    .neq("user_id", record.initiated_by);

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

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", record.initiated_by)
    .maybeSingle();

  const callerName = callerProfile?.display_name ?? callerProfile?.username ?? "Someone";
  const callLabel = record.call_type === "video" ? "Video call" : "Voice call";
  const title = `Incoming ${callLabel}`;
  const body = `${callerName} is calling you`;

  const { sent, errors } = await notifyUsers(supabase, recipientIds, {
    category: "call",
    title,
    body,
    alwaysPush: true,
    androidChannelId: "calls",
    data: {
      callId: record.id,
      conversationId: record.conversation_id,
      roomName: record.room_name,
      callType: record.call_type,
      callerId: record.initiated_by,
      callerName,
    },
  });

  return new Response(JSON.stringify({ sent, errors }), {
    headers: { "Content-Type": "application/json" },
  });
});
