"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { Translations } from "@/lib/translations";
import type { DashboardSummary } from "@/types";

interface KPICardsProps {
  readonly summary: DashboardSummary | null;
  readonly loading: boolean;
  readonly t: Translations;
}

/** Accent utilities per card, drawn from the validated urgency scale. */
type Accent =
  | "text-accent"
  | "text-urgency-preventive"
  | "text-urgency-standard"
  | "text-urgency-urgent"
  | "text-urgency-critical"
  | "text-urgency-monitor";

interface Card {
  readonly label: string;
  readonly value: string;
  readonly sub: string;
  readonly accent: Accent;
  readonly rule: string;
  readonly trend: string;
  readonly trendUp: boolean;
}

/** Long strings need to step down or they overflow the tile on a phone. */
function valueSize(value: string): string {
  if (value.length > 10) return "text-[13px]";
  if (value.length > 6) return "text-base";
  return "text-2xl sm:text-[28px]";
}

export function KPICards({ summary, loading, t }: KPICardsProps) {
  const riskLevel = summary?.forecast_risk_level ?? 0;
  const treatmentCount = summary?.treatment_needed_count ?? 0;
  const criticalCount = summary?.critical_count ?? 0;
  const priorityStation = summary?.priority_station ?? null;

  const riskLabel =
    riskLevel >= 4
      ? t.forecast_critical
      : riskLevel >= 3
        ? t.forecast_high
        : riskLevel >= 2
          ? t.forecast_moderate
          : riskLevel >= 1
            ? t.forecast_low
            : t.forecast_safe;

  const riskAccent: Accent =
    riskLevel >= 4
      ? "text-urgency-critical"
      : riskLevel >= 3
        ? "text-urgency-urgent"
        : riskLevel >= 2
          ? "text-urgency-preventive"
          : "text-urgency-monitor";

  const riskRule =
    riskLevel >= 4
      ? "bg-urgency-critical"
      : riskLevel >= 3
        ? "bg-urgency-urgent"
        : riskLevel >= 2
          ? "bg-urgency-preventive"
          : "bg-urgency-monitor";

  const cards: readonly Card[] = [
    {
      label: t.stations_monitored,
      value: String(summary?.stations_count ?? 0),
      sub: t.stations_subtitle,
      accent: "text-accent",
      rule: "bg-accent",
      trend: "100% uptime",
      trendUp: false,
    },
    {
      label: t.treatment_needed,
      value: String(treatmentCount),
      sub: t.treatment_subtitle,
      accent: "text-urgency-standard",
      rule: "bg-urgency-standard",
      trend: treatmentCount > 0 ? `+${treatmentCount}` : t.urgency_NONE,
      trendUp: treatmentCount > 0,
    },
    {
      label: t.act_now,
      value: String(criticalCount),
      sub: t.act_now_subtitle,
      accent: criticalCount > 0 ? "text-urgency-critical" : "text-urgency-monitor",
      rule: criticalCount > 0 ? "bg-urgency-critical" : "bg-urgency-monitor",
      trend: criticalCount > 0 ? t.urgency_CRITICAL : t.urgency_NONE,
      trendUp: criticalCount > 0,
    },
    {
      label: t.tonight_conditions,
      value: riskLabel,
      sub: `${t.forecast_subtitle} · ${riskLevel}/5`,
      accent: riskAccent,
      rule: riskRule,
      trend: riskLevel >= 3 ? t.forecast_high : t.forecast_safe,
      trendUp: riskLevel >= 3,
    },
    {
      label: t.priority_alert,
      value: priorityStation ?? "—",
      sub: t.stations_require_attention,
      accent: priorityStation ? "text-urgency-critical" : "text-urgency-monitor",
      rule: priorityStation ? "bg-urgency-critical" : "bg-urgency-monitor",
      trend: priorityStation ? t.urgency_URGENT : t.urgency_NONE,
      trendUp: Boolean(priorityStation),
    },
  ] as const satisfies readonly Card[];

  return (
    <div className="grid shrink-0 grid-cols-2 border-b border-line sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card, index) => (
        <article
          key={card.label}
          className={`relative min-w-0 overflow-hidden border-line p-3.5 ${
            index < cards.length - 1 ? "border-r" : ""
          } border-b sm:border-b-0`}
        >
          <span
            aria-hidden="true"
            className={`absolute inset-x-0 bottom-0 h-0.5 ${card.rule} ${
              loading ? "opacity-30" : "opacity-100"
            }`}
          />

          <h2 className="mb-1.5 truncate text-[9px] uppercase tracking-[0.15em] text-ink-dim">
            {card.label}
          </h2>

          {loading ? (
            <Skeleton className="mb-1 h-7 w-3/4" />
          ) : (
            <p
              className={`mb-1 truncate font-extrabold leading-none ${valueSize(card.value)} ${card.accent}`}
            >
              {card.value}
            </p>
          )}

          <p className="mb-1 truncate text-[9px] text-ink-dim">{card.sub}</p>
          <p
            className={`mt-0.5 truncate text-[9px] ${
              card.trendUp ? "text-urgency-critical" : "text-urgency-monitor"
            }`}
          >
            {card.trendUp ? "▲" : "▼"} {card.trend}
          </p>
        </article>
      ))}
    </div>
  );
}
