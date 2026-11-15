import { cssGradient, formatTick } from "@/lib/palette";
import type { LayerMeta } from "@/types/meteo";

type Props = {
  layer: LayerMeta;
  subtitle: string;
  dock?: "center" | "start";
};

export default function MapLegend({ layer, subtitle, dock = "center" }: Props) {
  const ticks = layer.legend.ticks;
  const labels = layer.legend.labels;

  return (
    <div
      className={`pointer-events-none absolute bottom-6 z-[1100] rounded-xl bg-white/95 px-5 py-3 shadow-lg ring-1 ring-black/5 ${
        dock === "start"
          ? "left-4 w-[min(420px,calc(100%-27rem))]"
          : "left-1/2 w-[min(560px,calc(100%-2rem))] -translate-x-1/2"
      }`}
    >
      <p className="mb-2 text-sm font-semibold text-slate-800">
        {subtitle}{" "}
        <span className="font-normal text-slate-500">
          {layer.label} ({layer.unit})
        </span>
      </p>
      <div
        className="h-3 w-full rounded-full"
        style={{ background: cssGradient(layer.palette.stops) }}
      />
      <div className="mt-1 flex justify-between text-xs text-slate-600">
        {ticks.map((tick, index) => (
          <span key={`${tick}-${index}`}>
            {labels?.[index] ?? formatTick(tick, layer.precision)}
          </span>
        ))}
      </div>
    </div>
  );
}
