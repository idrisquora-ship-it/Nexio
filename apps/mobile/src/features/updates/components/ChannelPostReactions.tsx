import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";

export const CHANNEL_REACTION_EMOJIS = ["👍", "❤️", "🔥", "😂"] as const;

export type ReactionSummary = {
  emoji: string;
  count: number;
  reacted: boolean;
};

interface ChannelPostReactionsProps {
  summaries: ReactionSummary[];
  onReact: (emoji: string) => void;
  disabled?: boolean;
}

export function ChannelPostReactions({ summaries, onReact, disabled }: ChannelPostReactionsProps) {
  return (
    <View style={styles.wrap}>
      {CHANNEL_REACTION_EMOJIS.map((emoji) => {
        const summary = summaries.find((s) => s.emoji === emoji);
        const active = summary?.reacted ?? false;
        const count = summary?.count ?? 0;
        return (
          <Pressable
            key={emoji}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onReact(emoji)}
            disabled={disabled}
          >
            <Text variant="footnote">{emoji}</Text>
            {count > 0 ? (
              <Text variant="caption" muted={!active}>
                {count}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primaryMuted,
  },
});
