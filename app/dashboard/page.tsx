"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConditionsTable } from "@/components/dashboard/ConditionsTable";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { DashboardNav, type DashboardTab } from "@/components/dashboard/DashboardNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ForecastChart } from "@/components/dashboard/ForecastChart";
import { HistoryTab } from "@/components/dashboard/HistoryTab";
import { KPICards } from "@/components/dashboard/KPICards";
import { RiskPeriods } from "@/components/dashboard/RiskPeriods";
import { useLang } from "@/components/providers/Providers";
import {
  getCurrentWeather,
  getDashboardSummary,
  getForecast,
  getRecommendations,
  subscribeSummary,
} from "@/lib/api";
import { URGENT_LEVEL } from "@/lib/theme";
import { translations } from "@/lib/translations";
import { useLiveRefresh } from "@/lib/useLiveRefresh";
import { useNotifications } from "@/lib/useNotifications";
import type {
  DashboardSummary,
  ForecastPoint,
  Recommendation,
  User,
  WeatherReading,
} from "@/types";

const REFRESH_MS = 60_000;

export default function DashboardPage() {
  const router = useRouter();
  const { lang, setLang } = useLang();

  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("live");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [readings, setReadings] = useState<WeatherReading[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [clock, setClock] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const t = translations[lang];
  useNotifications(summary);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setClock(
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} EET`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data: { user: User } = await res.json();
        setUser(data.user);
      } catch {
        router.push("/login");
      }
    }
    void loadUser();
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      const [nextSummary, nextReadings, nextRecs, nextForecast] =
        await Promise.all([
          getDashboardSummary(),
          getCurrentWeather(20),
          getRecommendations(0),
          getForecast(24),
        ]);
      setSummary(nextSummary);
      setReadings(nextReadings);
      setRecommendations(nextRecs);
      setForecast(nextForecast);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Dashboard refresh failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // First load, plus the lightweight summary poll.
  useEffect(() => {
    if (!user) return;
    void fetchData();
    const unsubscribe = subscribeSummary(
      (data) => {
        setSummary(data);
        setIsLive(true);
        setLastUpdated(new Date().toLocaleTimeString());
      },
      () => setIsLive(false)
    );
    return unsubscribe;
  }, [user, fetchData]);

  // Full refresh on a timer, and immediately whenever the user comes back to
  // the tab. Without the second half, a phone that has been locked shows
  // whatever was on screen when it was locked until the page is reloaded.
  useLiveRefresh(fetchData, REFRESH_MS, Boolean(user));

  const criticalCount = useMemo(
    () =>
      recommendations.filter((r) => Number(r.urgency_level) >= URGENT_LEVEL)
        .length,
    [recommendations]
  );

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }, [router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-[11px] tracking-[0.2em] text-accent">
          AUTHENTICATING...
        </p>
      </div>
    );
  }

  const roleLabel =
    user.role === "admin"
      ? t.role_admin
      : user.role === "operator"
        ? t.role_operator
        : t.role_viewer;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <DashboardNav
        user={user}
        roleLabel={roleLabel}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lang={lang}
        onLangChange={setLang}
        isLive={isLive}
        criticalCount={criticalCount}
        clock={clock}
        onLogout={() => void handleLogout()}
        t={t}
      />

      <main className="flex min-h-0 flex-1 flex-col">
        {activeTab === "live" ? (
          <>
            <KPICards summary={summary} loading={loading} t={t} />

            {/* Single column on phones; the sidebar only earns its own column at lg. */}
            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex min-w-0 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 overflow-auto">
                  <ConditionsTable
                    readings={readings}
                    loading={loading}
                    role={user.role}
                    t={t}
                  />
                </div>

                <div className="grid shrink-0 grid-cols-1 border-t border-line sm:grid-cols-2">
                  <div className="min-w-0 border-b border-line sm:border-b-0 sm:border-r">
                    <ForecastChart
                      forecast={forecast}
                      loading={loading}
                      t={t}
                    />
                  </div>
                  <div className="min-w-0">
                    <RiskPeriods
                      risks={summary?.upcoming_risks ?? []}
                      loading={loading}
                      t={t}
                    />
                  </div>
                </div>
              </div>

              <DashboardSidebar
                readings={readings}
                recommendations={recommendations}
                loading={loading}
                isLive={isLive}
                lastUpdated={lastUpdated}
                criticalCount={criticalCount}
                role={user.role}
                t={t}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-auto p-4 sm:p-5">
            <HistoryTab />
          </div>
        )}
      </main>

      <DashboardFooter t={t} />
    </div>
  );
}
