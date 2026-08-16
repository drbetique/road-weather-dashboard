"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { URGENCY, urgencyFromLevel } from "@/lib/theme";
import type { Translations } from "@/lib/translations";
import type { Recommendation, UserRole } from "@/types";

interface RecommendationsPanelProps {
  readonly recommendations: readonly Recommendation[];
  readonly loading: boolean;
  readonly role: UserRole;
  readonly t: Translations;
  readonly compact?: boolean;
}

const TREATMENT_ICONS: Readonly<Record<string, string>> = {
  salt_brine: "🧂",
  anti_ice: "❄️",
  plow: "🚛",
  monitor: "👁️",
};

function urgencyLabel(level: number, t: Translations): string {
  if (level >= 4) return t.urgency_CRITICAL;
  if (level >= 3) return t.urgency_URGENT;
  if (level >= 2) return t.urgency_STANDARD;
  return t.urgency_PREVENTIVE;
}

export function RecommendationsPanel({
  recommendations,
  loading,
  t,
  compact = false,
}: RecommendationsPanelProps) {
  // Spread before sorting: the prop is readonly, and toSorted would raise the
  // browser baseline for no benefit here.
  const sorted = [...recommendations]
    .filter((r) => (r.urgency_level ?? 0) >= 1)
    .sort((a, b) => (b.urgency_level ?? 0) - (a.urgency_level ?? 0));

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="mb-2 text-2xl" aria-hidden="true">
          ✓
        </p>
        <p className="text-[10px] tracking-[0.1em] text-urgency-monitor">
          {t.all_roads_ok.toUpperCase()}
        </p>
        <p className="mt-1 text-[9px] text-ink-dim">{t.treatment_none}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {!compact && (
        <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5 text-[9px] uppercase tracking-[0.15em] text-ink-dim">
          <span>{t.action_required}</span>
          <span className="text-urgency-standard">{sorted.length}</span>
        </div>
      )}

      <ul className="flex flex-col gap-1 p-1">
        {sorted.slice(0, compact ? 6 : 20).map((rec) => {
          const level = rec.urgency_level ?? 1;
          const style = URGENCY[urgencyFromLevel(level)] ?? URGENCY.NONE;
          const icon = TREATMENT_ICONS[rec.treatment_type] ?? "⚠️";

          return (
            <li
              key={`${rec.station_id}-${rec.treatment_type}`}
              className={`flex items-center gap-2 border border-line border-l-2 bg-surface-3 px-2.5 py-2 ${style.border}`}
            >
              <span className="shrink-0 text-base" aria-hidden="true">
                {icon}
              </span>

              <div className="min-w-0 flex-1">
                <p className="mb-0.5 truncate text-[10px] font-bold text-ink-bright">
                  {rec.station_name}
                </p>
                <p className="truncate text-[9px] text-ink-dim">
                  {rec.salt_amount_gm2 ? `${rec.salt_amount_gm2} g/m² ` : ""}
                  {rec.treatment_type.replace(/_/g, " ")}
                </p>
              </div>

              <span
                className={`shrink-0 border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] ${style.border} ${style.surface} ${style.text}`}
              >
                {urgencyLabel(level, t)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
