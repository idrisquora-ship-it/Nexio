import { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, View } from "react-native";
import { fetchGigById } from "../../marketplace/api/marketplaceApi";
import type { GigDetail, PackageTier } from "../../marketplace/api/marketplaceApi";
import { createOrderAgreement } from "../api/ordersApi";
import { Button, Text, TextField } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";

interface AgreementSheetProps {
  visible: boolean;
  conversationId: string;
  gigId: string | null;
  onClose: () => void;
  onCreated: () => void;
}

export function AgreementSheet({
  visible,
  conversationId,
  gigId,
  onClose,
  onCreated,
}: AgreementSheetProps) {
  const [gig, setGig] = useState<GigDetail | null>(null);
  const [tier, setTier] = useState<PackageTier>("basic");
  const [terms, setTerms] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !gigId) return;
    fetchGigById(gigId).then(setGig).catch(() => setGig(null));
  }, [visible, gigId]);

  const submit = async () => {
    if (!gigId) return;
    setLoading(true);
    try {
      await createOrderAgreement({
        conversationId,
        gigId,
        packageTier: tier,
        terms: terms.trim() || undefined,
      });
      onCreated();
      onClose();
    } catch (e) {
      Alert.alert("Agreement", e instanceof Error ? e.message : "Could not send agreement");
    } finally {
      setLoading(false);
    }
  };

  const tiers = gig?.packages?.map((p) => p.tier) ?? ["basic"];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text variant="title2">Send agreement</Text>
          <Text variant="footnote" muted>
            {gig?.title ?? "Select a gig package for the buyer to accept."}
          </Text>
          <ScrollView contentContainerStyle={styles.form}>
            {tiers.map((t) => (
              <Button
                key={t}
                label={t}
                variant={tier === t ? "primary" : "secondary"}
                onPress={() => setTier(t as PackageTier)}
                style={styles.tierBtn}
              />
            ))}
            <TextField
              label="Terms / scope"
              value={terms}
              onChangeText={setTerms}
              multiline
              placeholder="What's included, deadlines, notes…"
            />
            <Button label="Send agreement" loading={loading} onPress={submit} />
            <Button label="Cancel" variant="secondary" onPress={onClose} />
          </ScrollView>
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
    maxHeight: "85%",
    gap: spacing.sm,
  },
  form: { gap: spacing.md, paddingBottom: spacing.xl },
  tierBtn: { alignSelf: "flex-start" },
});
