"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/components/providers/Providers";
import { translations } from "@/lib/translations";
import { RiskPeriod } from "@/types";

interface RiskPeriodsProps {
  risks: RiskPeriod[];
  loading: boolean;
}

function riskLevelToInfo(level: number, t: typeof translations.en) {
  if (level <= 1) return { label: t.risk_low, badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", border: "border-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950" };
  if (level <= 3) return { label: t.risk_medium, badge: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", border: "border-orange-400", bg: "bg-orange-50 dark:bg-orange-950" };
  return { label: t.risk_high, badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", border: "border-red-500", bg: "bg-red-50 dark:bg-red-950" };
}

export function RiskPeriods({ risks, loading }: RiskPeriodsProps) {
  const { lang } = useLang();
  const t = translations[lang];
  const locale = lang === "fi" ? "fi-FI" : "en-GB";

  function formatDateTime(dt: Date, sameDay: boolean, isEnd: boolean) {
    const time = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (!isEnd || sameDay) return time;
    const date = dt.toLocaleDateString(locale, { day: "numeric", month: "short" });
    return `${time} ${date}`;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span>⏰</span> {t.upcoming_risks}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t.risk_subtitle}</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : risks.length === 0 ? (
          <div className="text-center py-6 text-green-600 dark:text-green-400">
            <span className="text-3xl block mb-2">✅</span>
            <p className="text-sm font-medium">{t.no_risk_periods}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {risks.map((risk, i) => {
              const startDt = new Date(risk.start);
              const endDt = new Date(risk.end);
              const sameDay = startDt.toDateString() === endDt.toDateString();
              const info = riskLevelToInfo(risk.max_risk_level, t);

              return (
                <div
                  key={i}
                  className={`border-l-4 ${info.border} ${info.bg} p-4 rounded-r-lg`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-foreground">
                      {formatDateTime(startDt, sameDay, false)} -{" "}
                      {formatDateTime(endDt, sameDay, true)}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${info.badge}`}>
                      {info.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {t.apply_salt_before}{" "}
                    {startDt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {risk.risk_types.map((type) => (
                      <span
                        key={type}
                        className="text-xs bg-background border border-border px-2 py-0.5 rounded"
                      >
                        {(t as Record<string, string>)[type] || type}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
