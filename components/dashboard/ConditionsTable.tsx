"use client";

import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Translations } from "@/lib/translations";
import type { UserRole, WeatherReading } from "@/types";

interface ConditionsTableProps {
  readonly readings: readonly WeatherReading[];
  readonly loading: boolean;
  readonly role: UserRole;
  readonly t: Translations;
}

type SortKey = "name" | "road_temp" | "friction";

interface FrictionStatus {
  readonly label: string;
  readonly text: string;
  readonly surface: string;
  readonly border: string;
}

function frictionStatus(
  friction: number | null,
  t: Translations
): FrictionStatus {
  if (friction === null) {
    return {
      label: t.no_sensor,
      text: "text-ink-dim",
      surface: "bg-transparent",
      border: "border-line",
    };
  }
  if (friction < 0.25) {
    return {
      label: t.road_dangerous,
      text: "text-urgency-critical",
      surface: "bg-urgency-critical-soft",
      border: "border-urgency-critical",
    };
  }
  if (friction < 0.4) {
    return {
      label: t.road_slippery,
      text: "text-urgency-preventive",
      surface: "bg-urgency-preventive-soft",
      border: "border-urgency-preventive",
    };
  }
  return {
    label: t.road_good,
    text: "text-urgency-monitor",
    surface: "bg-urgency-monitor-soft",
    border: "border-urgency-monitor",
  };
}

/** Sort key resolved to a comparable value; nulls sink to the bottom. */
function sortValue(
  reading: WeatherReading,
  key: SortKey
): string | number {
  if (key === "name") return reading.station_name ?? "";
  return reading[key] ?? Number.POSITIVE_INFINITY;
}

const TH =
  "sticky top-0 z-10 whitespace-nowrap border-b border-line bg-surface-2 px-3 py-2 text-[8px] uppercase tracking-[0.15em] text-ink-dim select-none";
const TD = "border-b border-line px-3 py-2";

export function ConditionsTable({
  readings,
  loading,
  role,
  t,
}: ConditionsTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("road_temp");
  const [sortAsc, setSortAsc] = useState(true);

  const isAdmin = role === "admin";
  const columnCount = isAdmin ? 7 : 5;

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return [...readings]
      .filter((r) => (r.station_name ?? "").toLowerCase().includes(needle))
      .sort((a, b) => {
        const av = sortValue(a, sortKey);
        const bv = sortValue(b, sortKey);
        if (typeof av === "string" || typeof bv === "string") {
          const cmp = String(av).localeCompare(String(bv));
          return sortAsc ? cmp : -cmp;
        }
        return sortAsc ? av - bv : bv - av;
      });
  }, [readings, search, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
      return;
    }
    setSortKey(key);
    setSortAsc(true);
  }

  function indicator(key: SortKey) {
    if (sortKey !== key) return "";
    return sortAsc ? "↑" : "↓";
  }

  return (
    <section className="flex h-full flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2 px-4 py-2.5">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h2 className="text-[9px] uppercase tracking-[0.15em] text-ink-dim">
            {t.road_conditions}
          </h2>
          <span className="text-[9px] text-accent">
            {loading ? "—" : `${filtered.length} / ${readings.length}`}{" "}
            {t.live.toLowerCase()}
          </span>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.search}
          aria-label={t.search}
          className="w-full min-w-0 border border-line-strong bg-surface-3 px-2.5 py-1 text-[10px] text-ink outline-none placeholder:text-ink-dim focus-visible:border-accent sm:w-45"
        />
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>
              <th
                className={`${TH} cursor-pointer text-left`}
                onClick={() => handleSort("name")}
              >
                {t.station} {indicator("name")}
              </th>
              <th className={`${TH} text-right`}>{t.air_temp}</th>
              <th
                className={`${TH} cursor-pointer text-right`}
                onClick={() => handleSort("road_temp")}
              >
                {t.road_temp} {indicator("road_temp")}
              </th>
              <th
                className={`${TH} cursor-pointer text-center`}
                onClick={() => handleSort("friction")}
              >
                {t.road_status} {indicator("friction")}
              </th>
              <th className={`${TH} text-right`}>{t.salt}</th>
              {isAdmin && <th className={`${TH} text-right`}>Humidity</th>}
              {isAdmin && <th className={`${TH} text-right`}>Wind m/s</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 8 }, (_, row) => (
                <tr key={row}>
                  {Array.from({ length: columnCount }, (_, col) => (
                    <td key={col} className={TD}>
                      <Skeleton className="h-2.5 w-3/5" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="p-8 text-center text-[10px] tracking-[0.1em] text-ink-dim"
                >
                  {t.loading}
                </td>
              </tr>
            ) : (
              filtered.map((reading) => {
                const status = frictionStatus(reading.friction ?? null, t);
                return (
                  <tr
                    key={reading.station_id}
                    className="transition-colors hover:bg-surface-3"
                  >
                    <td className={`${TD} text-[10px] text-ink-dim`}>
                      {reading.station_name}
                    </td>
                    <td
                      className={`${TD} text-right font-bold ${
                        reading.air_temp !== null && reading.air_temp <= 0
                          ? "text-accent"
                          : "text-ink"
                      }`}
                    >
                      {reading.air_temp !== null ? `${reading.air_temp}°` : "—"}
                    </td>
                    <td
                      className={`${TD} text-right font-bold ${
                        reading.road_temp !== null && reading.road_temp <= 0
                          ? "text-urgency-critical"
                          : "text-ink-bright"
                      }`}
                    >
                      {reading.road_temp !== null ? `${reading.road_temp}°` : "—"}
                    </td>
                    <td className={`${TD} text-center`}>
                      <span
                        className={`inline-block whitespace-nowrap border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] ${status.border} ${status.surface} ${status.text}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className={`${TD} text-right text-ink-dim`}>
                      {reading.salt_amount !== null
                        ? reading.salt_amount
                        : t.no_salt_data}
                    </td>
                    {isAdmin && (
                      <td className={`${TD} text-right text-ink-dim`}>
                        {reading.humidity !== null ? `${reading.humidity}%` : "—"}
                      </td>
                    )}
                    {isAdmin && (
                      <td className={`${TD} text-right text-ink-dim`}>
                        {reading.wind_speed !== null ? reading.wind_speed : "—"}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
