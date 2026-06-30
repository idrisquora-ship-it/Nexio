import { useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Star } from "lucide-react-native";
import { useAuthStore } from "../../auth/store/authStore";
import { colors } from "../../../shared/theme";
import { isFavorited, toggleFavorite, type FavoriteTargetType } from "../api/marketplaceApi";

interface FavoriteButtonProps {
  targetType: FavoriteTargetType;
  targetId: string;
  size?: number;
}

export function FavoriteButton({ targetType, targetId, size = 22 }: FavoriteButtonProps) {
  const { user } = useAuthStore();
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    isFavorited(user.id, targetType, targetId).then(setActive).catch(() => setActive(false));
  }, [user, targetType, targetId]);

  const onPress = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      const next = await toggleFavorite(user.id, targetType, targetId);
      setActive(next);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Pressable style={styles.btn} onPress={onPress} disabled={loading}>
      <Star
        size={size}
        color={active ? colors.semantic.warning : colors.text.secondary}
        fill={active ? colors.semantic.warning : "transparent"}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 4 },
});
