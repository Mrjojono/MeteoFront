import { fetchMeta, fetchAlerts, fetchFrames, fetchForecast, fetchPoint, fetchSignals, fetchMetrics } from "@/data/api";
import type { Meta, Alerts, Frames, Forecast, Point, Signals, Metrics } from "@/data/api";
import type {
  LayerId,
  LayerMeta,
  LocationId,
  PointPayload,
  PointSeriesRow,
  ViewMode,
} from "@/types/meteo";

/* ── Cache meta + alerts (chargés depuis l'API, partagés via module) ── */

let _meta: Meta | null = null;
let _alerts: Alerts | null = null;
let _metaPromise: Promise<Meta> | null = null;
let _alertsPromise: Promise<Alerts> | null = null;

export async function ensureMeta(): Promise<Meta> {
  if (_meta) return _meta;
  if (!_metaPromise) {
    _metaPromise = fetchMeta().then((data) => {
      _meta = data;
      return data;
    });
  }
  return _metaPromise;
}

export async function ensureAlerts(): Promise<Alerts> {
  if (_alerts) return _alerts;
  if (!_alertsPromise) {
    _alertsPromise = fetchAlerts().then((data) => {
      _alerts = data;
      return data;
    });
  }
  return _alertsPromise;
}

export function getMeta(): Meta | null {
  return _meta;
}

export function getAlertSnapshot(): Alerts | null {
  return _alerts;
}

/* ── Points (API /api/point — préchargés au démarrage) ── */

const CITY_COORDS: Record<Exclude<LocationId, "world">, { lat: number; lon: number }> = {
  dakar: { lat: 14.7, lon: -17.4 },
  niamey: { lat: 13.5, lon: 2.1 },
  ouagadougou: { lat: 12.4, lon: -1.5 },
};

const _points: Partial<Record<Exclude<LocationId, "world">, Point>> = {};
let _pointsPromise: Promise<void> | null = null;

export async function ensurePoints(): Promise<void> {
  if (_pointsPromise) return _pointsPromise;
  const ids = Object.keys(CITY_COORDS) as Exclude<LocationId, "world">[];
  _pointsPromise = Promise.all(
    ids.map(async (id) => {
      const { lat, lon } = CITY_COORDS[id];
      _points[id] = await fetchPoint(lat, lon);
    }),
  ).then(() => {});
  return _pointsPromise;
}

/* ── Signals + Metrics (API — étape 5) ── */

let _signals: Signals | null = null;
let _metrics: Metrics | null = null;
let _signalsPromise: Promise<Signals | null> | null = null;
let _metricsPromise: Promise<Metrics | null> | null = null;
let _signalsMissing = false;
let _metricsMissing = false;

export async function ensureSignals(): Promise<Signals | null> {
  if (_signals) return _signals;
  if (_signalsMissing) return null;
  if (!_signalsPromise) {
    _signalsPromise = fetchSignals()
      .then((data) => {
        _signals = data;
        return data;
      })
      .catch(() => {
        _signalsMissing = true;
        _signalsPromise = null;
        return null;
      });
  }
  return _signalsPromise;
}

export async function ensureMetrics(): Promise<Metrics | null> {
  if (_metrics) return _metrics;
  if (_metricsMissing) return null;
  if (!_metricsPromise) {
    _metricsPromise = fetchMetrics()
      .then((data) => {
        _metrics = data;
        return data;
      })
      .catch(() => {
        _metricsMissing = true;
        _metricsPromise = null;
        return null;
      });
  }
  return _metricsPromise;
}

export function getSignals(): Signals | null {
  return _signals;
}

export function signalsMissing(): boolean {
  return _signalsMissing;
}

export function getMetrics(): Metrics | null {
  return _metrics;
}

export function metricsMissing(): boolean {
  return _metricsMissing;
}

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
  const cityIds = Object.keys(CITY_COORDS) as Exclude<LocationId, "world">[];
  const sources =
    locationId === "world"
      ? cityIds.map((id) => _points[id]).filter((p): p is Point => p != null)
      : [_points[locationId as Exclude<LocationId, "world">]].filter(
          (p): p is Point => p != null,
        );

  if (sources.length === 0) {
    return {
      title: "Pluie mensuelle",
      unit: "mm/mois",
      rows: [],
      note: "Chargement des données…",
    };
  }

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
        ? "Moyenne de Dakar, Niamey et Ouagadougou. La climatologie (normale du mois) est toujours tracée."
        : "Observation, normale du mois, puis prévision à 1 et 3 mois avec fourchette p10–p90.",
  };
}

export function getLayerMeta(id: LayerId): LayerMeta | undefined {
  if (!_meta) return undefined;
  return _meta.layers.find((layer) => layer.id === id) as LayerMeta | undefined;
}

export function layersForMode(mode: ViewMode): LayerId[] {
  if (mode === "forecast") {
    return ["rain_mm", "anomaly_mm", "prob_above_normal"];
  }
  return ["rain_mm", "anomaly_mm", "anomaly_pct", "anomaly_z"];
}

export function getPoint(id: LocationId): PointPayload | null {
  if (id === "world") return null;
  return _points[id] ?? null;
}

export async function loadObservationFrame(layer: LayerId): Promise<Frames> {
  return fetchFrames(layer);
}

export async function loadForecast(lead: 1 | 3): Promise<Forecast> {
  return fetchForecast(lead);
}

export type SidebarBar = {
  time: string;
  label: string;
  value: number;
  unit: string;
  caption?: string;
};

const _forecasts: Partial<Record<1 | 3, Forecast>> = {};
let _forecastsPromise: Promise<void> | null = null;

export async function ensureForecasts(): Promise<void> {
  if (_forecasts[1] && _forecasts[3]) return;
  if (!_forecastsPromise) {
    _forecastsPromise = Promise.all([fetchForecast(1), fetchForecast(3)]).then(([lead1, lead3]) => {
      _forecasts[1] = lead1;
      _forecasts[3] = lead3;
    });
  }
  return _forecastsPromise;
}

export function getForecastWindow() {
  return {
    start: _forecasts[1]?.target ?? "1985-07-01",
    end: _forecasts[3]?.target ?? "1985-09-01",
  };
}

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
    if (!_alerts) {
      return {
        observation: 0,
        forecast: 0,
        total: 0,
        unit: "mm",
        period: "",
        bars: [],
        note: "Chargement des données…",
      };
    }
    const history = _alerts.history.slice(-6);
    const observationValue = _alerts.indicators.rain_mean_mm ?? 0;
    const lead1 = _forecasts[1]?.summary.region_mean_mm ?? null;
    const lead3 = _forecasts[3]?.summary.region_mean_mm ?? null;
    const forecastValue = lead1 ?? 0;
    const total = observationValue + (lead3 ?? 0);
    const window = getForecastWindow();
    return {
      observation: observationValue,
      forecast: forecastValue,
      total,
      unit: "mm",
      period:
        mode === "observation"
          ? _alerts.time
          : mode === "forecast"
            ? window.start
            : _alerts.time,
      bars:
        mode === "forecast"
          ? [
              {
                time: window.start,
                label: window.start.slice(5, 7),
                value: forecastValue,
                unit: "mm",
              },
              {
                time: window.end,
                label: "3 mois",
                value: lead3 ?? 0,
                unit: "mm",
                caption: "3 mois",
              },
            ]
          : mode === "observation"
            ? _alerts.classes.map((row) => ({
                time: row.id,
                label: row.label,
                value: row.area_pct,
                unit: "%",
              }))
            : history.slice(-4).map((row) => ({
                time: row.time,
                label: row.time.slice(5, 7),
                value: row.anomaly_pct ?? 0,
                unit: "%",
              })),
      note:
        mode === "forecast"
          ? `Juillet : moyenne régionale du modèle à 1 mois. La barre « 3 mois » est la somme juillet–septembre (${lead3 ?? "—"} mm), pas le mois de septembre seul.`
          : `Anomalie régionale ${_alerts.indicators.anomaly_pct ?? "—"} % · ${_alerts.severity.label}`,
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
