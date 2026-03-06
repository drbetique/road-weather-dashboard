"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/components/providers/Providers";
import { translations } from "@/lib/translations";
import { Recommendation, UserRole } from "@/types";

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  loading: boolean;
  role: UserRole;
}

const urgencyColors: Record<string, string> = {
  NONE: "bg-green-500",
  MONITOR: "bg-blue-500",
  PREVENTIVE: "bg-yellow-500",
  STANDARD: "bg-orange-500",
  URGENT: "bg-red-500",
  CRITICAL: "bg-red-700",
};

export function RecommendationsPanel({
  recommendations,
  loading,
  role,
}: RecommendationsPanelProps) {
  const { lang } = useLang();
  const t = translations[lang];

  function confidenceLabel(c: number) {
    if (c >= 0.8) return t.confidence_high;
    if (c >= 0.5) return t.confidence_medium;
    return t.confidence_low;
  }

  function translateUrgency(u: string) {
    return (t as Record<string, string>)[`urgency_${u}`] || u;
  }

  function translateTreatment(tr: string) {
    return (t as Record<string, string>)[`treatment_${tr}`] || tr;
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span>📋</span> {t.action_required}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t.rec_subtitle}</p>
      </CardHeader>
      <CardContent className="overflow-y-auto max-h-96 space-y-2 pr-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))
        ) : recommendations.length === 0 ? (
          <div className="text-center py-6 text-green-600 dark:text-green-400">
            <span className="text-3xl block mb-2">✅</span>
            <p className="text-sm font-medium">{t.all_roads_ok}</p>
          </div>
        ) : (
          recommendations.map((rec) => (
            <div
              key={rec.station_id}
              className={`border rounded-lg p-3 transition-colors ${
                rec.urgency_level >= 4
                  ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-sm truncate pr-2">
                  {rec.station_name}
                </span>
                <span
                  className={`text-xs text-white px-2 py-0.5 rounded-full shrink-0 ${
                    urgencyColors[rec.urgency] || "bg-gray-500"
                  }`}
                >
                  {translateUrgency(rec.urgency)}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground">
                {translateTreatment(rec.treatment_type)}
                {rec.salt_amount_gm2 && (
                  <span className="text-muted-foreground font-normal ml-1">
                    ({rec.salt_amount_gm2} g/m²)
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {confidenceLabel(rec.confidence)} &nbsp;·&nbsp; {t.recheck}{" "}
                {rec.next_check_minutes} {t.minutes}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
