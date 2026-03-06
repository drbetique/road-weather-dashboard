import {
  DashboardSummary,
  WeatherReading,
  Recommendation,
  ForecastPoint,
  MapData,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
  });
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

export function createWebSocket(
  onMessage: (data: DashboardSummary) => void,
  onError?: () => void
): WebSocket | null {
  if (typeof window === "undefined") return null;
  try {
    const ws = new WebSocket(`${WS_BASE}/ws`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        // ignore parse errors
      }
    };
    ws.onerror = () => onError?.();
    return ws;
  } catch {
    return null;
  }
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
