import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { PhoneOff } from "lucide-react-native";
import { LiveKitCallRoom } from "../../src/features/calls/components/LiveKitCallRoom";
import { endCall, markCallActive } from "../../src/features/calls/api/callsApi";
import { Button, Text } from "../../src/shared/components";
import { colors, spacing } from "../../src/shared/theme";

export default function ActiveCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    roomId: string;
    callId?: string;
    callType?: "voice" | "video";
    token?: string;
    url?: string;
    participantCount?: string;
  }>();

  const callType = params.callType ?? "voice";
  const token = params.token ?? "";
  const url = params.url ?? process.env.EXPO_PUBLIC_LIVEKIT_URL ?? "";
  const callId = params.callId ?? "";
  const isOutgoing = !!token;

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(
    !token || !url ? "Missing call credentials. Start the call from a chat." : null,
  );

  const handleEnd = async () => {
    if (callId) {
      await endCall(callId).catch(() => undefined);
    }
    router.back();
  };

  const handleConnected = () => {
    setConnected(true);
    if (callId) {
      markCallActive(callId).catch(() => undefined);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="largeTitle" style={styles.title}>
        {callType === "video" ? "Video call" : "Voice call"}
      </Text>
      <Text variant="body" muted style={styles.room}>
        {connected
          ? "Connected"
          : isOutgoing
            ? Number(params.participantCount ?? 0) > 2
              ? "Ringing group…"
              : "Ringing…"
            : "Connecting…"}
      </Text>

      {error ? (
        <Text variant="body" style={styles.error}>
          {error}
        </Text>
      ) : null}

      {!error && token && url ? (
        <View style={styles.roomContainer}>
          <LiveKitCallRoom
            token={token}
            url={url}
            callType={callType}
            onConnected={handleConnected}
          />
        </View>
      ) : null}

      <Pressable style={styles.endButton} onPress={handleEnd} accessibilityRole="button">
        <PhoneOff color={colors.text.inverse} size={28} />
      </Pressable>

      <Button label="Back to chat" variant="ghost" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: { textAlign: "center" },
  room: { textAlign: "center" },
  roomContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  error: { color: colors.semantic.error, textAlign: "center" },
  endButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.semantic.error,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
});
