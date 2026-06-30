import { StyleSheet, View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { Card, Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";

export type AnalyticsPoint = {
  label: string;
  orders: number;
  revenue_cents: number;
};

type Props = {
  title: string;
  points: AnalyticsPoint[];
};

export function AnalyticsChart({ title, points }: Props) {
  if (!points.length) {
    return (
      <Card style={styles.card}>
        <Text variant="headline">{title}</Text>
        <Text variant="footnote" muted>
          Not enough data yet — complete orders to see trends.
        </Text>
      </Card>
    );
  }

  const maxOrders = Math.max(...points.map((p) => p.orders), 1);
  const width = 320;
  const height = 160;
  const barWidth = Math.max(12, Math.floor(width / points.length) - 8);

  return (
    <Card style={styles.card}>
      <Text variant="headline">{title}</Text>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {points.map((point, index) => {
          const barHeight = (point.orders / maxOrders) * (height - 30);
          const x = index * (barWidth + 8) + 8;
          const y = height - barHeight - 20;
          return (
            <Rect
              key={`${point.label}-${index}`}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={colors.brand.primary}
            />
          );
        })}
        {points.map((point, index) => {
          const x = index * (barWidth + 8) + 8 + barWidth / 2;
          return (
            <SvgText
              key={`label-${point.label}-${index}`}
              x={x}
              y={height - 4}
              fontSize="8"
              fill={colors.text.secondary}
              textAnchor="middle"
            >
              {point.label.slice(5)}
            </SvgText>
          );
        })}
      </Svg>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
});
