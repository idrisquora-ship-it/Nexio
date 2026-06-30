import { useState } from "react";
import { Alert, Modal, StyleSheet, View } from "react-native";
import { submitOrderReview } from "../api/ordersApi";
import { Button, Text, TextField } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";

interface ReviewSheetProps {
  visible: boolean;
  orderId: string | null;
  role: "buyer" | "seller";
  onClose: () => void;
  onSubmitted: () => void;
}

function StarRow({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Text key={n} variant="title2" onPress={() => onChange(n)} style={styles.star}>
          {n <= value ? "★" : "☆"}
        </Text>
      ))}
    </View>
  );
}

export function ReviewSheet({ visible, orderId, role, onClose, onSubmitted }: ReviewSheetProps) {
  const [overall, setOverall] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [quality, setQuality] = useState(5);
  const [delivery, setDelivery] = useState(5);
  const [professionalism, setProfessionalism] = useState(5);
  const [requirementsQuality, setRequirementsQuality] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      await submitOrderReview({
        orderId,
        role,
        overall: role === "buyer" ? overall : undefined,
        communication,
        quality: role === "buyer" ? quality : undefined,
        delivery: role === "buyer" ? delivery : undefined,
        professionalism,
        requirementsQuality: role === "seller" ? requirementsQuality : undefined,
        wouldRecommend: role === "buyer" ? overall >= 4 : undefined,
        comment: comment.trim() || undefined,
      });
      onSubmitted();
      onClose();
    } catch (e) {
      Alert.alert("Review", e instanceof Error ? e.message : "Could not submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text variant="title2">Leave a review</Text>
          {role === "buyer" ? (
            <>
              <Text variant="footnote" muted>
                Overall
              </Text>
              <StarRow value={overall} onChange={setOverall} />
              <Text variant="footnote" muted>
                Communication
              </Text>
              <StarRow value={communication} onChange={setCommunication} />
              <Text variant="footnote" muted>
                Quality
              </Text>
              <StarRow value={quality} onChange={setQuality} />
              <Text variant="footnote" muted>
                Delivery
              </Text>
              <StarRow value={delivery} onChange={setDelivery} />
            </>
          ) : (
            <>
              <Text variant="footnote" muted>
                Communication
              </Text>
              <StarRow value={communication} onChange={setCommunication} />
              <Text variant="footnote" muted>
                Requirements quality
              </Text>
              <StarRow value={requirementsQuality} onChange={setRequirementsQuality} />
            </>
          )}
          <TextField label="Comment (optional)" value={comment} onChangeText={setComment} multiline />
          <Button label="Submit review" loading={loading} onPress={submit} />
          <Button label="Cancel" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay.scrim,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface.sheet,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  stars: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  star: { color: colors.semantic.warning },
});
