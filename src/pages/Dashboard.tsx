import { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import LimitsPanel from "@/components/dashboard/LimitsPanel";
import MapLegend from "@/components/dashboard/MapLegend";
import MetricsPanel from "@/components/dashboard/MetricsPanel";
import OceanSignalsPanel from "@/components/dashboard/OceanSignalsPanel";
import RainLeafletMap from "@/components/dashboard/RainLeafletMap";
import RainSeriesPanel from "@/components/dashboard/RainSeriesPanel";
import {
  alertSnapshot,
  getLayerMeta,
  getSidebarStats,
  layersForMode,
  loadForecast,
  loadObservationFrame,
} from "@/data/mockApi";
import { buildGridImage } from "@/lib/gridImage";
import type {
  DashboardScreen,
  GridSpec,
  LayerId,
  LocationId,
  ViewMode,
} from "@/types/meteo";

export default function Dashboard() {
  const [locationId, setLocationId] = useState<LocationId>("world");
  const [viewMode, setViewMode] = useState<ViewMode>("forecast");
  const [layerId, setLayerId] = useState<LayerId>("anomaly_mm");
  const [screen, setScreen] = useState<DashboardScreen>("map");
  const [grid, setGrid] = useState<GridSpec | null>(null);
  const [values, setValues] = useState<(number | null)[] | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);

  const availableLayers = layersForMode(viewMode);
  const layerMeta = getLayerMeta(layerId) ?? getLayerMeta("anomaly_mm");
  const stats = useMemo(
    () => getSidebarStats(locationId, viewMode),
    [locationId, viewMode],
  );

  useEffect(() => {
    if (!availableLayers.includes(layerId)) {
      setLayerId(availableLayers[0]);
    }
  }, [availableLayers, layerId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        if (viewMode === "observation" || viewMode === "total") {
          const obsLayer = layerId === "prob_above_normal" ? "anomaly_mm" : layerId;
          const frames = await loadObservationFrame(obsLayer);
          const last = frames.frames[frames.frames.length - 1];
          if (cancelled || !last) return;
          setGrid(frames.grid);
          setValues(last.values);
        } else {
          const forecast = await loadForecast(1);
          const layerKey =
            layerId === "anomaly_pct" || layerId === "anomaly_z"
              ? "anomaly_mm"
              : layerId;
          const layer = forecast.layers[layerKey] ?? forecast.layers.anomaly_mm;
          if (cancelled) return;
          setGrid(forecast.grid);
          setValues(layer.values);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [viewMode, layerId]);

  useEffect(() => {
    if (!grid || !values || !layerMeta) {
      setImageUrl("");
      return;
    }
    setImageUrl(buildGridImage(values, grid, layerMeta.palette.stops));
  }, [grid, values, layerMeta]);

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(alertSnapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "meteofront-alerts.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const legendSubtitle =
    viewMode === "forecast" ? "Prévision à 1 mois" : "Observation juin 1985";

  return (
    <div className="h-screen overflow-hidden bg-[#154a7a] p-3 text-slate-900">
      <div className="flex h-full overflow-hidden rounded-xl bg-[#154a7a] shadow-xl">
        <DashboardSidebar
          locationId={locationId}
          viewMode={viewMode}
          layerId={layerId}
          availableLayers={availableLayers}
          stats={stats}
          onLocationChange={setLocationId}
          onViewModeChange={setViewMode}
          onLayerChange={setLayerId}
          onDownload={handleDownload}
        />

        <main className="relative ml-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-white">
          <header className="pointer-events-none absolute inset-x-3 top-3 z-[1200] flex items-center justify-end rounded-xl bg-white/55 px-4 py-2.5 shadow-sm backdrop-blur-md">
            <div className="pointer-events-auto">
              <DashboardTabs screen={screen} onChange={setScreen} />
            </div>
          </header>
          <div className="relative min-h-0 flex-1">
            <div
              className={`absolute inset-0 ${
                screen === "map" ? "" : "invisible pointer-events-none"
              }`}
            >
              {loading && (
                <div className="absolute top-4 right-16 z-[1100] rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow">
                  Chargement de la grille…
                </div>
              )}
              <RainLeafletMap
                imageUrl={imageUrl}
                grid={grid}
                values={values}
                locationId={locationId}
                onLocationChange={setLocationId}
                unit={layerMeta?.unit ?? "mm"}
              />
              {layerMeta && (
                <MapLegend layer={layerMeta} subtitle={legendSubtitle} />
              )}
            </div>
            {screen === "series" && <RainSeriesPanel locationId={locationId} />}
            {screen === "signals" && <OceanSignalsPanel />}
            {screen === "metrics" && <MetricsPanel />}
            {screen === "limits" && <LimitsPanel />}
          </div>
        </main>
      </div>
    </div>
  );
}
