"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, ChevronDown, X } from "lucide-react";
import { useLang } from "@/components/providers/Providers";
import { translations } from "@/lib/translations";
import { WeatherReading, UserRole } from "@/types";
import { exportToCSV } from "@/lib/api";
import { canExportCSV } from "@/lib/auth";

interface ConditionsTableProps {
  readings: WeatherReading[];
  loading: boolean;
  role: UserRole;
}

function frictionToStatus(friction: number | null, t: typeof translations.en) {
  if (friction === null) return { label: t.no_sensor , color: "var(--text-muted)", dot: "#475569", level: -1 };
  if (friction >= 0.6) return { label: t.road_good, color: "#34d399", dot: "#10b981", level: 0 };
  if (friction >= 0.45) return { label: t.road_watch, color: "#fbbf24", dot: "#f59e0b", level: 1 };
  if (friction >= 0.3) return { label: t.road_slippery, color: "#fb923c", dot: "#f97316", level: 2 };
  return { label: t.road_dangerous, color: "#f87171", dot: "#ef4444", level: 3 };
}

const URGENCY_OPTIONS = ["ALL", "NONE", "MONITOR", "PREVENTIVE", "STANDARD", "URGENT", "CRITICAL"];
const STATUS_OPTIONS = ["ALL", "good", "watch", "slippery", "dangerous", "unknown"];
const REGION_OPTIONS = ["ALL", "vt1", "vt2", "vt10", "st110", "st130", "yt", "other"];

function SelectFilter({
  value, onChange, options, label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-1.5 text-xs rounded-lg focus:outline-none cursor-pointer"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid var(--border)",
          color: value === "ALL" ? "var(--text-muted)" : "var(--text-primary)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <option value="ALL">{label}</option>
        {options.filter((o) => o !== "ALL").map((o) => (
          <option key={o} value={o} style={{ background: "#0f1729" }}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown size={10} className="absolute right-2 top-2.5 pointer-events-none" style={{ color: "var(--text-muted)" }} />
    </div>
  );
}

export function ConditionsTable({ readings, loading, role }: ConditionsTableProps) {
  const { lang } = useLang();
  const t = translations[lang];

  const [search, setSearch] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const activeFilterCount = [
    urgencyFilter !== "ALL",
    statusFilter !== "ALL",
    regionFilter !== "ALL",
    !!dateFrom,
    !!dateTo,
    !!search,
  ].filter(Boolean).length;

  function clearFilters() {
    setSearch("");
    setUrgencyFilter("ALL");
    setStatusFilter("ALL");
    setRegionFilter("ALL");
    setDateFrom("");
    setDateTo("");
  }

  const filtered = useMemo(() => {
    return readings.filter((r) => {
      // Search
      if (search && !r.station_name.toLowerCase().includes(search.toLowerCase())) return false;

      // Region (by station name prefix)
      if (regionFilter !== "ALL") {
        const name = r.station_name.toLowerCase();
        if (regionFilter === "other") {
          const known = ["vt1", "vt2", "vt10", "st110", "st130", "yt"];
          if (known.some((k) => name.startsWith(k))) return false;
        } else {
          if (!name.startsWith(regionFilter.toLowerCase())) return false;
        }
      }

      // Road status
      if (statusFilter !== "ALL") {
        const friction = r.friction;
        if (statusFilter === "good" && !(friction !== null && friction >= 0.6)) return false;
        if (statusFilter === "watch" && !(friction !== null && friction >= 0.45 && friction < 0.6)) return false;
        if (statusFilter === "slippery" && !(friction !== null && friction >= 0.3 && friction < 0.45)) return false;
        if (statusFilter === "dangerous" && !(friction !== null && friction < 0.3)) return false;
        if (statusFilter === "unknown" && friction !== null) return false;
      }

      // Date range
      if (dateFrom) {
        const ts = new Date(r.timestamp);
        if (ts < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const ts = new Date(r.timestamp);
        if (ts > new Date(dateTo + "T23:59:59")) return false;
      }

      return true;
    });
  }, [readings, search, urgencyFilter, statusFilter, regionFilter, dateFrom, dateTo]);

  function handleExport() {
    const date = new Date().toISOString().split("T")[0];
    exportToCSV(filtered, `road-weather-${date}.csv`);
  }

  return (
    <div className="card-base flex flex-col">
      {/* Header */}
      <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div>
            <p className="section-label">🌡️ {t.road_conditions}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {filtered.length} / {readings.length} {t.conditions_subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
              >
                <X size={10} /> Clear ({activeFilterCount})
              </button>
            )}
            {canExportCSV(role) && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa" }}
              >
                <Download size={12} /> {t.export_csv}
              </button>
            )}
          </div>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-2.5" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 pr-3 py-1.5 text-xs rounded-lg w-36 focus:outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>

          {/* Region */}
          <SelectFilter
            value={regionFilter}
            onChange={setRegionFilter}
            options={REGION_OPTIONS}
            label={lang === "fi" ? "Alue" : "Region"}
          />

          {/* Road status */}
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            label={lang === "fi" ? "Tien tila" : "Road status"}
          />

          {/* Date from */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2 py-1.5 text-xs rounded-lg focus:outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: dateFrom ? "var(--text-primary)" : "var(--text-muted)" }}
          />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2 py-1.5 text-xs rounded-lg focus:outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: dateTo ? "var(--text-primary)" : "var(--text-muted)" }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {[t.station, t.air_temp, t.road_temp, t.road_status, t.salt].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 font-mono text-xs font-medium ${i === 0 ? "text-left" : "text-right"}`}
                  style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.04)", width: `${55 + (i * 13) % 35}%` }} />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>No stations match the current filters</p>
                  <button onClick={clearFilters} className="text-xs mt-2" style={{ color: "#60a5fa" }}>Clear filters</button>
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => {
                const status = frictionToStatus(r.friction, t);
                const isFreezing = r.road_temp !== null && r.road_temp <= 0;
                return (
                  <motion.tr
                    key={r.station_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.015 }}
                    className="table-row"
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                        {r.station_name}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums" style={{ color: "var(--text-secondary)" }}>
                      {r.air_temp ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums font-semibold"
                      style={{ color: isFreezing ? "#60a5fa" : "var(--text-secondary)" }}>
                      {r.road_temp ?? "—"}
                      {isFreezing && <span className="ml-1">❄</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="flex items-center justify-end gap-1.5">
                        <span className="status-dot" style={{ background: status.dot, boxShadow: `0 0 6px ${status.dot}60` }} />
                        <span className="text-xs font-medium" style={{ color: status.color }}>{status.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {r.salt_amount !== null && r.salt_amount !== undefined ? r.salt_amount : "No data"}
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
