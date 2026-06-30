import { ReactNode, useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  acceptCall,
  declineCall,
  joinLiveKitCall,
  subscribeToIncomingCalls,
  type IncomingCall,
} from "../features/calls/api/callsApi";
import { IncomingCallOverlay } from "../features/calls/components/IncomingCallOverlay";
import { fetchConversations } from "../features/messaging/api/messagingApi";
import { useAuthStore } from "../features/auth/store/authStore";
import { setupCallNotificationHandlers } from "../shared/lib/pushNotifications";

export function CallProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [conversationIds, setConversationIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setConversationIds([]);
      return;
    }
    fetchConversations(user.id)
      .then((list) => setConversationIds(list.map((c) => c.id)))
      .catch(() => setConversationIds([]));
  }, [user]);

  const handleIncoming = useCallback((call: IncomingCall) => {
    setIncomingCall((current) => current ?? call);
  }, []);

  useEffect(() => {
    if (!user) return;
    return subscribeToIncomingCalls(user.id, conversationIds, handleIncoming);
  }, [user, conversationIds, handleIncoming]);

  useEffect(() => {
    if (!user) return;
    return setupCallNotificationHandlers((data) => {
      if (data.callId && data.conversationId) {
        handleIncoming({
          id: data.callId,
          conversation_id: data.conversationId,
          room_name: data.roomName ?? "",
          call_type: (data.callType as "voice" | "video") ?? "voice",
          initiated_by: data.callerId ?? "",
          caller_name: data.callerName,
        });
      }
    });
  }, [user, handleIncoming]);

  const handleAccept = async () => {
    if (!incomingCall) return;
    const call = incomingCall;
    setIncomingCall(null);
    try {
      await acceptCall(call.id);
      const result = await joinLiveKitCall(call.conversation_id, call.id);
      router.push({
        pathname: "/call/[roomId]",
        params: {
          roomId: result.room_name,
          callId: result.call_id,
          callType: call.call_type,
          token: result.token,
          url: result.url,
        },
      });
    } catch {
      setIncomingCall(call);
    }
  };

  const handleDecline = async () => {
    if (!incomingCall) return;
    const callId = incomingCall.id;
    setIncomingCall(null);
    await declineCall(callId).catch(() => undefined);
  };

  return (
    <>
      {children}
      <IncomingCallOverlay call={incomingCall} onAccept={handleAccept} onDecline={handleDecline} />
    </>
  );
}
