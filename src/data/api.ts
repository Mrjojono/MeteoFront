/**
 * Client API — connexion au backend FastAPI (pluie prévue).
 *
 * Toutes les fonctions retournent une Promise et utilisent `fetch` natif.
 * La base URL est configurable via VITE_API_BASE_URL (défaut : "/api").
 * En dev, le proxy Vite (vite.config.ts) forward "/api" → http://localhost:8000.
 */

import type { LayerId, GridSpec, PaletteStop, PointSeriesRow } from "@/types/meteo";

/* ── Types des réponses (contrat backend, cf. Nasa/contract/schema.json) ── */

export type NullableNumber = number | null;

/** Couche complète servie par /api/meta */
export type ApiLayer = {
  id: string;
  label: string;
  unit: string;
  type: "continuous" | "categorical";
  value_scale: "linear" | "sqrt" | "log";
  range: { min: number; max: number };
  clamp?: boolean;
  precision: number;
  palette: { kind: "sequential" | "diverging" | "categorical"; stops: PaletteStop[] };
  legend: { ticks: number[]; labels?: string[] };
  scope: string[];
  available: boolean;
  reason?: string;
};

export type Meta = {
  resource: "meta";
  contract_version: string;
  dataset: { id: string; title: string; product: string; generated_at: string; language: string };
  region: { id: string; label: string; bbox: number[]; crs: string };
  grid: GridSpec;
  time: { step: string; start: string; end: string; available: string[]; default: string };
  layers: ApiLayer[];
  sources: { id: string; label: string; url: string; attribution: string }[];
  render: { mode: string; tile_url: string | null; style: string };
};

export type FrameStats = {
  min: NullableNumber;
  max: NullableNumber;
  mean: NullableNumber;
  valid: number;
  coverage: number;
};

export type Frame = {
  time: string;
  values: NullableNumber[];
  stats: FrameStats;
};

export type Frames = {
  resource: "frames";
  contract_version: string;
  layer: string;
  unit: string;
  grid: GridSpec;
  frames: Frame[];
};

export type ForecastLayer = {
  values: NullableNumber[];
  p10?: NullableNumber[];
  p90?: NullableNumber[];
};

export type LeadScore = {
  rmse: NullableNumber;
  mae: NullableNumber;
  bias: NullableNumber;
  skill_vs_climatology: NullableNumber;
  n: number;
};

export type ForecastModel = {
  id: string;
  label: string;
  kind: string;
  status: string;
  version: string;
  training: {
    start: string;
    end: string;
    parameters: Record<string, string | number | boolean>;
  };
  evaluation?: {
    method: string;
    per_lead: Record<string, LeadScore>;
  };
};

export type ForecastSummary = {
  region_mean_mm: NullableNumber;
  region_clim_mm: NullableNumber;
  region_anomaly_pct: NullableNumber;
  prob_wetter_than_normal: NullableNumber;
  area_wetter_pct: NullableNumber;
  area_drier_pct: NullableNumber;
};

export type Forecast = {
  resource: "forecast";
  contract_version: string;
  model: ForecastModel;
  issued_at: string;
  target: string;
  lead_months: number;
  grid: GridSpec;
  layers: Record<string, ForecastLayer>;
  summary: ForecastSummary;
  baseline: { id: string; label: string; rmse: NullableNumber };
};

export type Point = {
  resource: "point";
  contract_version: string;
  cell: { lat: number; lon: number; is_land: boolean };
  label: string;
  unit: string;
  series: PointSeriesRow[];
};

export type AlertLevel = "none" | "low" | "moderate" | "high" | "extreme";

export type Alerts = {
  resource: "alerts";
  contract_version: string;
  time: string;
  severity: { level: AlertLevel; label: string; score: number };
  indicators: {
    rain_mean_mm: NullableNumber;
    clim_mean_mm: NullableNumber;
    anomaly_pct: NullableNumber;
    anomaly_z_mean: NullableNumber;
    area_below_normal_pct: NullableNumber;
    area_deficit_severe_pct: NullableNumber;
  };
  classes: { id: string; label: string; count: number; area_pct: number; color: string }[];
  top_cells: {
    lat: number;
    lon: number;
    anomaly_pct: NullableNumber;
    anomaly_z: NullableNumber;
    level: AlertLevel;
  }[];
  history: { time: string; anomaly_pct: NullableNumber; level: AlertLevel }[];
};

export type HealthStatus = {
  status: string;
  models_loaded: number[];
};

/* ── Client fetch ─────────────────────────────────────────────── */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const REQUEST_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      search.set(key, String(value));
    }
    url += `?${search.toString()}`;
  }
  return url;
}

async function apiFetch<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(path, params), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const body = await response.json();
        detail = body.detail ?? detail;
      } catch {
        /* réponse sans corps JSON */
      }
      throw new ApiError(response.status, `API ${response.status}: ${detail}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(0, `Requête expirée (> ${REQUEST_TIMEOUT_MS / 1000}s) : ${path}`);
    }
    throw new ApiError(0, `Erreur réseau : ${error instanceof Error ? error.message : "inconnue"}`);
  } finally {
    clearTimeout(timeout);
  }
}

/* ── Fonctions par endpoint ────────────────────────────────────── */

/** GET /api/meta — métadonnées globales (grille, couches, sources, période). */
export function fetchMeta(): Promise<Meta> {
  return apiFetch<Meta>("/meta");
}

/** GET /api/frames?layer= — 12 dernières trames d'observation pour une couche. */
export function fetchFrames(layer: LayerId): Promise<Frames> {
  return apiFetch<Frames>("/frames", { layer });
}

/** GET /api/forecast?lead=1|3 — prévision XGBoost (grille + bandes p10/p90 + résumé). */
export function fetchForecast(lead: 1 | 3): Promise<Forecast> {
  return apiFetch<Forecast>("/forecast", { lead });
}

/** GET /api/point?lat=&lon= — série temporelle observation + prévision par maille. */
export function fetchPoint(lat: number, lon: number): Promise<Point> {
  return apiFetch<Point>("/point", { lat, lon });
}

/** GET /api/alerts — snapshot des alertes (sévérité, classes, historique 12 mois). */
export function fetchAlerts(): Promise<Alerts> {
  return apiFetch<Alerts>("/alerts");
}

/** GET /api/health — état de l'API + modèles chargés (utile pour le debug). */
export function fetchHealth(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>("/health");
}

/* ── Types : signals + metrics (étape 5) ──────────────────────── */

export type SignalRow = {
  time: string;
  oni: number | null;
  tna: number | null;
  gog: number | null;
};

export type Signals = {
  resource: "signals";
  contract_version: string;
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
  rmse: NullableNumber;
  mae: NullableNumber;
  bias: NullableNumber;
  r2: NullableNumber;
  nse: NullableNumber;
  pbias: NullableNumber;
  skill_vs_climatology: NullableNumber;
  comment: string;
};

export type Metrics = {
  resource: "metrics";
  contract_version: string;
  status: string;
  note: string;
  target: string;
  models: MetricRow[];
};

/** GET /api/signals — séries temporelles des indices océaniques (ONI, TNA, GOG). */
export function fetchSignals(): Promise<Signals> {
  return apiFetch<Signals>("/signals");
}

/** GET /api/metrics — tableau de métriques des modèles (XGBoost + climatologie). */
export function fetchMetrics(): Promise<Metrics> {
  return apiFetch<Metrics>("/metrics");
}
