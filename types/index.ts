export type UserRole = "admin" | "operator" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Station {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  collection_status: string;
  urgency: string;
  urgency_level: number;
  treatment: string;
  air_temp: number | null;
  road_temp: number | null;
  friction: number | null;
}

export interface WeatherReading {
  station_id: number;
  station_name: string;
  timestamp: string;
  air_temp: number | null;
  road_temp: number | null;
  friction: number | null;
  salt_amount: number | null;
  road_condition: number | null;
  road_condition_text: string | null;
  humidity: number | null;
  wind_speed: number | null;
}

export interface Recommendation {
  station_id: number;
  station_name: string;
  urgency: string;
  urgency_level: number;
  treatment_type: string;
  salt_amount_gm2: number | null;
  confidence: number;
  next_check_minutes: number;
  reasons: string[];
}

export interface ForecastPoint {
  timestamp: string;
  temperature: number | null;
  dew_point: number | null;
  humidity: number | null;
  wind_speed: number | null;
  precipitation_1h: number | null;
}

export interface RiskPeriod {
  start: string;
  end: string;
  max_risk_level: number;
  risk_types: string[];
  factors: string[];
}

export interface DashboardSummary {
  stations_count: number;
  treatment_needed_count: number;
  critical_count: number;
  forecast_risk_level: number;
  timestamp: string;
  priority_station: string | null;
  upcoming_risks: RiskPeriod[];
}

export interface MapMarker {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance_km: number;
  urgency: string;
  urgency_level: number;
  treatment: string;
  air_temp: number | null;
  road_temp: number | null;
  friction: number | null;
}

export interface MapData {
  markers: MapMarker[];
}
