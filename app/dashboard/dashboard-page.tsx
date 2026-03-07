"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { KPICards } from "@/components/dashboard/KPICards";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { RecommendationsPanel } from "@/components/dashboard/RecommendationsPanel";
import { ConditionsTable } from "@/components/dashboard/ConditionsTable";
import { ForecastChart } from "@/components/dashboard/ForecastChart";
import { RiskPeriods } from "@/components/dashboard/RiskPeriods";
import { HistoryTab } from "@/components/dashboard/HistoryTab";
import { NotificationBanner } from "@/components/dashboard/NotificationBanner";
import { useNotifications } from "@/lib/useNotifications";
import {
  getDashboardSummary,
  getCurrentWeather,
  getRecommendations,
  getForecast,
  createWebSocket,
} from "@/lib/api";
import {
  DashboardSummary,
  WeatherReading,
  Recommendation,
  ForecastPoint,
  User,
} from "@/types";

type Tab = "live" | "history";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("live");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [readings, setReadings] = useState<WeatherReading[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const { permission, requestPermission } = useNotifications(summary);

  useEffect(() => {
    async function getUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) { router.push("/"); return; }
        const data = await res.json();
        setUser(data.user);
      } catch {
        router.push("/");
      }
    }
    getUser();
  }, [router]);

  const fetchAll = useCallback(async () => {
    try {
      const [sum, weather, recs, fc] = await Promise.all([
        getDashboardSummary(),
        getCurrentWeather(20),
        getRecommendations(0),
        getForecast(24),
      ]);
      setSummary(sum);
      setReadings(weather);
      setRecommendations(recs);
      setForecast(fc);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const ws = createWebSocket(
      (data) => { setSummary(data); setLastUpdated(new Date().toLocaleTimeString()); setIsLive(true); },
      () => setIsLive(false)
    );
    const interval = setInterval(fetchAll, 60000);
    return () => { ws?.close(); clearInterval(interval); };
  }, [fetchAll]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "live", label: (user.role as string) === "fi" ? "Reaaliaikainen" : "Live View" },
    { id: "history", label: (user.role as string) === "fi" ? "Historia" : "History" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)", position: "relative", zIndex: 1 }}>
      <Header user={user} isLive={isLive} lastUpdated={lastUpdated} />

      <main className="container mx-auto px-4 py-6 space-y-5">
        {/* Notification banner */}
        <NotificationBanner permission={permission} onRequest={requestPermission} />

        {/* KPI cards always visible */}
        <KPICards summary={summary} loading={loading} />

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl w-fit"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
          {[
            { id: "live" as Tab, label: "⚡ Live View" },
            { id: "history" as Tab, label: "📊 History" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: activeTab === tab.id ? "rgba(59,130,246,0.2)" : "transparent",
                border: activeTab === tab.id ? "1px solid rgba(59,130,246,0.4)" : "1px solid transparent",
                color: activeTab === tab.id ? "#60a5fa" : "var(--text-muted)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === "live" ? (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <AlertBanner summary={summary} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                  <ConditionsTable readings={readings} loading={loading} role={user.role} />
                </div>
                <RecommendationsPanel recommendations={recommendations} loading={loading} role={user.role} />
              </div>

              <ForecastChart forecast={forecast} loading={loading} />
              <RiskPeriods risks={summary?.upcoming_risks ?? []} loading={loading} />
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <HistoryTab />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-4 mt-8 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="container mx-auto px-4 text-center space-y-1">
          <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
            Tiesääseurantajärjestelmä
          </p>
          <p className="font-mono text-xs" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
            Fintraffic Digitraffic · Ilmatieteen laitos
          </p>
        </div>
      </footer>
    </div>
  );
}
