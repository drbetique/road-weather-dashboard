"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { Translations } from "@/lib/translations";
import type { WeatherReading } from "@/types";

interface SensorPanelProps {
  readonly readings: readonly WeatherReading[];
  readonly loading: boolean;
  readonly t: Translations;
}

/** Below this coefficient the surface is treated as slippery. */
const FRICTION_CRITICAL = 0.3;

const LABEL = "text-[8px] uppercase tracking-[0.1em] text-ink-dim";

function SensorCardSkeleton() {
  return (
    <div className="border border-line bg-surface-3 p-3">
      <Skeleton className="h-3 w-2/3" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Skeleton className="h-6" />
        <Skeleton className="h-6" />
      </div>
      <Skeleton className="mt-3 h-4 w-1/2" />
    </div>
  );
}

export function SensorPanel({ readings, loading, t }: SensorPanelProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <SensorCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {readings.slice(0, 8).map((reading) => {
        const slippery =
          reading.friction !== null && reading.friction < FRICTION_CRITICAL;

        return (
          <article
            key={reading.station_id}
            className="border border-line bg-surface-3 p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="min-w-0 truncate text-[10px] font-bold text-ink-bright">
                {reading.station_name}
              </h3>
              <span className="shrink-0 border border-urgency-monitor bg-urgency-monitor-soft px-1.5 py-0.5 text-[8px] uppercase tracking-[0.1em] text-urgency-monitor">
                ONLINE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <div className={LABEL}>{t.air_temp}</div>
                <div
                  className={`text-sm font-bold ${
                    reading.air_temp !== null && reading.air_temp <= 0
                      ? "text-accent"
                      : "text-urgency-standard"
                  }`}
                >
                  {reading.air_temp !== null ? `${reading.air_temp}°C` : "—"}
                </div>
              </div>
              <div>
                <div className={LABEL}>{t.road_temp}</div>
                <div
                  className={`text-sm font-bold ${
                    reading.road_temp !== null && reading.road_temp <= 0
                      ? "text-urgency-critical"
                      : "text-ink-bright"
                  }`}
                >
                  {reading.road_temp !== null ? `${reading.road_temp}°C` : "—"}
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2">
              <span
                className={`min-w-0 truncate border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${
                  slippery
                    ? "border-urgency-critical bg-urgency-critical-soft text-urgency-critical"
                    : "border-urgency-monitor bg-urgency-monitor-soft text-urgency-monitor"
                }`}
              >
                {reading.road_condition_text ?? t.no_sensor}
              </span>
              <span className="shrink-0 text-[9px] text-ink-dim">
                μ = {reading.friction ?? "—"}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
