"use client";

import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { CHART_INK, SERIES } from "@/lib/theme";
import type { Translations } from "@/lib/translations";
import type { ForecastPoint } from "@/types";

interface ForecastChartProps {
  readonly forecast: readonly ForecastPoint[];
  readonly loading: boolean;
  readonly t: Translations;
}

interface TooltipEntry {
  readonly name?: string | number;
  readonly value?: string | number;
  readonly color?: string;
}

interface ForecastTooltipProps {
  readonly active?: boolean;
  readonly payload?: readonly TooltipEntry[];
  readonly label?: string | number;
}

function round1(value: number | null | undefined): number | null {
  return value === null || value === undefined
    ? null
    : Math.round(value * 10) / 10;
}

/**
 * Crosshair tooltip. Values wear ink tokens rather than the series colour; the
 * coloured swatch beside each row carries identity instead.
 */
function ForecastTooltip({ active, payload, label }: ForecastTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="border border-line-strong bg-surface-2 px-3 py-2">
      <p className="mb-1 text-[9px] text-ink-dim">{label}</p>
      {payload.map((entry) => (
        <p
          key={String(entry.name)}
          className="mb-0.5 flex items-center gap-1.5 text-[11px] text-ink"
        >
          <span
            aria-hidden="true"
            className="inline-block size-2 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: {entry.value}°C
        </p>
      ))}
    </div>
  );
}

export function ForecastChart({ forecast, loading, t }: ForecastChartProps) {
  const data = forecast.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    temperature: round1(point.temperature),
    dew_point: round1(point.dew_point),
  }));

  const tick = {
    fill: CHART_INK.axis,
    fontSize: 8,
    fontFamily: "Space Mono",
  } as const;

  return (
    <section className="flex h-full min-h-56 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-3.5 py-2">
        <h2 className="text-[9px] uppercase tracking-[0.15em] text-ink-dim">
          {t.forecast_24h}
        </h2>
        <span className="truncate text-[9px] text-ink-dim">
          {t.chart_subtitle}
        </span>
      </header>

      {loading ? (
        <div className="flex-1 p-3">
          <Skeleton className="size-full" />
        </div>
      ) : (
        <div className="min-h-0 flex-1 pt-2 pr-1 pb-1 pl-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="time"
                tick={tick}
                tickLine={false}
                axisLine={{ stroke: CHART_INK.grid }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={tick}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => `${value}°`}
              />
              <Tooltip content={<ForecastTooltip />} />
              <ReferenceLine
                y={0}
                stroke={SERIES.thisWeek}
                strokeDasharray="4 2"
                strokeWidth={1}
                opacity={0.6}
                label={{
                  value: t.freezing_point,
                  fill: CHART_INK.axis,
                  fontSize: 8,
                }}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke={SERIES.airTemp}
                strokeWidth={2}
                dot={false}
                name={t.temperature}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="dew_point"
                stroke={SERIES.roadTemp}
                strokeWidth={2}
                dot={false}
                strokeDasharray="3 2"
                name={t.dew_point}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
