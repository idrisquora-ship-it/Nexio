import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Image } from "react-native";
import { X } from "lucide-react-native";
import { colors, spacing } from "../../../shared/theme";

interface MediaViewerModalProps {
  visible: boolean;
  type: "image" | "video";
  uri: string | null;
  onClose: () => void;
}

function VideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });

  return <VideoView player={player} style={styles.video} contentFit="contain" nativeControls />;
}

export function MediaViewerModal({ visible, type, uri, onClose }: MediaViewerModalProps) {
  if (!uri) return null;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <Pressable style={styles.close} onPress={onClose} accessibilityRole="button">
          <X color={colors.text.primary} size={28} />
        </Pressable>
        {type === "image" ? (
          <Image source={{ uri }} style={styles.image} resizeMode="contain" />
        ) : (
          <VideoPlayer uri={uri} />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  close: {
    position: "absolute",
    top: spacing.xxl,
    right: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  video: {
    width: "100%",
    height: "100%",
  },
});
