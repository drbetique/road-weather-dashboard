"use client";

import { useState } from "react";
import { WeatherReading } from "@/types";
import { Translations } from "@/lib/translations";

interface Props {
  readings: WeatherReading[];
  loading: boolean;
  role: string;
  t: Translations;
}

function frictionStatus(friction: number | null, t: Translations) {
  if (friction === null) return { label: t.no_sensor, color: "var(--text-dim)", bg: "transparent", border: "var(--border)" };
  if (friction < 0.25) return { label: t.road_dangerous, color: "var(--red)", bg: "var(--red-dim)", border: "var(--red)" };
  if (friction < 0.4) return { label: t.road_slippery, color: "var(--yellow)", bg: "var(--amber-dim)", border: "var(--yellow)" };
  return { label: t.road_good, color: "var(--green)", bg: "var(--green-dim)", border: "var(--green)" };
}

export function ConditionsTable({ readings, loading, role, t }: Props) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "road_temp" | "friction">("road_temp");
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = readings
    .filter(r => r.station_name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let av: any = a[sortKey === "name" ? "station_name" : sortKey] ?? Infinity;
      let bv: any = b[sortKey === "name" ? "station_name" : sortKey] ?? Infinity;
      if (typeof av === "string") return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortAsc ? av - bv : bv - av;
    });

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const thStyle: React.CSSProperties = {
    padding: "8px 12px", fontSize: "8px", color: "var(--text-dim)",
    letterSpacing: "0.15em", textTransform: "uppercase",
    borderBottom: "1px solid var(--border)", background: "var(--bg2)",
    textAlign: "left", whiteSpace: "nowrap", cursor: "pointer", userSelect: "none",
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", borderBottom: "1px solid var(--border)",
        background: "var(--bg2)", flexShrink: 0,
      }}>
        <div>
          <span style={{ fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {t.road_conditions}
          </span>
          <span style={{ fontSize: "9px", color: "var(--cyan)", marginLeft: "10px" }}>
            {loading ? "—" : `${filtered.length} / ${readings.length}`} {t.live.toLowerCase()}
          </span>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t.search}
          style={{
            background: "var(--bg3)", border: "1px solid var(--border2)",
            color: "var(--text)", fontFamily: "Space Mono, monospace",
            fontSize: "10px", padding: "4px 10px", outline: "none", width: "180px",
          }}
        />
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr>
              <th style={thStyle} onClick={() => handleSort("name")}>
                {t.station} {sortKey === "name" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th style={{ ...thStyle, textAlign: "right" }}>{t.air_temp}</th>
              <th style={{ ...thStyle, textAlign: "right" }} onClick={() => handleSort("road_temp")}>
                {t.road_temp} {sortKey === "road_temp" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th style={{ ...thStyle, textAlign: "center" }} onClick={() => handleSort("friction")}>
                {t.road_status} {sortKey === "friction" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th style={{ ...thStyle, textAlign: "right" }}>{t.salt}</th>
              {role === "admin" && <th style={{ ...thStyle, textAlign: "right" }}>Humidity</th>}
              {role === "admin" && <th style={{ ...thStyle, textAlign: "right" }}>Wind m/s</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {[1,2,3,4,5].map(j => (
                    <td key={j} style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ height: "10px", background: "var(--border)", width: "60%", animation: "blink 1.5s infinite" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "var(--text-dim)", fontSize: "10px", letterSpacing: "0.1em" }}>
                  {t.loading}
                </td>
              </tr>
            ) : filtered.map((r, i) => {
              const status = frictionStatus(r.friction ?? null, t);
              const roadTempColor = r.road_temp !== null && r.road_temp <= 0 ? "var(--red)" : "var(--text-bright)";
              const airTempColor = r.air_temp !== null && r.air_temp <= 0 ? "var(--cyan)" : "var(--text)";
              return (
                <tr key={i}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg3)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--text-dim)", fontSize: "10px" }}>
                    {r.station_name}
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "right", color: airTempColor, fontWeight: 700 }}>
                    {r.air_temp !== null ? `${r.air_temp}°` : "—"}
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "right", color: roadTempColor, fontWeight: 700 }}>
                    {r.road_temp !== null ? `${r.road_temp}°` : "—"}
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>
                    <span style={{
                      fontSize: "8px", padding: "2px 7px", textTransform: "uppercase",
                      letterSpacing: "0.1em", fontWeight: 700,
                      background: status.bg, color: status.color, border: `1px solid ${status.border}`,
                    }}>
                      {status.label}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "right", color: "var(--text-dim)" }}>
                    {r.salt_amount !== null ? r.salt_amount : t.no_salt_data}
                  </td>
                  {role === "admin" && (
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "right", color: "var(--text-dim)" }}>
                      {r.humidity !== null ? `${r.humidity}%` : "—"}
                    </td>
                  )}
                  {role === "admin" && (
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "right", color: "var(--text-dim)" }}>
                      {r.wind_speed !== null ? r.wind_speed : "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
