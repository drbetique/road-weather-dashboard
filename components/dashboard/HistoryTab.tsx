"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from "recharts";
import { useLang } from "@/components/providers/Providers";
import { translations } from "@/lib/translations";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function fetchJSON(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

function ChartCard({ title, subtitle, children, loading }: {
  title: string; subtitle: string; children: React.ReactNode; loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base p-5"
    >
      <div className="mb-4">
        <p className="section-label">{title}</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
      </div>
      {loading ? (
        <div className="h-52 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
      ) : children}
    </motion.div>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "var(--bg-card)",
    border: "1px solid rgba(59,130,246,0.3)",
    borderRadius: "8px",
    fontSize: "11px",
    fontFamily: "'JetBrains Mono', monospace",
  },
  labelStyle: { color: "var(--text-secondary)" },
};

const axisStyle = {
  tick: { fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: "#475569" },
  axisLine: { stroke: "rgba(59,130,246,0.1)" },
  tickLine: false as const,
};

const urgencyColors: Record<string, string> = {
  NONE: "#10b981",
  MONITOR: "#3b82f6",
  PREVENTIVE: "#f59e0b",
  STANDARD: "#f97316",
  URGENT: "#ef4444",
  CRITICAL: "#dc2626",
};

export function HistoryTab() {
  const { lang } = useLang();
  const [days, setDays] = useState(7);
  const [tempHistory, setTempHistory] = useState<any[]>([]);
  const [treatHistory, setTreatHistory] = useState<any[]>([]);
  const [riskHistory, setRiskHistory] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [temp, treat, risk, comp] = await Promise.all([
        fetchJSON(`/weather/history?days=${days}`),
        fetchJSON(`/treatments/history?days=${days}`),
        fetchJSON(`/risks/history?days=${days}`),
        fetchJSON(`/weather/compare`),
      ]);

      // Aggregate temp by date (average across stations)
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

      // Aggregate treatments by date
      const treatByDate: Record<string, any> = {};
      for (const row of treat) {
        const d = row.date;
        if (!treatByDate[d]) treatByDate[d] = { date: d.slice(5) };
        treatByDate[d][row.urgency_name] = (treatByDate[d][row.urgency_name] || 0) + Number(row.count);
      }
      const treatData = Object.values(treatByDate).reverse();

      setTempHistory(tempData);
      setTreatHistory(treatData);
      setRiskHistory([...risk].reverse().map((r: any) => ({ ...r, date: r.date.slice(5) })));
      setComparison(comp);
      setLoading(false);
    }
    load();
  }, [days]);

  const hasData = tempHistory.some((d) => d.avg_air !== null);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="section-label">📊 {lang === "fi" ? "Historiallinen analyysi" : "Historical Analysis"}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {lang === "fi" ? "Tietojen trendit ajan myötä" : "Data trends over time"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {lang === "fi" ? "Näytä" : "Show"}:
          </span>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: days === d ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                border: days === d ? "1px solid rgba(59,130,246,0.4)" : "1px solid var(--border)",
                color: days === d ? "#60a5fa" : "var(--text-muted)",
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* No data notice */}
      {!loading && !hasData && (
        <div className="card-base p-8 text-center">
          <span className="text-3xl block mb-3">📊</span>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            {lang === "fi" ? "Ei historiallisia tietoja vielä" : "No historical data yet"}
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            {lang === "fi"
              ? "Kerää tietoja vähintään 24 tuntia nähdäksesi trendit"
              : "Collect data for at least 24 hours to see trends here"}
          </p>
        </div>
      )}

      {/* Temperature trends */}
      <ChartCard
        title={`🌡️ ${lang === "fi" ? "Lämpötilatrendit" : "Temperature Trends"}`}
        subtitle={lang === "fi" ? "Keskilämpötila päivittäin" : "Average temperature per day"}
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={tempHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="airGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.07)" />
            <XAxis dataKey="date" {...axisStyle} />
            <YAxis {...axisStyle} unit="°" />
            <Tooltip {...tooltipStyle} formatter={(v: number | undefined) => [`${v ?? 0}°C`]} />
            <Legend wrapperStyle={{ fontSize: "11px" }}
              formatter={(v) => <span style={{ color: "var(--text-secondary)" }}>{v === "avg_air" ? (lang === "fi" ? "Ilma" : "Air") : (lang === "fi" ? "Tie" : "Road")}</span>}
            />
            <Area type="monotone" dataKey="avg_air" stroke="#ef4444" strokeWidth={2} fill="url(#airGrad)" dot={false} />
            <Area type="monotone" dataKey="avg_road" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#roadGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Two column: Treatment history + Risk frequency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title={`🧂 ${lang === "fi" ? "Toimenpidethistoria" : "Treatment History"}`}
          subtitle={lang === "fi" ? "Suositukset päivittäin kiireellisyyden mukaan" : "Daily recommendations by urgency"}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={treatHistory} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.07)" />
              <XAxis dataKey="date" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip {...tooltipStyle} />
              {["URGENT", "STANDARD", "PREVENTIVE", "MONITOR"].map((u) => (
                <Bar key={u} dataKey={u} stackId="a" fill={urgencyColors[u]} radius={u === "URGENT" ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={`⚠️ ${lang === "fi" ? "Vaaratilanteiden tiheys" : "Risk Period Frequency"}`}
          subtitle={lang === "fi" ? "Kiireelliset tilanteet päivittäin" : "Urgent situations per day"}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={riskHistory} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.07)" />
              <XAxis dataKey="date" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="urgent_count" name={lang === "fi" ? "Kiireellinen" : "Urgent"} fill="#ef4444" opacity={0.8} radius={[3, 3, 0, 0]} />
              <Bar dataKey="critical_count" name={lang === "fi" ? "Hätätilanne" : "Critical"} fill="#dc2626" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* This week vs last week */}
      <ChartCard
        title={`📅 ${lang === "fi" ? "Tämä viikko vs viime viikko" : "This Week vs Last Week"}`}
        subtitle={lang === "fi" ? "Keskilämpötilat viikonpäivittäin" : "Average air temperature by weekday"}
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={comparison} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.07)" />
            <XAxis dataKey="day_of_week" {...axisStyle} />
            <YAxis {...axisStyle} unit="°" />
            <Tooltip {...tooltipStyle} formatter={(v: number | undefined) => [`${v ?? 0}°C`]} />
            <Legend wrapperStyle={{ fontSize: "11px" }}
              formatter={(v) => (
                <span style={{ color: "var(--text-secondary)" }}>
                  {v === "this_week_avg_air"
                    ? (lang === "fi" ? "Tämä viikko" : "This week")
                    : (lang === "fi" ? "Viime viikko" : "Last week")}
                </span>
              )}
            />
            <Line type="monotone" dataKey="this_week_avg_air" stroke="#60a5fa" strokeWidth={2} dot={{ fill: "#60a5fa", r: 3 }} />
            <Line type="monotone" dataKey="last_week_avg_air" stroke="#475569" strokeWidth={1.5} strokeDasharray="4 3" dot={{ fill: "#475569", r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
