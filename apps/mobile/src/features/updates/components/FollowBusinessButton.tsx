import { useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useAuthStore } from "../../../features/auth/store/authStore";
import { Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";
import { isBusinessFollowed, toggleBusinessFollow } from "../api/updatesApi";

interface FollowBusinessButtonProps {
  businessId: string;
  disabled?: boolean;
}

export function FollowBusinessButton({ businessId, disabled }: FollowBusinessButtonProps) {
  const { user } = useAuthStore();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    isBusinessFollowed(businessId, user.id)
      .then(setFollowing)
      .finally(() => setLoading(false));
  }, [businessId, user]);

  const toggle = async () => {
    const next = await toggleBusinessFollow(businessId);
    setFollowing(next);
  };

  if (loading || disabled) return null;

  return (
    <Pressable style={[styles.btn, following && styles.following]} onPress={toggle}>
      <Text variant="footnote" color={following ? "secondary" : "brand"}>
        {following ? "Following" : "Follow"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  following: { borderColor: colors.border.subtle },
});
