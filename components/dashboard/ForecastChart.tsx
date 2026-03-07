"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ForecastPoint } from "@/types";
import { Translations } from "@/lib/translations";

interface Props {
  forecast: ForecastPoint[];
  loading: boolean;
  t: Translations;
}

export function ForecastChart({ forecast, loading, t }: Props) {
  const data = forecast.map(p => ({
    time: new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    temperature: p.temperature !== undefined ? Math.round(p.temperature * 10) / 10 : null,
    dew_point: p.dew_point !== undefined ? Math.round((p.dew_point ?? 0) * 10) / 10 : null,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border2)",
        padding: "8px 12px", fontFamily: "Space Mono, monospace",
      }}>
        <div style={{ fontSize: "9px", color: "var(--text-dim)", marginBottom: "4px" }}>{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ fontSize: "11px", color: p.color, marginBottom: "2px" }}>
            {p.name}: {p.value}°C
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{
        padding: "8px 14px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
      }}>
        <span style={{ fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          {t.forecast_24h}
        </span>
        <span style={{ fontSize: "9px", color: "var(--text-dim)" }}>{t.chart_subtitle}</span>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.15em", animation: "blink 1.5s infinite" }}>
            {t.loading.toUpperCase()}
          </span>
        </div>
      ) : (
        <div style={{ flex: 1, padding: "8px 4px 4px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="time"
                tick={{ fill: "var(--text-dim)", fontSize: 8, fontFamily: "Space Mono" }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "var(--text-dim)", fontSize: 8, fontFamily: "Space Mono" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `${v}°`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="var(--red)" strokeDasharray="4 2" strokeWidth={1} opacity={0.5} label={{ value: t.freezing_point, fill: "var(--red)", fontSize: 8 }} />
              <Line type="monotone" dataKey="temperature" stroke="var(--cyan)" strokeWidth={1.5} dot={false} name={t.temperature} connectNulls />
              <Line type="monotone" dataKey="dew_point" stroke="var(--text-dim)" strokeWidth={1} dot={false} strokeDasharray="3 2" name={t.dew_point} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
