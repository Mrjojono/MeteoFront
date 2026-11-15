export type LayerId =
  | "rain_mm"
  | "anomaly_mm"
  | "anomaly_pct"
  | "anomaly_z"
  | "prob_above_normal";

export type ViewMode = "observation" | "forecast" | "total";

export type DashboardScreen = "map" | "series" | "signals" | "metrics" | "limits";

export type LocationId = "world" | "dakar" | "niamey" | "ouagadougou";

export type PaletteStop = {
  value: number;
  color: string;
};

export type LayerMeta = {
  id: string;
  label: string;
  unit: string;
  range: { min: number; max: number };
  precision: number;
  palette: { kind: string; stops: PaletteStop[] };
  legend: { ticks: number[]; labels?: string[] };
  scope: string[];
  available: boolean;
};

export type GridSpec = {
  nx: number;
  ny: number;
  resolution: number;
  lon: { start: number; step: number; count: number };
  lat: { start: number; step: number; count: number };
  layout: string;
};

export type PointSeriesRow = {
  time: string;
  kind: "observation" | "forecast";
  rain_mm: number | null;
  clim_mm: number | null;
  anomaly_mm: number | null;
  anomaly_z: number | null;
  forecast_mm: number | null;
  forecast_p10: number | null;
  forecast_p90: number | null;
};

export type PointPayload = {
  label: string;
  cell: { lat: number; lon: number };
  unit: string;
  series: PointSeriesRow[];
};
