import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getSeriesChart } from "@/data/mockApi";
import { yearLabel, yearTickLabels } from "@/lib/chartTicks";
import { useChartBox } from "@/lib/useChartBox";
import type { LocationId } from "@/types/meteo";

type Props = {
  locationId: LocationId;
};

export default function RainSeriesPanel({ locationId }: Props) {
  const { title, unit, rows, note } = getSeriesChart(locationId);

  const ticks = yearTickLabels(rows.map((row) => row.label));
  const { ref, width, height } = useChartBox();

  return (
    <div className="absolute inset-0 flex min-w-0 flex-col overflow-hidden bg-white px-6 pt-16 pb-4">
      <h2 className="shrink-0 text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 max-w-3xl shrink-0 text-sm text-slate-500">{note}</p>
      <p className="mt-1 shrink-0 text-xs text-slate-400">Unité : {unit}</p>

      <div ref={ref} className="mt-4 min-h-0 w-full min-w-0 flex-1">
        {width > 0 && height > 0 && (
          <LineChart width={width} height={height} data={rows} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              ticks={ticks}
              tickFormatter={yearLabel}
              interval={0}
              tick={{ fontSize: 12, fill: "#334155" }}
              tickMargin={8}
              height={32}
            />
            <YAxis
              width={48}
              tick={{ fontSize: 12, fill: "#334155" }}
              tickMargin={6}
            />
            <Tooltip
              formatter={(value, name) => [
                value == null ? "—" : `${Number(value).toFixed(1)} mm`,
                String(name),
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="climatology"
              name="Climatologie"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="observed"
              name="Observée"
              stroke="#0f766e"
              strokeWidth={2.2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="forecastLow"
              name="Prévision p10"
              stroke="#7dd3fc"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecastHigh"
              name="Prévision p90"
              stroke="#7dd3fc"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              name="Prévue"
              stroke="#0369a1"
              strokeWidth={2.2}
              dot
              connectNulls={false}
            />
          </LineChart>
        )}
      </div>
    </div>
  );
}
