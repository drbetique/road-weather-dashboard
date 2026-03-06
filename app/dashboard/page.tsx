"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { KPICards } from "@/components/dashboard/KPICards";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { RecommendationsPanel } from "@/components/dashboard/RecommendationsPanel";
import { ConditionsTable } from "@/components/dashboard/ConditionsTable";
import { ForecastChart } from "@/components/dashboard/ForecastChart";
import { RiskPeriods } from "@/components/dashboard/RiskPeriods";
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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [readings, setReadings] = useState<WeatherReading[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  // Get user from cookie via API
  useEffect(() => {
    async function getUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/");
          return;
        }
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

  // Initial fetch
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // WebSocket for live updates
  useEffect(() => {
    const ws = createWebSocket(
      (data) => {
        setSummary(data);
        setLastUpdated(new Date().toLocaleTimeString());
        setIsLive(true);
      },
      () => {
        setIsLive(false);
      }
    );

    // Poll every 60s as fallback
    const interval = setInterval(fetchAll, 60000);

    return () => {
      ws?.close();
      clearInterval(interval);
    };
  }, [fetchAll]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header user={user} isLive={isLive} lastUpdated={lastUpdated} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <KPICards summary={summary} loading={loading} />

        <AlertBanner summary={summary} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <ConditionsTable
              readings={readings}
              loading={loading}
              role={user.role}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <RecommendationsPanel
              recommendations={recommendations}
              loading={loading}
              role={user.role}
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <ForecastChart forecast={forecast} loading={loading} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <RiskPeriods
            risks={summary?.upcoming_risks ?? []}
            loading={loading}
          />
        </motion.div>
      </main>

      <footer className="bg-gray-800 dark:bg-gray-900 text-gray-400 py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-xs space-y-1">
          <p>Tiesääseurantajärjestelmä</p>
          <p>Tiedot: Digitraffic (Fintraffic) ja Ilmatieteen laitoksen avoin data</p>
          <p>Tietolähteet: Fintraffic Digitraffic, Ilmatieteen laitos</p>
        </div>
      </footer>
    </div>
  );
}
