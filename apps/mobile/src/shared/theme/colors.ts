export const colors = {
  background: {
    primary: "#0A0A0B",
    secondary: "#141416",
    tertiary: "#1C1C1F",
  },
  surface: {
    card: "#1A1A1D",
    cardHover: "#222226",
    sheet: "#1E1E22",
  },
  brand: {
    primary: "#FA2D48",
    primaryMuted: "#FA2D4820",
    accent: "#FF6B8A",
  },
  semantic: {
    success: "#34C759",
    warning: "#FF9F0A",
    error: "#FF453A",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "#8E8E93",
    tertiary: "#636366",
    inverse: "#0A0A0B",
    link: "#FA2D48",
  },
  border: {
    subtle: "#FFFFFF10",
    default: "#FFFFFF18",
    focus: "#FA2D48",
  },
  overlay: {
    scrim: "#00000080",
  },
} as const;

export type ColorToken = typeof colors;
