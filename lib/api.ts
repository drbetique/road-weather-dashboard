import {
  DashboardSummary,
  WeatherReading,
  Recommendation,
  ForecastPoint,
  MapData,
} from "@/types";

/**
 * All backend traffic goes through the same-origin Next.js proxy at
 * /api/proxy/*, which injects the backend API key server-side. No backend URL
 * or credential is exposed to the browser, so there is nothing to configure
 * with NEXT_PUBLIC_ here.
 */
export const API_BASE = "/api/proxy";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error: ${res.status} ${path}`);
  return res.json();
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return fetchJSON<DashboardSummary>("/dashboard/summary");
}

export async function getCurrentWeather(limit = 20): Promise<WeatherReading[]> {
  return fetchJSON<WeatherReading[]>(`/weather/current?limit=${limit}`);
}

export async function getRecommendations(
  minUrgency = 0
): Promise<Recommendation[]> {
  return fetchJSON<Recommendation[]>(
    `/recommendations?min_urgency=${minUrgency}`
  );
}

export async function getForecast(hours = 24): Promise<ForecastPoint[]> {
  return fetchJSON<ForecastPoint[]>(`/forecast?hours=${hours}`);
}

export async function getMapData(): Promise<MapData> {
  return fetchJSON<MapData>("/map/stations");
}

/**
 * Live dashboard updates.
 *
 * This replaces the previous WebSocket connection. Vercel's serverless
 * functions cannot hold a WebSocket open, so the browser would have had to
 * reach Render directly, bypassing the proxy and exposing the API key. Render
 * free instances also sleep after ~15 minutes idle, which drops the socket.
 * Polling through the proxy is resilient to both.
 *
 * Returns an unsubscribe function.
 */
export function subscribeSummary(
  onMessage: (data: DashboardSummary) => void,
  onError?: () => void,
  intervalMs = 30_000
): () => void {
  if (typeof window === "undefined") return () => {};

  let cancelled = false;

  const tick = async () => {
    // Skip while the tab is hidden. Browsers throttle timers in background
    // tabs anyway, and a request nobody will see just costs battery and
    // free-tier quota. useLiveRefresh fires a fresh fetch on return.
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }
    try {
      const data = await getDashboardSummary();
      if (!cancelled) onMessage(data);
    } catch {
      if (!cancelled) onError?.();
    }
  };

  void tick();
  const id = setInterval(tick, intervalMs);

  return () => {
    cancelled = true;
    clearInterval(id);
  };
}

export function exportToCSV(readings: WeatherReading[], filename: string) {
  const headers = [
    "Station",
    "Timestamp",
    "Air Temp (°C)",
    "Road Temp (°C)",
    "Friction",
    "Salt (g/m²)",
    "Road Condition",
    "Humidity (%)",
    "Wind (m/s)",
  ];

  const rows = readings.map((r) => [
    r.station_name,
    r.timestamp,
    r.air_temp ?? "",
    r.road_temp ?? "",
    r.friction ?? "",
    r.salt_amount ?? "",
    r.road_condition_text ?? "",
    r.humidity ?? "",
    r.wind_speed ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
