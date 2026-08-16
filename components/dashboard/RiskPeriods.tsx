"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { Translations } from "@/lib/translations";

interface RiskPeriod {
  readonly start: string;
  readonly end: string;
  readonly max_risk_level: number;
  readonly risk_types?: readonly string[];
}

interface RiskPeriodsProps {
  readonly risks: readonly RiskPeriod[];
  readonly loading: boolean;
  readonly t: Translations;
}

interface RiskStyle {
  readonly label: string;
  readonly text: string;
  readonly surface: string;
  readonly border: string;
}

/** Risk level shares the urgency ramp, so severity reads the same everywhere. */
function riskStyle(level: number, t: Translations): RiskStyle {
  if (level >= 4) {
    return {
      label: t.forecast_critical,
      text: "text-urgency-critical",
      surface: "bg-urgency-critical-soft",
      border: "border-urgency-critical",
    };
  }
  if (level >= 3) {
    return {
      label: t.risk_high,
      text: "text-urgency-urgent",
      surface: "bg-urgency-urgent-soft",
      border: "border-urgency-urgent",
    };
  }
  if (level >= 2) {
    return {
      label: t.risk_medium,
      text: "text-urgency-preventive",
      surface: "bg-urgency-preventive-soft",
      border: "border-urgency-preventive",
    };
  }
  return {
    label: t.risk_low,
    text: "text-urgency-monitor",
    surface: "bg-urgency-monitor-soft",
    border: "border-urgency-monitor",
  };
}

function riskTypeLabel(type: string, t: Translations): string {
  if (type === "frost") return t.frost;
  if (type === "ice") return t.ice;
  if (type === "snow") return t.snow;
  return type.replace(/_/g, " ");
}

function formatTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function RiskPeriods({ risks, loading, t }: RiskPeriodsProps) {
  return (
    <section className="flex h-full min-h-56 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-3.5 py-2">
        <h2 className="text-[9px] uppercase tracking-[0.15em] text-ink-dim">
          {t.upcoming_risks}
        </h2>
        <span
          className={`text-[9px] ${
            risks.length > 0 ? "text-urgency-standard" : "text-urgency-monitor"
          }`}
        >
          {risks.length > 0 ? risks.length : "—"}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-2">
        {loading ? (
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : risks.length === 0 ? (
          <p className="p-6 text-center text-[10px] tracking-[0.1em] text-urgency-monitor">
            {t.no_risk_periods.toUpperCase()}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {risks.map((risk) => {
              const style = riskStyle(risk.max_risk_level, t);
              return (
                <li
                  key={`${risk.start}-${risk.end}`}
                  className={`border p-3 ${style.border} ${style.surface}`}
                >
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-ink-bright">
                      {formatTime(risk.start)} — {formatTime(risk.end)}
                    </span>
                    <span
                      className={`shrink-0 border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] ${style.border} ${style.text}`}
                    >
                      {style.label}
                    </span>
                  </div>

                  <p className="text-[9px] text-ink-dim">
                    {t.apply_salt_before} {formatTime(risk.start)}
                  </p>

                  {risk.risk_types && risk.risk_types.length > 0 && (
                    <ul className="mt-1 flex flex-wrap gap-1">
                      {risk.risk_types.map((type) => (
                        <li
                          key={type}
                          className="bg-surface px-1.5 py-px text-[8px] text-ink-dim"
                        >
                          {riskTypeLabel(type, t)}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
