import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { AccessToken } from "npm:livekit-server-sdk@2";

type TokenRequest = {
  conversation_id: string;
  call_type?: "voice" | "video";
  call_id?: string;
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const livekitApiKey = Deno.env.get("LIVEKIT_API_KEY");
  const livekitApiSecret = Deno.env.get("LIVEKIT_API_SECRET");
  const livekitUrl = Deno.env.get("LIVEKIT_URL");

  if (!livekitApiKey || !livekitApiSecret || !livekitUrl) {
    return new Response(JSON.stringify({ error: "LiveKit not configured" }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = (await req.json()) as TokenRequest;
  if (!body.conversation_id) {
    return new Response(JSON.stringify({ error: "conversation_id required" }), { status: 400 });
  }

  const { data: membership } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", body.conversation_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return new Response(JSON.stringify({ error: "Not a conversation participant" }), { status: 403 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? profile?.username ?? "Nexio user";
  let roomName: string;
  let callId: string;

  if (body.call_id) {
    const { data: existingCall, error: callFetchError } = await supabase
      .from("call_sessions")
      .select("id, room_name, status, conversation_id")
      .eq("id", body.call_id)
      .maybeSingle();

    if (callFetchError || !existingCall) {
      return new Response(JSON.stringify({ error: "Call not found" }), { status: 404 });
    }

    if (existingCall.conversation_id !== body.conversation_id) {
      return new Response(JSON.stringify({ error: "Call conversation mismatch" }), { status: 400 });
    }

    if (!["ringing", "active"].includes(existingCall.status)) {
      return new Response(JSON.stringify({ error: "Call is no longer available" }), { status: 410 });
    }

    roomName = existingCall.room_name;
    callId = existingCall.id;

    await supabase.from("call_participants").upsert({
      call_id: callId,
      user_id: user.id,
      joined_at: new Date().toISOString(),
    });
  } else {
    roomName = `nexio-${body.conversation_id}-${crypto.randomUUID().slice(0, 8)}`;
    const callType = body.call_type ?? "voice";

    const { data: callSession, error: callError } = await supabase
      .from("call_sessions")
      .insert({
        conversation_id: body.conversation_id,
        room_name: roomName,
        call_type: callType,
        status: "ringing",
        initiated_by: user.id,
      })
      .select("id")
      .single();

    if (callError) {
      return new Response(JSON.stringify({ error: callError.message }), { status: 500 });
    }

    callId = callSession.id;

    await supabase.from("call_participants").upsert({
      call_id: callId,
      user_id: user.id,
      joined_at: new Date().toISOString(),
    });
  }

  const token = new AccessToken(livekitApiKey, livekitApiSecret, {
    identity: user.id,
    name: displayName,
    ttl: "1h",
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  const jwt = await token.toJwt();

  return new Response(
    JSON.stringify({
      token: jwt,
      url: livekitUrl,
      room_name: roomName,
      call_id: callId,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
