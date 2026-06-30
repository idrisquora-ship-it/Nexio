import { useEffect, useState } from "react";
import { Modal, Pressable, Share, StyleSheet, View } from "react-native";
import QRCode from "qrcode";
import { SvgXml } from "react-native-svg";
import { Share2, X } from "lucide-react-native";
import { Text } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";

interface BusinessQrSheetProps {
  visible: boolean;
  businessName: string;
  slug: string;
  onClose: () => void;
}

export function businessProfileUrl(slug: string) {
  return `https://nexio.app/business/${slug}`;
}

export function businessDeepLink(slug: string) {
  return `nexio://business/${slug}`;
}

export function BusinessQrSheet({ visible, businessName, slug, onClose }: BusinessQrSheetProps) {
  const [svg, setSvg] = useState("");
  const url = businessProfileUrl(slug);

  useEffect(() => {
    if (!visible) return;
    QRCode.toString(url, {
      type: "svg",
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
      width: 220,
    })
      .then(setSvg)
      .catch(() => setSvg(""));
  }, [visible, url]);

  const shareLink = async () => {
    try {
      await Share.share({
        message: `Check out ${businessName} on Nexio — ${url}`,
        url,
      });
    } catch {
      // User dismissed
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text variant="headline">Business QR</Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <X color={colors.text.secondary} size={22} />
            </Pressable>
          </View>
          <Text variant="body" muted style={styles.subtitle}>
            Scan to open @{slug}
          </Text>
          <View style={styles.qrWrap}>
            {svg ? <SvgXml xml={svg} width={220} height={220} /> : null}
          </View>
          <Text variant="footnote" muted style={styles.url} numberOfLines={2}>
            {url}
          </Text>
          <Pressable style={styles.shareBtn} onPress={shareLink}>
            <Share2 color={colors.brand.primary} size={18} />
            <Text variant="footnote" color="brand">
              Share link
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  subtitle: { marginBottom: spacing.md, textAlign: "center" },
  qrWrap: {
    padding: spacing.md,
    backgroundColor: "#fff",
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  url: { textAlign: "center", marginBottom: spacing.md },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
