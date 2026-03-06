"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/components/providers/Providers";
import { translations } from "@/lib/translations";
import { DashboardSummary } from "@/types";

interface KPICardsProps {
  summary: DashboardSummary | null;
  loading: boolean;
}

function forecastRiskToLabel(level: number, t: typeof translations.en) {
  if (level === 0) return { label: t.forecast_safe, color: "text-green-600 dark:text-green-400" };
  if (level <= 1) return { label: t.forecast_low, color: "text-green-500 dark:text-green-400" };
  if (level <= 2) return { label: t.forecast_moderate, color: "text-yellow-600 dark:text-yellow-400" };
  if (level <= 3) return { label: t.forecast_high, color: "text-orange-600 dark:text-orange-400" };
  return { label: t.forecast_critical, color: "text-red-600 dark:text-red-400" };
}

export function KPICards({ summary, loading }: KPICardsProps) {
  const { lang } = useLang();
  const t = translations[lang];

  const riskInfo = summary
    ? forecastRiskToLabel(summary.forecast_risk_level, t)
    : null;

  const cards = [
    {
      title: t.stations_monitored,
      subtitle: t.stations_subtitle,
      value: summary?.stations_count ?? "--",
      icon: "📡",
      color: "text-gray-800 dark:text-gray-100",
    },
    {
      title: t.treatment_needed,
      subtitle: t.treatment_subtitle,
      value: summary?.treatment_needed_count ?? "--",
      icon: "🧂",
      color: "text-orange-600 dark:text-orange-400",
    },
    {
      title: t.act_now,
      subtitle: t.act_now_subtitle,
      value: summary?.critical_count ?? "--",
      icon: "🚨",
      color: "text-red-600 dark:text-red-400",
    },
    {
      title: t.tonight_conditions,
      subtitle: t.forecast_subtitle,
      value: riskInfo?.label ?? "--",
      icon: "🌡️",
      color: riskInfo?.color ?? "text-blue-600 dark:text-blue-400",
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground font-medium truncate">
                    {card.title}
                  </p>
                  {loading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1" />
                  ) : (
                    <p className={`text-3xl font-bold mt-1 ${card.color} ${card.isText ? "text-xl" : ""}`}>
                      {card.value}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {card.subtitle}
                  </p>
                </div>
                <span className="text-3xl ml-2">{card.icon}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
