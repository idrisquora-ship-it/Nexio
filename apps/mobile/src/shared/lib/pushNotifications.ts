import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { getSupabase } from "../lib/supabase";

export type CallNotificationData = {
  callId?: string;
  conversationId?: string;
  roomName?: string;
  callType?: string;
  callerId?: string;
  callerName?: string;
};

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as { type?: string };
    const isCall = data?.type === "call";
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: !isCall,
      shouldShowBanner: true,
      shouldShowList: !isCall,
    };
  },
});

export async function registerPushToken(userId: string) {
  if (Platform.OS !== "android") {
    return null;
  }

  if (!Device.isDevice) {
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("calls", {
      name: "Calls",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const devicePush = await Notifications.getDevicePushTokenAsync();
  const token = typeof devicePush.data === "string" ? devicePush.data : String(devicePush.data);

  const { error } = await getSupabase()
    .from("device_tokens")
    .upsert(
      {
        user_id: userId,
        token,
        platform: "android",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,token" },
    );

  if (error) throw error;
  return token;
}

export async function unregisterPushToken(userId: string) {
  if (Platform.OS !== "android") return;

  try {
    const devicePush = await Notifications.getDevicePushTokenAsync();
    const token = typeof devicePush.data === "string" ? devicePush.data : String(devicePush.data);
    await getSupabase().from("device_tokens").delete().eq("user_id", userId).eq("token", token);
  } catch {
    // Token may not exist in dev / Expo Go
  }
}

function parseCallData(raw: Record<string, unknown>): CallNotificationData {
  return {
    callId: String(raw.callId ?? raw.call_id ?? ""),
    conversationId: String(raw.conversationId ?? raw.conversation_id ?? ""),
    roomName: String(raw.roomName ?? raw.room_name ?? ""),
    callType: String(raw.callType ?? raw.call_type ?? "voice"),
    callerId: String(raw.callerId ?? raw.caller_id ?? ""),
    callerName: String(raw.callerName ?? raw.caller_name ?? ""),
  };
}

export function setupCallNotificationHandlers(onIncomingCall: (data: CallNotificationData) => void) {
  const handleResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    if (data?.type === "call") {
      onIncomingCall(parseCallData(data));
    }
  };

  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) handleResponse(response);
  });

  const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as Record<string, unknown>;
    if (data?.type === "call") {
      onIncomingCall(parseCallData(data));
    }
  });

  return () => {
    subscription.remove();
    receivedSub.remove();
  };
}
