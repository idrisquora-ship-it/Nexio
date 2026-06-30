import { Pressable, StyleSheet, View } from "react-native";
import { Text, TextField } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";
import { formatPrice, type PackageInput } from "../api/marketplaceApi";

interface PackageTierFormProps {
  pkg: PackageInput;
  currency?: string;
  onChange: (next: PackageInput) => void;
  required?: boolean;
}

export function PackageTierForm({ pkg, currency = "USD", onChange, required }: PackageTierFormProps) {
  const tierLabel = pkg.tier.charAt(0).toUpperCase() + pkg.tier.slice(1);
  const active = required || pkg.enabled;

  return (
    <View style={[styles.card, active && styles.cardActive]}>
      <View style={styles.header}>
        <Text variant="headline">{tierLabel}</Text>
        {!required ? (
          <Pressable onPress={() => onChange({ ...pkg, enabled: !pkg.enabled })}>
            <Text variant="footnote" color="brand">
              {pkg.enabled ? "Remove" : "Add tier"}
            </Text>
          </Pressable>
        ) : (
          <Text variant="footnote" muted>
            Required
          </Text>
        )}
      </View>

      {active ? (
        <View style={styles.fields}>
          <TextField
            label="Price (USD)"
            value={pkg.priceCents ? String(pkg.priceCents / 100) : ""}
            onChangeText={(v) => {
              const dollars = parseFloat(v.replace(/[^0-9.]/g, "")) || 0;
              onChange({ ...pkg, priceCents: Math.round(dollars * 100), enabled: true });
            }}
            keyboardType="decimal-pad"
            placeholder="49.00"
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <TextField
                label="Delivery (days)"
                value={String(pkg.deliveryDays)}
                onChangeText={(v) => onChange({ ...pkg, deliveryDays: parseInt(v, 10) || 1 })}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.half}>
              <TextField
                label="Revisions"
                value={String(pkg.revisions)}
                onChangeText={(v) => onChange({ ...pkg, revisions: parseInt(v, 10) || 0 })}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <TextField
            label="What's included"
            value={pkg.description}
            onChangeText={(v) => onChange({ ...pkg, description: v })}
            multiline
          />
          <TextField
            label="Features (comma-separated)"
            value={pkg.features.join(", ")}
            onChangeText={(v) =>
              onChange({
                ...pkg,
                features: v.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
          {pkg.priceCents > 0 ? (
            <Text variant="footnote" muted>
              Preview: {formatPrice(pkg.priceCents, currency)}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background.secondary,
    gap: spacing.sm,
  },
  cardActive: {
    backgroundColor: colors.surface.card,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fields: { gap: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm },
  half: { flex: 1 },
});
