import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Plus } from "lucide-react-native";
import { Avatar, Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";
import type { StoryTrayUser } from "../api/updatesApi";

interface StoryRingProps {
  tray: StoryTrayUser[];
  currentUserId?: string;
  onAddStory: () => void;
  onOpenUser: (userId: string) => void;
}

export function StoryRing({ tray, currentUserId, onAddStory, onOpenUser }: StoryRingProps) {
  const selfTray = tray.find((t) => t.userId === currentUserId);
  const others = tray.filter((t) => t.userId !== currentUserId);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Pressable style={styles.item} onPress={onAddStory}>
        <View style={[styles.ring, styles.addRing]}>
          <Plus color={colors.brand.primary} size={24} />
        </View>
        <Text variant="caption" style={styles.label} numberOfLines={1}>
          Your story
        </Text>
      </Pressable>

      {selfTray ? (
        <Pressable style={styles.item} onPress={() => onOpenUser(selfTray.userId)}>
          <View style={[styles.ring, selfTray.hasUnviewed ? styles.unviewed : styles.viewed]}>
            <Avatar uri={selfTray.avatarUrl} name={selfTray.displayName} size={56} />
          </View>
          <Text variant="caption" style={styles.label} numberOfLines={1}>
            You
          </Text>
        </Pressable>
      ) : null}

      {others.map((user) => (
        <Pressable key={user.userId} style={styles.item} onPress={() => onOpenUser(user.userId)}>
          <View style={[styles.ring, user.hasUnviewed ? styles.unviewed : styles.viewed]}>
            <Avatar uri={user.avatarUrl} name={user.displayName} size={56} />
          </View>
          <Text variant="caption" style={styles.label} numberOfLines={1}>
            {user.displayName}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.md, gap: spacing.md, paddingVertical: spacing.sm },
  item: { width: 72, alignItems: "center", gap: spacing.xxs },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  unviewed: { borderColor: colors.brand.primary },
  viewed: { borderColor: colors.border.subtle },
  addRing: { borderColor: colors.border.subtle, backgroundColor: colors.background.secondary },
  label: { textAlign: "center" },
});
