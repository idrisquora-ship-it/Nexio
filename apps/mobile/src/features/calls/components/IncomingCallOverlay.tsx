import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Phone, PhoneOff, Video } from "lucide-react-native";
import { Avatar, Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";
import type { IncomingCall } from "../api/callsApi";

interface IncomingCallOverlayProps {
  call: IncomingCall | null;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallOverlay({ call, onAccept, onDecline }: IncomingCallOverlayProps) {
  if (!call) return null;

  const isVideo = call.call_type === "video";

  return (
    <Modal visible animationType="slide" transparent={false}>
      <View style={styles.container}>
        <Text variant="footnote" muted style={styles.label}>
          Incoming {isVideo ? "video" : "voice"} call
        </Text>
        <Avatar name={call.caller_name ?? "?"} size={96} />
        <Text variant="largeTitle" style={styles.name}>
          {call.caller_name ?? "Someone"}
        </Text>
        <Text variant="body" muted>
          {isVideo ? "Video call" : "Voice call"}
        </Text>

        <View style={styles.actions}>
          <Pressable style={styles.declineWrap} onPress={onDecline} accessibilityRole="button">
            <View style={styles.decline}>
              <PhoneOff color={colors.text.inverse} size={28} />
            </View>
            <Text variant="footnote" muted>
              Decline
            </Text>
          </Pressable>

          <Pressable style={styles.acceptWrap} onPress={onAccept} accessibilityRole="button">
            <View style={styles.accept}>
              {isVideo ? (
                <Video color={colors.text.inverse} size={28} />
              ) : (
                <Phone color={colors.text.inverse} size={28} />
              )}
            </View>
            <Text variant="footnote" muted>
              Accept
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  label: {
    marginBottom: spacing.md,
  },
  name: {
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.xxl,
    marginTop: spacing.xxl,
  },
  declineWrap: {
    alignItems: "center",
    gap: spacing.xs,
  },
  acceptWrap: {
    alignItems: "center",
    gap: spacing.xs,
  },
  decline: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.semantic.error,
    alignItems: "center",
    justifyContent: "center",
  },
  accept: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.semantic.success,
    alignItems: "center",
    justifyContent: "center",
  },
});
