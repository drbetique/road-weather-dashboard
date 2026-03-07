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
  const riskColor = riskLevel >= 4 ? "var(--red)" : riskLevel >= 3 ? "var(--amber)" : riskLevel >= 2 ? "var(--yellow)" : "var(--green)";

  const cards = [
    {
      label: t.stations_monitored,
      value: loading ? "—" : String(summary?.total_stations ?? 0),
      sub: t.stations_subtitle,
      accent: "var(--cyan)",
      trend: "100% uptime",
      trendUp: false,
    },
    {
      label: t.treatment_needed,
      value: loading ? "—" : String(summary?.stations_needing_treatment ?? 0),
      sub: t.treatment_subtitle,
      accent: "var(--amber)",
      trend: (summary?.stations_needing_treatment ?? 0) > 0
        ? `+${summary?.stations_needing_treatment}`
        : t.all_roads_ok.split(" ").slice(0, 3).join(" "),
      trendUp: (summary?.stations_needing_treatment ?? 0) > 0,
    },
    {
      label: t.act_now,
      value: loading ? "—" : String(summary?.critical_stations ?? 0),
      sub: t.act_now_subtitle,
      accent: (summary?.critical_stations ?? 0) > 0 ? "var(--red)" : "var(--green)",
      trend: (summary?.critical_stations ?? 0) > 0 ? t.urgency_CRITICAL : t.urgency_NONE,
      trendUp: (summary?.critical_stations ?? 0) > 0,
    },
    {
      label: "Avg Road Temp",
      value: loading ? "—" : summary?.avg_road_temp !== undefined && summary.avg_road_temp !== null
        ? `${summary.avg_road_temp.toFixed(1)}°`
        : "—",
      sub: "°C surface avg",
      accent: "var(--cyan)",
      trend: (summary?.avg_road_temp ?? 0) < 0 ? t.road_dangerous : t.road_good,
      trendUp: (summary?.avg_road_temp ?? 0) < 0,
    },
    {
      label: t.tonight_conditions,
      value: loading ? "—" : riskLabel,
      sub: `${t.forecast_subtitle} · ${riskLevel}/5`,
      accent: riskColor,
      trend: riskLevel >= 3 ? t.forecast_high : t.forecast_safe,
      trendUp: riskLevel >= 3,
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
            fontSize: card.value.length > 6 ? "16px" : "28px",
            fontWeight: 800,
            color: loading ? "var(--text-dim)" : card.accent,
            lineHeight: 1, marginBottom: "4px", transition: "color 0.3s",
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
