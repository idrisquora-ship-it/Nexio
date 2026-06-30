import { getSupabase } from "../../../shared/lib/supabase";
import type { Database } from "@nexio/supabase";

export type CallSession = Database["public"]["Tables"]["call_sessions"]["Row"];

export type LiveKitTokenResponse = {
  token: string;
  url: string;
  room_name: string;
  call_id: string;
};

export type IncomingCall = {
  id: string;
  conversation_id: string;
  room_name: string;
  call_type: "voice" | "video";
  initiated_by: string;
  caller_name?: string;
};

async function callEdgeFunction(body: Record<string, unknown>): Promise<LiveKitTokenResponse> {
  const { data: sessionData } = await getSupabase().auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error("Not authenticated");

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL");

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-livekit-token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Failed to get call token");
  }

  return payload as LiveKitTokenResponse;
}

export async function fetchCallHistory(userId: string): Promise<CallSession[]> {
  const { data: memberships } = await getSupabase()
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (!memberships?.length) return [];

  const conversationIds = memberships.map((m) => m.conversation_id);

  const { data, error } = await getSupabase()
    .from("call_sessions")
    .select("*")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function requestLiveKitToken(
  conversationId: string,
  callType: "voice" | "video" = "voice",
): Promise<LiveKitTokenResponse> {
  return callEdgeFunction({ conversation_id: conversationId, call_type: callType });
}

export async function joinLiveKitCall(
  conversationId: string,
  callId: string,
): Promise<LiveKitTokenResponse> {
  return callEdgeFunction({ conversation_id: conversationId, call_id: callId });
}

export async function acceptCall(callId: string) {
  const { error } = await getSupabase().rpc("accept_call", { p_call_id: callId });
  if (error) throw error;
}

export async function declineCall(callId: string) {
  const { error } = await getSupabase().rpc("decline_call", { p_call_id: callId });
  if (error) throw error;
}

export async function endCall(callId: string) {
  const endedAt = new Date();
  const { data: session } = await getSupabase()
    .from("call_sessions")
    .select("started_at")
    .eq("id", callId)
    .maybeSingle();

  let durationSeconds: number | null = null;
  if (session?.started_at) {
    durationSeconds = Math.floor(
      (endedAt.getTime() - new Date(session.started_at).getTime()) / 1000,
    );
  }

  const { error } = await getSupabase()
    .from("call_sessions")
    .update({
      status: "ended",
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq("id", callId);

  if (error) throw error;
}

export async function markCallActive(callId: string) {
  const { error } = await getSupabase()
    .from("call_sessions")
    .update({
      status: "active",
      started_at: new Date().toISOString(),
    })
    .eq("id", callId);

  if (error) throw error;
}

export async function fetchCallerProfile(userId: string) {
  const { data } = await getSupabase()
    .from("profiles")
    .select("display_name, username, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export function subscribeToIncomingCalls(
  userId: string,
  conversationIds: string[],
  onIncoming: (call: IncomingCall) => void,
) {
  if (!conversationIds.length) return () => undefined;

  const channel = getSupabase()
    .channel(`incoming-calls:${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "call_sessions" },
      async (payload) => {
        const call = payload.new as CallSession;
        if (call.status !== "ringing" || call.initiated_by === userId) return;
        if (!conversationIds.includes(call.conversation_id)) return;

        const profile = await fetchCallerProfile(call.initiated_by);
        onIncoming({
          id: call.id,
          conversation_id: call.conversation_id,
          room_name: call.room_name,
          call_type: call.call_type,
          initiated_by: call.initiated_by,
          caller_name: profile?.display_name ?? profile?.username ?? "Someone",
        });
      },
    )
    .subscribe();

  return () => {
    getSupabase().removeChannel(channel);
  };
}
