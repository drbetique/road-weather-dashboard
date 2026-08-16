/**
 * Design-token bridge.
 *
 * Tailwind utilities cover markup, but Recharts takes raw colour strings as
 * props, so each token is exposed in both forms from one place. Keeping the two
 * side by side is what stops a chart series and its legend chip drifting apart.
 */

export const URGENCY_NAMES = [
  "NONE",
  "MONITOR",
  "PREVENTIVE",
  "STANDARD",
  "URGENT",
  "CRITICAL",
] as const;

export type UrgencyName = (typeof URGENCY_NAMES)[number];

interface UrgencyStyle {
  /** Foreground utility for text and icons. */
  readonly text: string;
  /** Tinted surface for pills and row highlights. */
  readonly surface: string;
  /** Border utility, used for the left rule on alert rows. */
  readonly border: string;
  /** Raw hex, for Recharts props that cannot take a class. */
  readonly hex: string;
}

/**
 * Severity styling.
 *
 * NONE and MONITOR mean "no action required" and stay deliberately recessive.
 * PREVENTIVE through CRITICAL form a monotonic lightness ramp, so the order is
 * legible even to a viewer who cannot separate the hues.
 */
export const URGENCY: Readonly<Record<UrgencyName, UrgencyStyle>> = {
  NONE: {
    text: "text-urgency-none",
    surface: "bg-urgency-none-soft",
    border: "border-urgency-none",
    hex: "#8296a8",
  },
  MONITOR: {
    text: "text-urgency-monitor",
    surface: "bg-urgency-monitor-soft",
    border: "border-urgency-monitor",
    hex: "#5fc4de",
  },
  PREVENTIVE: {
    text: "text-urgency-preventive",
    surface: "bg-urgency-preventive-soft",
    border: "border-urgency-preventive",
    hex: "#f5d274",
  },
  STANDARD: {
    text: "text-urgency-standard",
    surface: "bg-urgency-standard-soft",
    border: "border-urgency-standard",
    hex: "#f0a34a",
  },
  URGENT: {
    text: "text-urgency-urgent",
    surface: "bg-urgency-urgent-soft",
    border: "border-urgency-urgent",
    hex: "#e8724e",
  },
  CRITICAL: {
    text: "text-urgency-critical",
    surface: "bg-urgency-critical-soft",
    border: "border-urgency-critical",
    hex: "#e35a50",
  },
};

/** Falls back to NONE for an unrecognised name rather than rendering unstyled. */
export function urgencyStyle(name: string | null | undefined): UrgencyStyle {
  return URGENCY[name as UrgencyName] ?? URGENCY.NONE;
}

/**
 * Maps the API's numeric urgency_level onto the scale. Levels at or above 4 are
 * the ones the dashboard treats as requiring immediate attention.
 */
export function urgencyFromLevel(level: number): UrgencyName {
  return URGENCY_NAMES[Math.min(Math.max(Math.trunc(level), 0), 5)] ?? "NONE";
}

export const URGENT_LEVEL = 4;
export const ACTION_LEVEL = 3;

/**
 * Categorical chart series, assigned in fixed order and never cycled. These
 * hues sit outside the warm range reserved for urgency, so a series can never
 * be mistaken for a severity state.
 */
export const SERIES = {
  airTemp: "#3987e5",
  roadTemp: "#199e70",
  lastWeek: "#9085e9",
  thisWeek: "#d55181",
} as const;

/** Recessive chart furniture. */
export const CHART_INK = {
  grid: "#1e2d3d",
  axis: "#8299ad",
  surface: "#0d1219",
} as const;
