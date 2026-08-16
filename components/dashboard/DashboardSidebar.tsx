"use client";

import { useState } from "react";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { RecommendationsPanel } from "@/components/dashboard/RecommendationsPanel";
import { SensorPanel } from "@/components/dashboard/SensorPanel";
import { SystemStatus } from "@/components/dashboard/SystemStatus";
import type { Translations } from "@/lib/translations";
import type { Recommendation, UserRole, WeatherReading } from "@/types";

type SidebarTab = "sensors" | "alerts" | "maintenance";

interface DashboardSidebarProps {
  readonly readings: readonly WeatherReading[];
  readonly recommendations: readonly Recommendation[];
  readonly loading: boolean;
  readonly isLive: boolean;
  readonly lastUpdated: string;
  readonly criticalCount: number;
  readonly role: UserRole;
  readonly t: Translations;
}

export function DashboardSidebar({
  readings,
  recommendations,
  loading,
  isLive,
  lastUpdated,
  criticalCount,
  role,
  t,
}: DashboardSidebarProps) {
  const [tab, setTab] = useState<SidebarTab>("sensors");

  const tabs = [
    { id: "sensors", label: t.station },
    {
      id: "alerts",
      label: `${t.priority_alert}${criticalCount > 0 ? ` (${criticalCount})` : ""}`,
    },
    { id: "maintenance", label: t.action_required },
  ] as const satisfies readonly { id: SidebarTab; label: string }[];

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden border-t border-line bg-surface-2 lg:border-t-0 lg:border-l">
      <div className="flex shrink-0 border-b border-line" role="tablist">
        {tabs.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.id)}
              className={`flex-1 cursor-pointer border-0 border-b-2 bg-transparent px-1 py-2.5 text-[8px] uppercase tracking-[0.08em] transition-colors ${
                selected
                  ? "border-b-accent text-accent"
                  : "border-b-transparent text-ink-dim hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-2">
        {tab === "sensors" && (
          <SensorPanel readings={readings} loading={loading} t={t} />
        )}
        {tab === "alerts" && (
          <AlertsPanel
            recommendations={recommendations}
            loading={loading}
            t={t}
          />
        )}
        {tab === "maintenance" && (
          <RecommendationsPanel
            recommendations={[...recommendations]}
            loading={loading}
            role={role}
            t={t}
            compact
          />
        )}
      </div>

      <SystemStatus
        isLive={isLive}
        loading={loading}
        lastUpdated={lastUpdated}
        t={t}
      />
    </aside>
  );
}
