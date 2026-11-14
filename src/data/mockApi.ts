import metaJson from "@/back/mock-meta.json";
import alertsJson from "@/back/mock-alerts.json";
import dakarJson from "@/back/mock-point_dakar.json";
import niameyJson from "@/back/mock-point_niamey.json";
import ouagadougouJson from "@/back/mock-point_ouagadougou.json";
import signalsJson from "@/back/mock-signals.json";
import metricsJson from "@/back/mock-metrics.json";
import type {
  ForecastPayload,
  FramePayload,
  LayerId,
  LayerMeta,
  LocationId,
  PointPayload,
  PointSeriesRow,
  ViewMode,
} from "@/types/meteo";

const meta = metaJson as {
  dataset: { title: string; generated_at: string };
  region: { label: string; bbox: number[] };
  time: { default: string; available: string[] };
  layers: LayerMeta[];
  sources: { id: string; label: string; attribution: string }[];
};

const alerts = alertsJson as {
  time: string;
  severity: { level: string; label: string; score: number };
  indicators: {
    rain_mean_mm: number;
    clim_mean_mm: number;
    anomaly_pct: number;
    anomaly_z_mean: number;
    area_below_normal_pct: number;
    area_deficit_severe_pct: number;
  };
  classes: { id: string; label: string; area_pct: number; color: string }[];
  history: { time: string; anomaly_pct: number; level: string }[];
};

const points: Record<Exclude<LocationId, "world">, PointPayload> = {
  dakar: dakarJson as PointPayload,
  niamey: niameyJson as PointPayload,
  ouagadougou: ouagadougouJson as PointPayload,
};

export const datasetMeta = meta;
export const alertSnapshot = alerts;

export type SignalRow = {
  time: string;
  oni: number;
  tna: number;
  gog: number;
};

export type SignalsPayload = {
  status: string;
  note: string;
  units: Record<string, string>;
  labels: Record<string, string>;
  lags_months_literature: Record<string, number[]>;
  series: SignalRow[];
};

export type MetricRow = {
  id: string;
  label: string;
  kind: string;
  split: string;
  n: number;
  on: string;
  rmse: number | null;
  mae: number | null;
  bias: number | null;
  r2: number | null;
  nse: number | null;
  pbias: number | null;
  skill_vs_climatology: number | null;
  comment: string;
};

export type MetricsPayload = {
  status: string;
  note: string;
  target: string;
  models: MetricRow[];
};

export const oceanSignals = signalsJson as SignalsPayload;
export const modelMetrics = metricsJson as MetricsPayload;

export type SeriesChartRow = {
  time: string;
  label: string;
  observed: number | null;
  climatology: number | null;
  forecast: number | null;
  forecastLow: number | null;
  forecastHigh: number | null;
};

function avg(values: Array<number | null | undefined>) {
  const nums = values.filter((value): value is number => value != null);
  if (nums.length === 0) return null;
  return nums.reduce((sum, value) => sum + value, 0) / nums.length;
}

export function getSeriesChart(locationId: LocationId): {
  title: string;
  unit: string;
  rows: SeriesChartRow[];
  note: string;
} {
  const sources =
    locationId === "world"
      ? Object.values(points)
      : [points[locationId as Exclude<LocationId, "world">]];

  const byTime = new Map<string, PointSeriesRow[]>();
  for (const source of sources) {
    for (const row of source.series) {
      const list = byTime.get(row.time) ?? [];
      list.push(row);
      byTime.set(row.time, list);
    }
  }

  const rows: SeriesChartRow[] = [...byTime.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, group]) => ({
      time,
      label: time.slice(0, 7),
      observed: avg(group.map((row) => row.rain_mm)),
      climatology: avg(group.map((row) => row.clim_mm)),
      forecast: avg(group.map((row) => row.forecast_mm)),
      forecastLow: avg(group.map((row) => row.forecast_p10)),
      forecastHigh: avg(group.map((row) => row.forecast_p90)),
    }));

  return {
    title:
      locationId === "world"
        ? "Pluie mensuelle — moyenne des 3 villes (proxy régional)"
        : `Pluie mensuelle — ${sources[0].label}`,
    unit: "mm/mois",
    rows,
    note:
      locationId === "world"
        ? "Pas de série régionale unique dans le mock : moyenne de Dakar, Niamey et Ouagadougou. La climatologie (normale du mois) est toujours tracée."
        : "Observation, normale du mois, puis prévision à 1 et 3 mois avec fourchette p10–p90.",
  };
}

export function getLayerMeta(id: LayerId): LayerMeta | undefined {
  return meta.layers.find((layer) => layer.id === id);
}

export function layersForMode(mode: ViewMode): LayerId[] {
  if (mode === "forecast") {
    return ["rain_mm", "anomaly_mm", "prob_above_normal"];
  }
  return ["rain_mm", "anomaly_mm", "anomaly_pct", "anomaly_z"];
}

export function getPoint(id: LocationId): PointPayload | null {
  if (id === "world") return null;
  return points[id];
}

export async function loadObservationFrame(layer: LayerId): Promise<FramePayload> {
  const loaders: Record<string, () => Promise<{ default: unknown }>> = {
    rain_mm: () => import("@/back/mock-frames_rain_mm.json"),
    anomaly_mm: () => import("@/back/mock-frames_anomaly_mm.json"),
    anomaly_pct: () => import("@/back/mock-frames_anomaly_pct.json"),
    anomaly_z: () => import("@/back/mock-frames_anomaly_z.json"),
  };
  const loader = loaders[layer] ?? loaders.rain_mm;
  const mod = await loader();
  return mod.default as FramePayload;
}

export async function loadForecast(lead: 1 | 3): Promise<ForecastPayload> {
  const mod =
    lead === 1
      ? await import("@/back/mock-forecast_lead1.json")
      : await import("@/back/mock-forecast_lead3.json");
  return mod.default as ForecastPayload;
}

export type SidebarBar = {
  time: string;
  label: string;
  value: number;
  unit: string;
};

export type SidebarStats = {
  observation: number;
  forecast: number;
  total: number;
  unit: string;
  period: string;
  bars: SidebarBar[];
  note: string;
};

function lastObservations(series: PointPayload["series"], n = 6) {
  return series.filter((row) => row.kind === "observation").slice(-n);
}

function forecasts(series: PointPayload["series"]) {
  return series.filter((row) => row.kind === "forecast");
}

export function getSidebarStats(locationId: LocationId, mode: ViewMode): SidebarStats {
  const point = getPoint(locationId);

  if (!point) {
    const history = alerts.history.slice(-6);
    const observationValue = alerts.indicators.rain_mean_mm;
    const forecastValue = 99.6;
    const total = observationValue + 99.6 + 104.7;
    return {
      observation: observationValue,
      forecast: forecastValue,
      total,
      unit: "mm",
      period:
        mode === "observation"
          ? alerts.time
          : mode === "forecast"
            ? "1985-07-01"
            : "1985-06-01",
      bars:
        mode === "forecast"
          ? [
              { time: "1985-07-01", label: "07", value: 99.6, unit: "mm" },
              { time: "1985-09-01", label: "09", value: 104.7, unit: "mm" },
            ]
          : mode === "observation"
            ? alerts.classes.map((row) => ({
                time: row.id,
                label: row.label,
                value: row.area_pct,
                unit: "%",
              }))
            : history.slice(-4).map((row) => ({
                time: row.time,
                label: row.time.slice(5, 7),
                value: row.anomaly_pct,
                unit: "%",
              })),
      note: `Anomalie régionale ${alerts.indicators.anomaly_pct} % · ${alerts.severity.label}`,
    };
  }

  const obs = lastObservations(point.series);
  const fc = forecasts(point.series);
  const lastObs = obs[obs.length - 1];
  const forecastSum = fc.reduce((sum, row) => sum + (row.forecast_mm ?? 0), 0);
  const obsValue = lastObs?.rain_mm ?? 0;

  const forecastValue = fc[0]?.forecast_mm ?? 0;
  const total = obsValue + forecastSum;
  const forecastBars = fc.map((row) => ({
    time: row.time,
    label: row.time.slice(5, 7),
    value: row.forecast_mm ?? 0,
    unit: "mm",
  }));
  const observationBars = obs.map((row) => ({
    time: row.time,
    label: row.time.slice(5, 7),
    value: row.rain_mm ?? 0,
    unit: "mm",
  }));

  return {
    observation: obsValue,
    forecast: forecastValue,
    total,
    unit: "mm",
    period:
      mode === "forecast"
        ? (fc[0]?.time ?? "1985-07-01")
        : (lastObs?.time ?? meta.time.default),
    bars:
      mode === "forecast"
        ? forecastBars
        : mode === "total"
          ? [...observationBars.slice(-1), ...forecastBars]
          : observationBars,
    note:
      mode === "forecast"
        ? `Fourchette ${fc[0]?.forecast_p10 ?? "—"}–${fc[0]?.forecast_p90 ?? "—"} mm`
        : mode === "total"
          ? "Observation de juin + prévisions à 1 et 3 mois"
          : `Climatologie du mois : ${lastObs?.clim_mm ?? "—"} mm`,
  };
}
