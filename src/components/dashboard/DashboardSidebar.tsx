import { ChevronLeft, Download, Layers, MapPin } from "lucide-react";
import { LOCATIONS } from "@/data/locations";
import { getAlertSnapshot, getMeta } from "@/data/mockApi";
import { monthLabel, monthRangeLabel } from "@/lib/gridImage";
import type { LayerId, LocationId, ViewMode } from "@/types/meteo";
import type { SidebarStats } from "@/data/mockApi";

type Props = {
  locationId: LocationId;
  viewMode: ViewMode;
  layerId: LayerId;
  availableLayers: LayerId[];
  stats: SidebarStats;
  onLocationChange: (id: LocationId) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onLayerChange: (layer: LayerId) => void;
  onDownload: () => void;
};

const LAYER_LABELS: Record<LayerId, string> = {
  rain_mm: "Pluie",
  anomaly_mm: "Anomalie",
  anomaly_pct: "Écart %",
  anomaly_z: "Anomalie σ",
  prob_above_normal: "Proba. humide",
};

function formatNumber(value: number) {
  return Math.round(value).toLocaleString("fr-FR");
}

export default function DashboardSidebar({
  locationId,
  viewMode,
  layerId,
  availableLayers,
  stats,
  onLocationChange,
  onViewModeChange,
  onLayerChange,
  onDownload,
}: Props) {
  const maxBar = Math.max(...stats.bars.map((bar) => Math.abs(bar.value)), 1);
  const location = LOCATIONS.find((item) => item.id === locationId);
  const alerts = getAlertSnapshot();
  const meta = getMeta();
  const observationTime = alerts?.time ?? "";
  const forecastStart = "1985-07-01";
  const forecastEnd = "1985-09-01";

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col overflow-hidden bg-[#154a7a] px-5 py-5 text-white">
      <div className="px-1">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-white/55 uppercase">
          MeteoFront
        </p>
        <h1 className="mt-1.5 text-lg leading-tight font-semibold">
          {meta?.dataset.title ?? "MeteoFront"}
        </h1>
      </div>

      <p className="mt-5 mb-2 px-1 text-[11px] font-semibold tracking-[0.18em] text-white/45 uppercase">
        Lieu
      </p>
      {locationId !== "world" && (
        <button
          type="button"
          onClick={() => onLocationChange("world")}
          className="mb-2 inline-flex items-center gap-1 px-1 text-xs font-medium text-white/80 hover:text-white"
        >
          <ChevronLeft size={14} />
          Retour à la région
        </button>
      )}
      <label className="block">
        <span className="sr-only">Lieu</span>
        <span className="relative block">
          <MapPin size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/60" />
          <select
            value={locationId}
            onChange={(event) => onLocationChange(event.target.value as LocationId)}
            className="w-full appearance-none rounded-xl border border-white/15 bg-white/10 py-2.5 pr-3 pl-9 text-sm font-medium text-white outline-none focus:border-white/40"
          >
            {LOCATIONS.map((item) => (
              <option key={item.id} value={item.id} className="text-slate-900">
                {item.label}
              </option>
            ))}
          </select>
        </span>
      </label>

      <p className="mt-5 mb-2 px-1 text-[11px] font-semibold tracking-[0.18em] text-white/45 uppercase">
        Période
      </p>
      <div className="space-y-1">
        <ModeRow
          active={viewMode === "observation"}
          onClick={() => onViewModeChange("observation")}
          title="Observation"
          period={monthRangeLabel(observationTime, observationTime)}
          value={stats.observation}
          unit="mm"
        />
        <ModeRow
          active={viewMode === "forecast"}
          onClick={() => onViewModeChange("forecast")}
          title="Prévision"
          period={monthRangeLabel(forecastStart, forecastEnd)}
          value={stats.forecast}
          unit="mm"
        />
        {viewMode === "forecast" && (
          <ul className="mt-1 mb-1 space-y-1 px-2">
            {stats.bars.map((bar) => (
              <li key={bar.time} className="flex items-center gap-2 text-xs text-white/75">
                <span className="w-8 font-medium">{monthLabel(bar.time)}</span>
                <span className="h-1.5 flex-1 rounded-full bg-white/15">
                  <span
                    className="block h-1.5 rounded-full bg-white"
                    style={{ width: `${(Math.abs(bar.value) / maxBar) * 100}%` }}
                  />
                </span>
                <span className="w-10 text-right tabular-nums">{formatNumber(bar.value)}</span>
              </li>
            ))}
          </ul>
        )}
        <ModeRow
          active={viewMode === "total"}
          onClick={() => onViewModeChange("total")}
          title="Total"
          period={`${monthLabel(observationTime)}–${monthLabel(forecastEnd)}`}
          value={stats.total}
          unit="mm"
        />
      </div>

      <p className="mt-2 px-2 text-[11px] leading-relaxed text-white/55">{stats.note}</p>

      <p className="mt-5 mb-2 flex items-center gap-2 px-1 text-[11px] font-semibold tracking-[0.18em] text-white/45 uppercase">
        <Layers size={12} />
        Couche
      </p>
      <div className="flex flex-wrap gap-2">
        {availableLayers.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onLayerChange(id)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              layerId === id
                ? "bg-white text-[#154a7a]"
                : "bg-white/10 text-white/80 hover:bg-white/15"
            }`}
          >
            {LAYER_LABELS[id]}
          </button>
        ))}
      </div>

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={onDownload}
          className="flex w-full items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-medium text-white hover:bg-white/15"
        >
          <Download size={16} />
          Télécharger les données
        </button>
        <p className="mt-3 px-1 text-[11px] leading-relaxed text-white/45">
          {location?.label} · alerte {alerts?.severity.label.toLowerCase() ?? "—"}
        </p>
      </div>
    </aside>
  );
}

function ModeRow({
  active,
  onClick,
  title,
  period,
  value,
  unit,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  period: string;
  value: number;
  unit: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
        active ? "bg-white/15" : "hover:bg-white/10"
      }`}
    >
      <span
        className={`size-2.5 rounded-full ${
          active ? "bg-white" : "border border-white/40"
        }`}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="text-[10px] tracking-wider text-white/50 uppercase">{period}</span>
      </span>
      <span className={`tabular-nums ${active ? "text-base font-semibold" : "text-sm text-white/70"}`}>
        {formatNumber(value)}
        <span className="ml-1 text-[10px] font-normal text-white/50">{unit}</span>
      </span>
    </button>
  );
}
