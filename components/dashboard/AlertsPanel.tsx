"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { Translations } from "@/lib/translations";
import { ACTION_LEVEL, URGENT_LEVEL, urgencyFromLevel, URGENCY } from "@/lib/theme";
import type { Recommendation } from "@/types";

interface AlertsPanelProps {
  readonly recommendations: readonly Recommendation[];
  readonly loading: boolean;
  readonly t: Translations;
}

export function AlertsPanel({ recommendations, loading, t }: AlertsPanelProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-1">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  const actionable = recommendations.filter(
    (r) => Number(r.urgency_level) >= ACTION_LEVEL
  );

  if (actionable.length === 0) {
    return (
      <p className="p-6 text-center text-[10px] text-urgency-monitor">
        ✓ {t.all_roads_ok}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {actionable.map((rec) => {
        const level = Number(rec.urgency_level);
        const style = URGENCY[urgencyFromLevel(level)] ?? URGENCY.NONE;
        const label =
          level >= URGENT_LEVEL ? t.urgency_CRITICAL : t.urgency_URGENT;

        return (
          <li
            key={`${rec.station_id}-${rec.treatment_type}`}
            className={`border-b border-line border-l-2 p-3 ${style.border} ${style.surface}`}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className={`min-w-0 truncate text-[10px] font-bold ${style.text}`}>
                ⚠ {rec.treatment_type?.replace(/_/g, " ").toUpperCase()}
              </span>
              <span
                className={`shrink-0 border px-1.5 py-px text-[8px] uppercase tracking-[0.1em] ${style.border} ${style.surface} ${style.text}`}
              >
                {label}
              </span>
            </div>
            <p className="truncate text-[9px] text-ink-dim">📍 {rec.station_name}</p>
            <p className="mt-0.5 text-[9px] text-ink-dim">
              {rec.salt_amount_gm2} g/m²
            </p>
          </li>
        );
      })}
    </ul>
  );
}
