"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { KPICards } from "@/components/dashboard/KPICards";
import { ConditionsTable } from "@/components/dashboard/ConditionsTable";
import { RecommendationsPanel } from "@/components/dashboard/RecommendationsPanel";
import { ForecastChart } from "@/components/dashboard/ForecastChart";
import { RiskPeriods } from "@/components/dashboard/RiskPeriods";
import { HistoryTab } from "@/components/dashboard/HistoryTab";
import { useNotifications } from "@/lib/useNotifications";
import { translations } from "@/lib/translations";
import { useLang } from "@/components/providers/Providers";
import type { Lang } from "@/lib/translations";
import {
  getDashboardSummary,
  getCurrentWeather,
  getRecommendations,
  getForecast,
  subscribeSummary,
} from "@/lib/api";
import {
  DashboardSummary,
  WeatherReading,
  Recommendation,
  ForecastPoint,
  User,
} from "@/types";

type Tab = "live" | "history";
type SidebarTab = "sensors" | "alerts" | "maintenance";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("live");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("sensors");
  const { lang, setLang } = useLang();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [readings, setReadings] = useState<WeatherReading[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [clock, setClock] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const t = translations[lang];
  const { permission, requestPermission } = useNotifications(summary);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setClock(`${h}:${m}:${s} EET`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function getUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) { router.push("/"); return; }
        const data = await res.json();
        setUser(data.user);
      } catch { router.push("/"); }
    }
    getUser();
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      const [s, r, rec, f] = await Promise.all([
        getDashboardSummary(),
        getCurrentWeather(20),
        getRecommendations(0),
        getForecast(24),
      ]);
      setSummary(s);
      setReadings(r);
      setRecommendations(rec);
      setForecast(f);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchData();
    const interval = setInterval(fetchData, 60000);
    const unsubscribe = subscribeSummary(
      (data) => { setSummary(data); setIsLive(true); setLastUpdated(new Date().toLocaleTimeString()); },
      () => setIsLive(false)
    );
    return () => { clearInterval(interval); unsubscribe(); };
  }, [user, fetchData]);

  if (!user) return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "Space Mono, monospace", color: "var(--cyan)", fontSize: "11px", letterSpacing: "0.2em" }}>
        AUTHENTICATING...
      </div>
    </div>
  );

  const criticalCount = recommendations.filter(r => Number(r.urgency) >= 4).length;
  const roleLabel = user.role === "admin" ? t.role_admin
    : user.role === "operator" ? t.role_operator
    : t.role_viewer;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", fontFamily: "Space Mono, monospace", display: "flex", flexDirection: "column" }}>

      {/* TOP NAV */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: "52px", background: "var(--bg2)",
        borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "32px", height: "32px", border: "1px solid var(--cyan)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ fontSize: "16px" }}>🛣️</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-bright)", letterSpacing: "0.05em" }}>
              {t.app_title.toUpperCase()}
            </div>
            <div style={{ fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {t.app_subtitle}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Tab switcher */}
          <div style={{ display: "flex", gap: "2px", background: "var(--bg3)", border: "1px solid var(--border)", padding: "3px" }}>
            {(["live", "history"] as Tab[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "4px 14px", fontSize: "9px", letterSpacing: "0.15em",
                textTransform: "uppercase", cursor: "pointer", border: "none",
                background: activeTab === tab ? "var(--cyan-dim)" : "transparent",
                color: activeTab === tab ? "var(--cyan)" : "var(--text-dim)",
                borderBottom: activeTab === tab ? "1px solid var(--cyan)" : "1px solid transparent",
              }}>
                {tab === "live" ? `⚡ ${t.live}` : `📊 ${t.history}`}
              </button>
            ))}
          </div>

          {/* Language toggle */}
          <div style={{ display: "flex", gap: "2px", background: "var(--bg3)", border: "1px solid var(--border)", padding: "3px" }}>
            {(["en", "fi"] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: "3px 8px", fontSize: "9px", letterSpacing: "0.1em",
                textTransform: "uppercase", cursor: "pointer", border: "none",
                background: lang === l ? "var(--cyan-dim)" : "transparent",
                color: lang === l ? "var(--cyan)" : "var(--text-dim)",
              }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "9px", color: isLive ? "var(--green)" : "var(--text-dim)" }}>
            <div style={{
              width: "5px", height: "5px", borderRadius: "50%",
              background: isLive ? "var(--green)" : "var(--text-dim)",
              boxShadow: isLive ? "0 0 6px var(--green)" : "none",
              animation: isLive ? "blink 1.5s infinite" : "none",
            }} />
            {isLive ? t.live.toUpperCase() : "POLLING"}
          </div>

          {/* Critical alerts */}
          {criticalCount > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "var(--red-dim)", border: "1px solid var(--red)",
              padding: "4px 10px", fontSize: "10px", color: "var(--red)", letterSpacing: "0.1em",
            }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--red)", animation: "blink 1s infinite" }} />
              {criticalCount} {t.urgency_CRITICAL.toUpperCase()}
            </div>
          )}

          {/* Clock */}
          <div style={{ fontSize: "11px", color: "var(--cyan)", letterSpacing: "0.08em" }}>{clock}</div>

          {/* User + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>{user.name}</div>
              <div style={{ fontSize: "8px", color: "var(--text-dim)", opacity: 0.6 }}>{roleLabel}</div>
            </div>
            <button
              onClick={async () => { await fetch("/api/auth", { method: "DELETE" }); router.push("/"); }}
              style={{
                background: "none", border: "1px solid var(--border)", color: "var(--text-dim)",
                padding: "3px 8px", fontSize: "9px", cursor: "pointer", letterSpacing: "0.1em",
              }}
            >
              {t.logout.toUpperCase()}
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeTab === "live" ? (
          <>
            <KPICards summary={summary} loading={loading} t={t} />

            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 300px", overflow: "hidden", minHeight: 0 }}>

              {/* LEFT */}
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--border)" }}>
                <div style={{ flex: 1, overflow: "auto" }}>
                  <ConditionsTable readings={readings} loading={loading} role={user.role as string} t={t} />
                </div>
                <div style={{ borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", flexShrink: 0, height: "220px" }}>
                  <div style={{ borderRight: "1px solid var(--border)" }}>
                    <ForecastChart forecast={forecast} loading={loading} t={t} />
                  </div>
                  <div>
                    <RiskPeriods risks={summary?.upcoming_risks ?? []} loading={loading} t={t} />
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL */}
              <div style={{ background: "var(--bg2)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
                  {([
                    { id: "sensors" as SidebarTab, label: t.station },
                    { id: "alerts" as SidebarTab, label: `${t.priority_alert}${criticalCount > 0 ? ` (${criticalCount})` : ""}` },
                    { id: "maintenance" as SidebarTab, label: t.action_required },
                  ]).map(tab => (
                    <button key={tab.id} onClick={() => setSidebarTab(tab.id)} style={{
                      flex: 1, padding: "10px 4px", fontSize: "8px", letterSpacing: "0.08em",
                      textTransform: "uppercase", cursor: "pointer", border: "none",
                      background: "transparent",
                      color: sidebarTab === tab.id ? "var(--cyan)" : "var(--text-dim)",
                      borderBottom: sidebarTab === tab.id ? "2px solid var(--cyan)" : "2px solid transparent",
                    }}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div style={{ flex: 1, overflow: "auto", padding: "8px" }}>
                  {sidebarTab === "sensors" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {readings.slice(0, 8).map((r, i) => (
                        <div key={i} style={{ background: "var(--bg3)", border: "1px solid var(--border)", padding: "10px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ fontSize: "10px", color: "var(--text-bright)", fontWeight: 700 }}>
                              {r.station_name}
                            </span>
                            <span style={{
                              fontSize: "8px", padding: "2px 6px", textTransform: "uppercase", letterSpacing: "0.1em",
                              background: "var(--green-dim)", color: "var(--green)", border: "1px solid var(--green)",
                            }}>ONLINE</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                            <div>
                              <div style={{ fontSize: "8px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>{t.air_temp}</div>
                              <div style={{ fontSize: "14px", fontWeight: 700, color: r.air_temp !== null && r.air_temp <= 0 ? "var(--cyan)" : "var(--amber)" }}>
                                {r.air_temp !== null ? `${r.air_temp}°C` : "—"}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: "8px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>{t.road_temp}</div>
                              <div style={{ fontSize: "14px", fontWeight: 700, color: r.road_temp !== null && r.road_temp <= 0 ? "var(--red)" : "var(--text-bright)" }}>
                                {r.road_temp !== null ? `${r.road_temp}°C` : "—"}
                              </div>
                            </div>
                          </div>
                          <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{
                              fontSize: "9px", padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700,
                              background: r.friction !== null && r.friction < 0.3 ? "var(--red-dim)" : "var(--green-dim)",
                              color: r.friction !== null && r.friction < 0.3 ? "var(--red)" : "var(--green)",
                              border: `1px solid ${r.friction !== null && r.friction < 0.3 ? "var(--red)" : "var(--green)"}`,
                            }}>
                              {r.road_condition_text ?? t.no_sensor}
                            </span>
                            <span style={{ fontSize: "9px", color: "var(--text-dim)" }}>μ = {r.friction ?? "—"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {sidebarTab === "alerts" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {recommendations.filter(r => Number(r.urgency) >= 3).length === 0 ? (
                        <div style={{ padding: "24px", textAlign: "center", color: "var(--green)", fontSize: "10px" }}>
                          ✓ {t.all_roads_ok}
                        </div>
                      ) : recommendations.filter(r => Number(r.urgency) >= 3).map((rec, i) => (
                        <div key={i} style={{
                          padding: "10px 12px", borderBottom: "1px solid var(--border)",
                          borderLeft: `2px solid ${Number(rec.urgency) >= 4 ? "var(--red)" : "var(--amber)"}`,
                          background: Number(rec.urgency) >= 4 ? "var(--red-dim)" : "var(--amber-dim)",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: Number(rec.urgency) >= 4 ? "var(--red)" : "var(--amber)" }}>
                              ⚠ {rec.treatment_type?.replace(/_/g, " ").toUpperCase()}
                            </span>
                            <span style={{
                              fontSize: "8px", padding: "1px 5px", textTransform: "uppercase", letterSpacing: "0.1em",
                              background: Number(rec.urgency) >= 4 ? "var(--red-dim)" : "var(--amber-dim)",
                              color: Number(rec.urgency) >= 4 ? "var(--red)" : "var(--amber)",
                              border: `1px solid ${Number(rec.urgency) >= 4 ? "var(--red)" : "var(--amber)"}`,
                            }}>
                              {Number(rec.urgency) >= 4 ? t.urgency_CRITICAL : t.urgency_URGENT}
                            </span>
                          </div>
                          <div style={{ fontSize: "9px", color: "var(--text-dim)" }}>📍 {rec.station_name}</div>
                          <div style={{ fontSize: "9px", color: "var(--text-dim)", marginTop: "2px" }}>
                            {rec.salt_amount_gm2} g/m²
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {sidebarTab === "maintenance" && (
                    <RecommendationsPanel recommendations={recommendations} loading={loading} role={user.role as string} t={t} compact />
                  )}
                </div>

                {/* System status */}
                <div style={{ borderTop: "1px solid var(--border)", padding: "10px 12px", flexShrink: 0 }}>
                  <div style={{ fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>
                    {t.status}
                  </div>
                  {[
                    { label: "API", ok: true },
                    { label: "WebSocket", ok: isLive },
                    { label: "Database", ok: !loading },
                  ].map(s => (
                    <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px", fontSize: "10px" }}>
                      <span style={{ color: "var(--text-dim)" }}>
                        <span style={{
                          display: "inline-block", width: "6px", height: "6px", borderRadius: "50%",
                          background: s.ok ? "var(--green)" : "var(--amber)",
                          boxShadow: s.ok ? "0 0 6px var(--green)" : "0 0 6px var(--amber)",
                          marginRight: "6px", verticalAlign: "middle",
                        }} />
                        {s.label}
                      </span>
                      <span style={{ color: s.ok ? "var(--green)" : "var(--amber)", fontSize: "9px" }}>
                        {s.ok ? "ONLINE" : "SYNC"}
                      </span>
                    </div>
                  ))}
                  {lastUpdated && (
                    <div style={{ fontSize: "8px", color: "var(--text-dim)", marginTop: "6px", letterSpacing: "0.08em" }}>
                      {t.last_updated.toUpperCase()} {lastUpdated}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
            <HistoryTab />
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{
        borderTop: "1px solid var(--border)", padding: "8px 20px",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg2)", flexShrink: 0,
      }}>
        <span style={{ fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {t.footer_project} · {t.footer_institution} · {t.footer_sources}
        </span>
      </footer>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>
    </div>
  );
}
