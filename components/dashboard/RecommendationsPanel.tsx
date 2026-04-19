"use client";

import { Recommendation } from "@/types";
import { Translations } from "@/lib/translations";

interface Props {
  recommendations: Recommendation[];
  loading: boolean;
  role: string;
  t: Translations;
  compact?: boolean;
}

function urgencyConfig(level: number, t: Translations) {
  if (level >= 4) return { label: t.urgency_CRITICAL, color: "var(--red)", bg: "var(--red-dim)", border: "var(--red)" };
  if (level >= 3) return { label: t.urgency_URGENT, color: "var(--amber)", bg: "var(--amber-dim)", border: "var(--amber)" };
  if (level >= 2) return { label: t.urgency_STANDARD, color: "var(--yellow)", bg: "var(--amber-dim)", border: "var(--yellow)" };
  return { label: t.urgency_PREVENTIVE, color: "var(--cyan)", bg: "var(--cyan-dim)", border: "var(--cyan)" };
}

const treatmentIcons: Record<string, string> = {
  salt_brine: "🧂",
  anti_ice: "❄️",
  plow: "🚛",
  monitor: "👁️",
};

export function RecommendationsPanel({ recommendations, loading, role, t, compact }: Props) {
  const sorted = [...recommendations]
  .filter((r) => (r.urgency_level ?? 0) >= 1)
  .sort((a, b) => (b.urgency_level ?? 0) - (a.urgency_level ?? 0));

  if (loading) return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ height: "60px", background: "var(--bg3)", border: "1px solid var(--border)", animation: "blink 1.5s infinite" }} />
      ))}
    </div>
  );

  if (sorted.length === 0) return (
    <div style={{ padding: "32px", textAlign: "center" }}>
      <div style={{ fontSize: "24px", marginBottom: "8px" }}>✓</div>
      <div style={{ fontSize: "10px", color: "var(--green)", letterSpacing: "0.1em" }}>{t.all_roads_ok.toUpperCase()}</div>
      <div style={{ fontSize: "9px", color: "var(--text-dim)", marginTop: "4px" }}>{t.treatment_none}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {!compact && (
        <div style={{
          padding: "10px 14px", borderBottom: "1px solid var(--border)",
          fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", textTransform: "uppercase",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>{t.action_required}</span>
          <span style={{ color: "var(--amber)" }}>{sorted.length}</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "4px" }}>
        {sorted.slice(0, compact ? 6 : 20).map((rec, i) => {
          const c = urgencyConfig(rec.urgency_level ?? 1, t);
          const icon = treatmentIcons[rec.treatment_type ?? ""] ?? "⚠️";
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 10px", background: "var(--bg3)",
              border: "1px solid var(--border)", borderLeft: `2px solid ${c.border}`,
            }}>
              <span style={{ fontSize: "16px", flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "10px", color: "var(--text-bright)", fontWeight: 700, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {rec.station_name}
                </div>
                <div style={{ fontSize: "9px", color: "var(--text-dim)" }}>
                  {rec.salt_amount_gm2 ? `${rec.salt_amount_gm2} g/m²` : ""} {rec.treatment_type?.replace(/_/g, " ")}
                </div>
              </div>
              <span style={{
                fontSize: "8px", padding: "2px 6px", textTransform: "uppercase",
                letterSpacing: "0.08em", fontWeight: 700, flexShrink: 0,
                background: c.bg, color: c.color, border: `1px solid ${c.border}`,
              }}>
                {c.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
