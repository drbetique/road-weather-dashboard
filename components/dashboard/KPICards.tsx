"use client";

import { DashboardSummary } from "@/types";
import { Translations } from "@/lib/translations";

interface Props {
  summary: DashboardSummary | null;
  loading: boolean;
  t: Translations;
}

export function KPICards({ summary, loading, t }: Props) {
  const riskLevel = summary?.forecast_risk_level ?? 0;
  const riskLabel = riskLevel >= 4 ? t.forecast_critical
    : riskLevel >= 3 ? t.forecast_high
    : riskLevel >= 2 ? t.forecast_moderate
    : riskLevel >= 1 ? t.forecast_low
    : t.forecast_safe;
  const riskColor = riskLevel >= 4 ? "var(--red)"
    : riskLevel >= 3 ? "var(--amber)"
    : riskLevel >= 2 ? "var(--yellow)"
    : "var(--green)";

  const cards = [
    {
      label: t.stations_monitored,
      value: loading ? "—" : String(summary?.stations_count ?? 0),
      sub: t.stations_subtitle,
      accent: "var(--cyan)",
      trend: "100% uptime",
      trendUp: false,
    },
    {
      label: t.treatment_needed,
      value: loading ? "—" : String(summary?.treatment_needed_count ?? 0),
      sub: t.treatment_subtitle,
      accent: "var(--amber)",
      trend: (summary?.treatment_needed_count ?? 0) > 0
        ? `+${summary?.treatment_needed_count}`
        : t.urgency_NONE,
      trendUp: (summary?.treatment_needed_count ?? 0) > 0,
    },
    {
      label: t.act_now,
      value: loading ? "—" : String(summary?.critical_count ?? 0),
      sub: t.act_now_subtitle,
      accent: (summary?.critical_count ?? 0) > 0 ? "var(--red)" : "var(--green)",
      trend: (summary?.critical_count ?? 0) > 0 ? t.urgency_CRITICAL : t.urgency_NONE,
      trendUp: (summary?.critical_count ?? 0) > 0,
    },
    {
      label: t.tonight_conditions,
      value: loading ? "—" : riskLabel,
      sub: `${t.forecast_subtitle} · ${riskLevel}/5`,
      accent: riskColor,
      trend: riskLevel >= 3 ? t.forecast_high : t.forecast_safe,
      trendUp: riskLevel >= 3,
    },
    {
      label: t.priority_alert,
      value: loading ? "—" : summary?.priority_station ?? "—",
      sub: t.stations_require_attention,
      accent: summary?.priority_station ? "var(--red)" : "var(--green)",
      trend: summary?.priority_station ? t.urgency_URGENT : t.urgency_NONE,
      trendUp: !!summary?.priority_station,
    },
  ];

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
      borderBottom: "1px solid var(--border)", flexShrink: 0,
    }}>
      {cards.map((card, i) => (
        <div key={i} style={{
          padding: "14px 16px",
          borderRight: i < cards.length - 1 ? "1px solid var(--border)" : "none",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "2px",
            background: card.accent, opacity: loading ? 0.3 : 1,
          }} />
          <div style={{ fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "6px" }}>
            {card.label}
          </div>
          <div style={{
            fontFamily: "Syne, sans-serif",
            fontSize: card.value.length > 10 ? "13px" : card.value.length > 6 ? "16px" : "28px",
            fontWeight: 800,
            color: loading ? "var(--text-dim)" : card.accent,
            lineHeight: 1, marginBottom: "4px", transition: "color 0.3s",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {loading ? <span style={{ animation: "blink 1.5s infinite", display: "inline-block" }}>——</span> : card.value}
          </div>
          <div style={{ fontSize: "9px", color: "var(--text-dim)", marginBottom: "4px" }}>{card.sub}</div>
          <div style={{ fontSize: "9px", color: card.trendUp ? "var(--red)" : "var(--green)", marginTop: "2px" }}>
            {card.trendUp ? "▲" : "▼"} {card.trend}
          </div>
        </div>
      ))}
    </div>
  );
}
