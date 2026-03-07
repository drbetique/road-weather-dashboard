"use client";

import { Translations } from "@/lib/translations";

interface RiskPeriod {
  start: string;
  end: string;
  max_risk_level: number;
  risk_types?: string[];
}

interface Props {
  risks: RiskPeriod[];
  loading: boolean;
  t: Translations;
}

function riskConfig(level: number, t: Translations) {
  if (level >= 4) return { label: t.forecast_critical, color: "var(--red)", bg: "var(--red-dim)", border: "var(--red)" };
  if (level >= 3) return { label: t.risk_high, color: "var(--amber)", bg: "var(--amber-dim)", border: "var(--amber)" };
  if (level >= 2) return { label: t.risk_medium, color: "var(--yellow)", bg: "var(--amber-dim)", border: "var(--yellow)" };
  return { label: t.risk_low, color: "var(--green)", bg: "var(--green-dim)", border: "var(--green)" };
}

function riskTypeLabel(type: string, t: Translations): string {
  if (type === "frost") return t.frost;
  if (type === "ice") return t.ice;
  if (type === "snow") return t.snow;
  return type.replace(/_/g, " ");
}

function fmt(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return dateStr; }
}

export function RiskPeriods({ risks, loading, t }: Props) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{
        padding: "8px 14px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
      }}>
        <span style={{ fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          {t.upcoming_risks}
        </span>
        <span style={{ fontSize: "9px", color: risks.length > 0 ? "var(--amber)" : "var(--green)" }}>
          {risks.length > 0 ? `${risks.length}` : "—"}
        </span>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "8px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {[1, 2].map(i => (
              <div key={i} style={{ height: "50px", background: "var(--bg3)", border: "1px solid var(--border)", animation: "blink 1.5s infinite" }} />
            ))}
          </div>
        ) : risks.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: "var(--green)", letterSpacing: "0.1em" }}>{t.no_risk_periods.toUpperCase()}</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {risks.map((r, i) => {
              const c = riskConfig(r.max_risk_level, t);
              return (
                <div key={i} style={{
                  background: c.bg, border: `1px solid ${c.border}`, padding: "10px 12px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-bright)" }}>
                      {fmt(r.start)} — {fmt(r.end)}
                    </span>
                    <span style={{
                      fontSize: "8px", padding: "2px 6px", textTransform: "uppercase",
                      letterSpacing: "0.1em", fontWeight: 700, color: c.color, border: `1px solid ${c.border}`,
                    }}>
                      {c.label}
                    </span>
                  </div>
                  <div style={{ fontSize: "9px", color: "var(--text-dim)", marginBottom: r.risk_types?.length ? "4px" : 0 }}>
                    {t.apply_salt_before} {fmt(r.start)}
                  </div>
                  {r.risk_types && r.risk_types.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {r.risk_types.map((type, j) => (
                        <span key={j} style={{
                          fontSize: "8px", padding: "1px 5px",
                          background: "rgba(0,0,0,0.3)", color: "var(--text-dim)",
                        }}>
                          {riskTypeLabel(type, t)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
