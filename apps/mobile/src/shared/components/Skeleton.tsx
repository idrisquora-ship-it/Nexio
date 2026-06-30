import { View, StyleSheet, ViewStyle } from "react-native";
import { colors, radius } from "../theme";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 16, style }: SkeletonProps) {
  return <View style={[styles.base, { width, height }, style]} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.sm,
  },
});
