import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getSeriesChart } from "@/data/mockApi";
import type { LocationId } from "@/types/meteo";

type Props = {
  locationId: LocationId;
};

export default function RainSeriesPanel({ locationId }: Props) {
  const { title, unit, rows, note } = getSeriesChart(locationId);

  return (
    <div className="flex h-full flex-col overflow-auto bg-white px-6 pt-20 pb-6">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm text-slate-500">{note}</p>
      <p className="mt-1 text-xs text-slate-400">Unité : {unit}</p>

      <div className="mt-6 min-h-[360px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={5} />
            <YAxis tick={{ fontSize: 11 }} />
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
        </ResponsiveContainer>
      </div>
    </div>
  );
}
