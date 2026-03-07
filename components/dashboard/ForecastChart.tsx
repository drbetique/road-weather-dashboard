"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/components/providers/Providers";
import { translations } from "@/lib/translations";
import { ForecastPoint } from "@/types";

interface ForecastChartProps {
  forecast: ForecastPoint[];
  loading: boolean;
}

export function ForecastChart({ forecast, loading }: ForecastChartProps) {
  const { lang } = useLang();
  const t = translations[lang];

  const data = forecast.map((f) => ({
    time: new Date(f.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    temperature: f.temperature,
    dew_point: f.dew_point,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span>📈</span> {t.forecast_24h}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t.chart_subtitle}</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                unit="°"
                className="fill-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number | undefined, name: string  | undefined) => [
                  `${value ?? 0}°C`,
                  name === "temperature" ? t.temperature : t.dew_point,
                ]}
              />
              <Legend
                formatter={(value) =>
                  value === "temperature" ? t.temperature : t.dew_point
                }
                wrapperStyle={{ fontSize: "12px" }}
              />
              <ReferenceLine
                y={0}
                stroke="#ef4444"
                strokeDasharray="4 2"
                label={{ value: "0°C", fontSize: 10, fill: "#ef4444" }}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="dew_point"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
