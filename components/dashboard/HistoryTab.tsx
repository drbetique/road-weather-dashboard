"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/components/providers/Providers";
import { API_BASE } from "@/lib/api";
import { useLiveRefresh } from "@/lib/useLiveRefresh";
import { CHART_INK, SERIES, URGENCY, type UrgencyName } from "@/lib/theme";

/* -------------------------------------------------------------------------
   API response shapes.

   These mirror the aggregate rows returned by /api/weather/history,
   /api/treatments/history, /api/risks/history and /api/weather/compare.
   Numeric columns are nullable because Postgres AVG/MIN over an empty
   window yields NULL, and the no-database path returns nulls by design.
------------------------------------------------------------------------- */

interface WeatherHistoryRow {
  readonly date: string;
  readonly station_id: number;
  readonly station_name: string;
  readonly avg_air_temp: number | null;
  readonly min_air_temp: number | null;
  readonly max_air_temp: number | null;
  readonly avg_road_temp: number | null;
  readonly min_road_temp: number | null;
  readonly reading_count: number;
}

interface TreatmentHistoryRow {
  readonly date: string;
  readonly urgency_name: string;
  readonly count: number;
  readonly avg_confidence: number | null;
}

interface RiskHistoryRow {
  readonly date: string;
  readonly urgent_count: number;
  readonly critical_count: number;
  readonly total_count: number;
}

interface ComparisonRow {
  readonly day_of_week: string;
  readonly this_week_avg_air: number | null;
  readonly this_week_min_road: number | null;
  readonly last_week_avg_air: number | null;
  readonly last_week_min_road: number | null;
}

/** Shapes derived for the charts, after aggregating the API rows. */
interface TempPoint {
  readonly date: string;
  readonly avg_air: number | null;
  readonly avg_road: number | null;
}

type TreatmentPoint = { date: string } & Partial<Record<UrgencyName, number>>;

type RiskPoint = Omit<RiskHistoryRow, "date"> & { date: string };

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<T>;
}

function toYMD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toYMD(d);
}

const AXIS = {
  tick: { fontSize: 9, fontFamily: "Space Mono, monospace", fill: CHART_INK.axis },
  axisLine: { stroke: CHART_INK.grid },
  tickLine: false as const,
};

const TOOLTIP = {
  contentStyle: {
    background: CHART_INK.surface,
    border: "1px solid #243447",
    borderRadius: "0",
    fontSize: "10px",
    fontFamily: "Space Mono, monospace",
    color: "#c8d8e8",
  },
  labelStyle: { color: CHART_INK.axis },
};

/** Stacked urgency bars, ordered so severity reads bottom-up. */
const STACKED_URGENCIES = [
  "URGENT",
  "STANDARD",
  "PREVENTIVE",
  "MONITOR",
] as const satisfies readonly UrgencyName[];

const PRESETS = [7, 14, 30] as const;

interface ChartBoxProps {
  readonly title: string;
  readonly subtitle: string;
  readonly loading: boolean;
  readonly children: React.ReactNode;
}

function ChartBox({ title, subtitle, loading, children }: ChartBoxProps) {
  return (
    <section className="border border-line bg-surface-2 p-4">
      <header className="mb-2.5">
        <h3 className="text-[10px] uppercase tracking-[0.15em] text-ink-dim">
          {title}
        </h3>
        <p className="mt-0.5 text-[9px] text-ink-dim opacity-70">{subtitle}</p>
      </header>
      {loading ? <Skeleton className="h-45 w-full" /> : children}
    </section>
  );
}

export function HistoryTab() {
  const { lang } = useLang();
  const fi = lang === "fi";

  const [preset, setPreset] = useState<number | null>(7);
  const [startDate, setStartDate] = useState(daysAgo(7));
  const [endDate, setEndDate] = useState(toYMD(new Date()));
  const [applied, setApplied] = useState({
    start: daysAgo(7),
    end: toYMD(new Date()),
  });

  const [tempHistory, setTempHistory] = useState<TempPoint[]>([]);
  const [treatHistory, setTreatHistory] = useState<TreatmentPoint[]>([]);
  const [riskHistory, setRiskHistory] = useState<RiskPoint[]>([]);
  const [comparison, setComparison] = useState<ComparisonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dayCount = useMemo(() => {
    const span =
      (new Date(applied.end).getTime() - new Date(applied.start).getTime()) /
      86_400_000;
    return Math.max(1, Math.round(span));
  }, [applied]);

  function applyPreset(days: number) {
    setPreset(days);
    const start = daysAgo(days);
    const end = toYMD(new Date());
    setStartDate(start);
    setEndDate(end);
    setApplied({ start, end });
  }

  function applyCustom() {
    setPreset(null);
    setApplied({ start: startDate, end: endDate });
  }

  const load = useCallback(async () => {
    {
      setLoading(true);
      setError(null);
      try {
        const range = `days=${dayCount}&start=${applied.start}&end=${applied.end}`;
        const [temp, treat, risk, comp] = await Promise.all([
          fetchJSON<WeatherHistoryRow[]>(`/weather/history?${range}`),
          fetchJSON<TreatmentHistoryRow[]>(`/treatments/history?${range}`),
          fetchJSON<RiskHistoryRow[]>(`/risks/history?${range}`),
          fetchJSON<ComparisonRow[]>(`/weather/compare`),
        ]);

        // Several stations report per day; average them into one point.
        const byDate = new Map<
          string,
          { air: number; road: number; count: number }
        >();
        for (const row of temp) {
          const bucket = byDate.get(row.date) ?? { air: 0, road: 0, count: 0 };
          if (row.avg_air_temp !== null) {
            bucket.air += row.avg_air_temp;
            bucket.count += 1;
          }
          if (row.avg_road_temp !== null) bucket.road += row.avg_road_temp;
          byDate.set(row.date, bucket);
        }

        const tempPoints: TempPoint[] = [...byDate.entries()]
          .map(([date, bucket]) => ({
            date: date.slice(5),
            avg_air:
              bucket.count > 0
                ? Number((bucket.air / bucket.count).toFixed(1))
                : null,
            avg_road:
              bucket.count > 0
                ? Number((bucket.road / bucket.count).toFixed(1))
                : null,
          }))
          .reverse();

        const treatByDate = new Map<string, TreatmentPoint>();
        for (const row of treat) {
          const key = row.date.slice(5);
          const entry = treatByDate.get(key) ?? { date: key };
          const name = row.urgency_name as UrgencyName;
          entry[name] = (entry[name] ?? 0) + Number(row.count);
          treatByDate.set(key, entry);
        }

        setTempHistory(tempPoints);
        setTreatHistory([...treatByDate.values()].reverse());
        setRiskHistory(
          [...risk].reverse().map((r) => ({ ...r, date: r.date.slice(5) }))
        );
        setComparison(comp);
      } catch (e) {
        console.error("History load failed:", e);
        setError(e instanceof Error ? e.message : "Request failed");
        setTempHistory([]);
        setTreatHistory([]);
        setRiskHistory([]);
        setComparison([]);
      } finally {
        setLoading(false);
      }
    }
  }, [applied, dayCount]);

  useEffect(() => {
    void load();
  }, [load]);

  // History only changes when a collection run lands, so a slower cadence is
  // enough; the value is refreshing on return to the tab rather than showing
  // yesterday's chart.
  useLiveRefresh(load, 300_000);

  const hasData = tempHistory.some((d) => d.avg_air !== null);

  const dateField =
    "border border-line-strong bg-surface-3 px-2 py-1 text-[10px] text-ink outline-none [color-scheme:dark] focus-visible:border-accent";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-surface-2 p-4">
        <div className="min-w-0">
          <h2 className="text-[11px] font-bold tracking-[0.08em] text-ink-bright">
            📊 {fi ? "Historiallinen analyysi" : "Historical Analysis"}
          </h2>
          <p className="mt-0.5 text-[9px] text-ink-dim">
            {fi ? "Tietojen trendit ajan myötä" : "Data trends over time"} ·{" "}
            {fi ? "Näytetään" : "Showing"} {dayCount} {fi ? "päivää" : "days"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex gap-0.5 border border-line bg-surface-3 p-[3px]">
            {PRESETS.map((days) => {
              const selected = preset === days;
              return (
                <button
                  key={days}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => applyPreset(days)}
                  className={`cursor-pointer border-0 border-b px-2.5 py-1 text-[9px] tracking-[0.1em] transition-colors ${
                    selected
                      ? "border-b-accent bg-accent-soft text-accent"
                      : "border-b-transparent bg-transparent text-ink-dim hover:text-ink"
                  }`}
                >
                  {days}
                  {fi ? "pv" : "d"}
                </button>
              );
            })}
          </div>

          <div className="hidden h-6 w-px bg-line sm:block" />

          <div className="flex flex-wrap items-center gap-1.5">
            <label className="text-[9px] uppercase tracking-[0.1em] text-ink-dim">
              {fi ? "Alku" : "From"}
            </label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPreset(null);
              }}
              className={dateField}
            />
            <label className="text-[9px] uppercase tracking-[0.1em] text-ink-dim">
              {fi ? "Loppu" : "To"}
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={toYMD(new Date())}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPreset(null);
              }}
              className={dateField}
            />
            <button
              type="button"
              onClick={applyCustom}
              className={`cursor-pointer border px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] transition-colors ${
                preset === null
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line-strong bg-surface-3 text-ink-dim hover:text-ink"
              }`}
            >
              {fi ? "Hae" : "Apply"}
            </button>
          </div>
        </div>
      </div>

      {!loading && error && (
        <div
          role="alert"
          className="border border-urgency-critical bg-surface-2 p-6 text-center"
        >
          <p className="mb-2 text-[22px]" aria-hidden="true">
            ⚠️
          </p>
          <p className="text-[11px] tracking-[0.1em] text-urgency-critical">
            {fi ? "HISTORIAN LATAUS EPÄONNISTUI" : "COULD NOT LOAD HISTORY"}
          </p>
          <p className="mt-1.5 text-[9px] text-ink-dim opacity-80">{error}</p>
        </div>
      )}

      {!loading && !error && !hasData && (
        <div className="border border-line bg-surface-2 p-10 text-center">
          <p className="mb-2.5 text-[28px]" aria-hidden="true">
            📊
          </p>
          <p className="text-[11px] tracking-[0.1em] text-ink-dim">
            {fi ? "EI HISTORIALLISIA TIETOJA" : "NO HISTORICAL DATA"}
          </p>
          <p className="mt-1.5 text-[9px] text-ink-dim opacity-70">
            {fi
              ? "Kerää tietoja vähintään 24 tuntia"
              : "Collect data for at least 24 hours"}
          </p>
        </div>
      )}

      <ChartBox
        title={`🌡️ ${fi ? "Lämpötilatrendit" : "Temperature Trends"}`}
        subtitle={
          fi ? "Keskilämpötila päivittäin" : "Average temperature per day"
        }
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={tempHistory}
            margin={{ top: 8, right: 8, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="airGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={SERIES.airTemp} stopOpacity={0.25} />
                <stop offset="95%" stopColor={SERIES.airTemp} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={SERIES.roadTemp} stopOpacity={0.2} />
                <stop offset="95%" stopColor={SERIES.roadTemp} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_INK.grid} />
            <XAxis dataKey="date" {...AXIS} />
            <YAxis {...AXIS} unit="°" />
            <Tooltip
              {...TOOLTIP}
              formatter={(value: number | undefined) => [`${value ?? 0}°C`]}
            />
            <Legend
              wrapperStyle={{ fontSize: "9px", fontFamily: "Space Mono, monospace" }}
              formatter={(value: string) => (
                <span className="text-ink-dim">
                  {value === "avg_air"
                    ? fi
                      ? "Ilma"
                      : "Air"
                    : fi
                      ? "Tie"
                      : "Road"}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="avg_air"
              stroke={SERIES.airTemp}
              strokeWidth={2}
              fill="url(#airGrad)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="avg_road"
              stroke={SERIES.roadTemp}
              strokeWidth={2}
              strokeDasharray="4 3"
              fill="url(#roadGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartBox>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartBox
          title={`🧂 ${fi ? "Toimenpidehistoria" : "Treatment History"}`}
          subtitle={
            fi
              ? "Suositukset päivittäin kiireellisyyden mukaan"
              : "Daily recommendations by urgency"
          }
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={treatHistory}
              margin={{ top: 5, right: 5, left: -30, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_INK.grid} />
              <XAxis dataKey="date" {...AXIS} />
              <YAxis {...AXIS} />
              <Tooltip {...TOOLTIP} />
              <Legend
                wrapperStyle={{
                  fontSize: "9px",
                  fontFamily: "Space Mono, monospace",
                }}
              />
              {STACKED_URGENCIES.map((urgency) => (
                <Bar
                  key={urgency}
                  dataKey={urgency}
                  stackId="urgency"
                  fill={URGENCY[urgency].hex}
                  radius={urgency === "URGENT" ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox
          title={`⚠️ ${fi ? "Vaaratilanteiden tiheys" : "Risk Period Frequency"}`}
          subtitle={
            fi ? "Kiireelliset tilanteet päivittäin" : "Urgent situations per day"
          }
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={riskHistory}
              margin={{ top: 5, right: 5, left: -30, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_INK.grid} />
              <XAxis dataKey="date" {...AXIS} />
              <YAxis {...AXIS} />
              <Tooltip {...TOOLTIP} />
              <Legend
                wrapperStyle={{
                  fontSize: "9px",
                  fontFamily: "Space Mono, monospace",
                }}
              />
              <Bar
                dataKey="urgent_count"
                name={fi ? "Kiireellinen" : "Urgent"}
                fill={URGENCY.URGENT.hex}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="critical_count"
                name={fi ? "Hätätilanne" : "Critical"}
                fill={URGENCY.CRITICAL.hex}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <ChartBox
        title={`📅 ${fi ? "Tämä viikko vs viime viikko" : "This Week vs Last Week"}`}
        subtitle={
          fi
            ? "Keskilämpötilat viikonpäivittäin"
            : "Average air temperature by weekday"
        }
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={comparison}
            margin={{ top: 8, right: 8, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_INK.grid} />
            <XAxis dataKey="day_of_week" {...AXIS} />
            <YAxis {...AXIS} unit="°" />
            <Tooltip
              {...TOOLTIP}
              formatter={(value: number | undefined) => [`${value ?? 0}°C`]}
            />
            <Legend
              wrapperStyle={{ fontSize: "9px", fontFamily: "Space Mono, monospace" }}
              formatter={(value: string) => (
                <span className="text-ink-dim">
                  {value === "this_week_avg_air"
                    ? fi
                      ? "Tämä viikko"
                      : "This week"
                    : fi
                      ? "Viime viikko"
                      : "Last week"}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="this_week_avg_air"
              stroke={SERIES.thisWeek}
              strokeWidth={2}
              dot={{ fill: SERIES.thisWeek, r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="last_week_avg_air"
              stroke={SERIES.lastWeek}
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={{ fill: SERIES.lastWeek, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartBox>
    </div>
  );
}
