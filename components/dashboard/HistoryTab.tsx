"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { useLang } from "@/components/providers/Providers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function fetchJSON(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

const urgencyColors: Record<string, string> = {
  NONE: "#00e676",
  MONITOR: "#00e5ff",
  PREVENTIVE: "#ffb300",
  STANDARD: "#ff9800",
  URGENT: "#ff3b3b",
  CRITICAL: "#dc2626",
};

const axisStyle = {
  tick: { fontSize: 9, fontFamily: "Space Mono, monospace", fill: "var(--text-dim)" },
  axisLine: { stroke: "var(--border)" },
  tickLine: false as const,
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--bg2)",
    border: "1px solid var(--border2)",
    borderRadius: "0",
    fontSize: "10px",
    fontFamily: "Space Mono, monospace",
    color: "var(--text)",
  },
  labelStyle: { color: "var(--text-dim)" },
};

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.15em", textTransform: "uppercase" }}>{title}</div>
      <div style={{ fontSize: "9px", color: "var(--text-dim)", opacity: 0.6, marginTop: "2px" }}>{subtitle}</div>
    </div>
  );
}

function ChartBox({ title, subtitle, loading, children }: { title: string; subtitle: string; loading: boolean; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", padding: "16px" }}>
      <SectionHeader title={title} subtitle={subtitle} />
      {loading ? (
        <div style={{ height: "180px", background: "var(--bg3)", animation: "blink 1.5s infinite" }} />
      ) : children}
    </div>
  );
}

function toYMD(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toYMD(d);
}

export function HistoryTab() {
  const { lang } = useLang();
  const fi = lang === "fi";

  const [preset, setPreset] = useState<number | null>(7);
  const [startDate, setStartDate] = useState(daysAgo(7));
  const [endDate, setEndDate] = useState(toYMD(new Date()));
  const [applied, setApplied] = useState({ start: daysAgo(7), end: toYMD(new Date()) });

  const [tempHistory, setTempHistory] = useState<any[]>([]);
  const [treatHistory, setTreatHistory] = useState<any[]>([]);
  const [riskHistory, setRiskHistory] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  function applyPreset(d: number) {
    setPreset(d);
    const s = daysAgo(d);
    const e = toYMD(new Date());
    setStartDate(s);
    setEndDate(e);
    setApplied({ start: s, end: e });
  }

  function applyCustom() {
    setPreset(null);
    setApplied({ start: startDate, end: endDate });
  }

  const dayCount = Math.max(1, Math.round((new Date(applied.end).getTime() - new Date(applied.start).getTime()) / 86400000));

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [temp, treat, risk, comp] = await Promise.all([
        fetchJSON(`/weather/history?days=${dayCount}`),
        fetchJSON(`/treatments/history?days=${dayCount}`),
        fetchJSON(`/risks/history?days=${dayCount}`),
        fetchJSON(`/weather/compare`),
      ]);

      const tempByDate: Record<string, any> = {};
      for (const row of temp) {
        const d = row.date;
        if (!tempByDate[d]) tempByDate[d] = { date: d, count: 0, air: 0, road: 0 };
        if (row.avg_air_temp !== null) { tempByDate[d].air += row.avg_air_temp; tempByDate[d].count++; }
        if (row.avg_road_temp !== null) tempByDate[d].road += row.avg_road_temp;
      }
      const tempData = Object.values(tempByDate)
        .map((d: any) => ({
          date: d.date.slice(5),
          avg_air: d.count > 0 ? +(d.air / d.count).toFixed(1) : null,
          avg_road: d.count > 0 ? +(d.road / d.count).toFixed(1) : null,
        }))
        .reverse();

      const treatByDate: Record<string, any> = {};
      for (const row of treat) {
        const d = row.date;
        if (!treatByDate[d]) treatByDate[d] = { date: d.slice(5) };
        treatByDate[d][row.urgency_name] = (treatByDate[d][row.urgency_name] || 0) + Number(row.count);
      }

      setTempHistory(tempData);
      setTreatHistory(Object.values(treatByDate).reverse());
      setRiskHistory([...risk].reverse().map((r: any) => ({ ...r, date: r.date.slice(5) })));
      setComparison(comp);
      setLoading(false);
    }
    load();
  }, [applied, dayCount]);

  const hasData = tempHistory.some(d => d.avg_air !== null);

  const inputStyle: React.CSSProperties = {
    background: "var(--bg3)", border: "1px solid var(--border2)",
    color: "var(--text)", fontFamily: "Space Mono, monospace",
    fontSize: "10px", padding: "5px 8px", outline: "none",
    colorScheme: "dark",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* HEADER + DATE CONTROLS */}
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border)",
        padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
      }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-bright)", fontWeight: 700, letterSpacing: "0.08em" }}>
            📊 {fi ? "Historiallinen analyysi" : "Historical Analysis"}
          </div>
          <div style={{ fontSize: "9px", color: "var(--text-dim)", marginTop: "2px" }}>
            {fi ? "Tietojen trendit ajan myötä" : "Data trends over time"} · {fi ? "Näytetään" : "Showing"} {dayCount} {fi ? "päivää" : "days"}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Preset buttons */}
          <div style={{ display: "flex", gap: "2px", background: "var(--bg3)", border: "1px solid var(--border)", padding: "3px" }}>
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => applyPreset(d)} style={{
                padding: "4px 10px", fontSize: "9px", letterSpacing: "0.1em",
                cursor: "pointer", border: "none",
                background: preset === d ? "var(--cyan-dim)" : "transparent",
                color: preset === d ? "var(--cyan)" : "var(--text-dim)",
                borderBottom: preset === d ? "1px solid var(--cyan)" : "1px solid transparent",
              }}>
                {d}{fi ? "pv" : "d"}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: "1px", height: "24px", background: "var(--border)" }} />

          {/* Custom date range */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {fi ? "Alku" : "From"}
            </span>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={e => { setStartDate(e.target.value); setPreset(null); }}
              style={inputStyle}
            />
            <span style={{ fontSize: "9px", color: "var(--text-dim)" }}>—</span>
            <span style={{ fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {fi ? "Loppu" : "To"}
            </span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={toYMD(new Date())}
              onChange={e => { setEndDate(e.target.value); setPreset(null); }}
              style={inputStyle}
            />
            <button onClick={applyCustom} style={{
              padding: "5px 12px", fontSize: "9px", letterSpacing: "0.1em",
              textTransform: "uppercase", cursor: "pointer",
              background: preset === null ? "var(--cyan-dim)" : "var(--bg3)",
              border: preset === null ? "1px solid var(--cyan)" : "1px solid var(--border2)",
              color: preset === null ? "var(--cyan)" : "var(--text-dim)",
            }}>
              {fi ? "Hae" : "Apply"}
            </button>
          </div>
        </div>
      </div>

      {/* NO DATA */}
      {!loading && !hasData && (
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          padding: "40px", textAlign: "center",
        }}>
          <div style={{ fontSize: "28px", marginBottom: "10px" }}>📊</div>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.1em" }}>
            {fi ? "EI HISTORIALLISIA TIETOJA" : "NO HISTORICAL DATA"}
          </div>
          <div style={{ fontSize: "9px", color: "var(--text-dim)", marginTop: "6px", opacity: 0.6 }}>
            {fi ? "Kerää tietoja vähintään 24 tuntia" : "Collect data for at least 24 hours"}
          </div>
        </div>
      )}

      {/* TEMPERATURE CHART */}
      <ChartBox
        title={`🌡️ ${fi ? "Lämpötilatrendit" : "Temperature Trends"}`}
        subtitle={fi ? "Keskilämpötila päivittäin" : "Average temperature per day"}
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={tempHistory} margin={{ top: 8, right: 8, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="airGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff3b3b" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ff3b3b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" {...axisStyle} />
            <YAxis {...axisStyle} unit="°" />
            <Tooltip {...tooltipStyle} formatter={(v: number | undefined) => [`${v ?? 0}°C`]} />
            <Legend wrapperStyle={{ fontSize: "9px", fontFamily: "Space Mono, monospace" }}
              formatter={v => <span style={{ color: "var(--text-dim)" }}>{v === "avg_air" ? (fi ? "Ilma" : "Air") : (fi ? "Tie" : "Road")}</span>}
            />
            <Area type="monotone" dataKey="avg_air" stroke="var(--cyan)" strokeWidth={1.5} fill="url(#airGrad)" dot={false} />
            <Area type="monotone" dataKey="avg_road" stroke="var(--red)" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#roadGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartBox>

      {/* TREATMENT + RISK */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <ChartBox
          title={`🧂 ${fi ? "Toimenpidethistoria" : "Treatment History"}`}
          subtitle={fi ? "Suositukset päivittäin kiireellisyyden mukaan" : "Daily recommendations by urgency"}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={treatHistory} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip {...tooltipStyle} />
              {["URGENT", "STANDARD", "PREVENTIVE", "MONITOR"].map(u => (
                <Bar key={u} dataKey={u} stackId="a" fill={urgencyColors[u]} radius={u === "URGENT" ? [2, 2, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox
          title={`⚠️ ${fi ? "Vaaratilanteiden tiheys" : "Risk Period Frequency"}`}
          subtitle={fi ? "Kiireelliset tilanteet päivittäin" : "Urgent situations per day"}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={riskHistory} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="urgent_count" name={fi ? "Kiireellinen" : "Urgent"} fill="var(--amber)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="critical_count" name={fi ? "Hätätilanne" : "Critical"} fill="var(--red)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      {/* WEEK COMPARISON */}
      <ChartBox
        title={`📅 ${fi ? "Tämä viikko vs viime viikko" : "This Week vs Last Week"}`}
        subtitle={fi ? "Keskilämpötilat viikonpäivittäin" : "Average air temperature by weekday"}
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={comparison} margin={{ top: 8, right: 8, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="day_of_week" {...axisStyle} />
            <YAxis {...axisStyle} unit="°" />
            <Tooltip {...tooltipStyle} formatter={(v: number | undefined) => [`${v ?? 0}°C`]} />
            <Legend wrapperStyle={{ fontSize: "9px", fontFamily: "Space Mono, monospace" }}
              formatter={v => (
                <span style={{ color: "var(--text-dim)" }}>
                  {v === "this_week_avg_air" ? (fi ? "Tämä viikko" : "This week") : (fi ? "Viime viikko" : "Last week")}
                </span>
              )}
            />
            <Line type="monotone" dataKey="this_week_avg_air" stroke="var(--cyan)" strokeWidth={2} dot={{ fill: "var(--cyan)", r: 3 }} />
            <Line type="monotone" dataKey="last_week_avg_air" stroke="var(--text-dim)" strokeWidth={1.5} strokeDasharray="4 3" dot={{ fill: "var(--text-dim)", r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartBox>

    </div>
  );
}
