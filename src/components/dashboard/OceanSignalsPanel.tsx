import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getSignals, signalsMissing } from "@/data/mockApi";
import { yearLabel, yearTickLabels } from "@/lib/chartTicks";
import { useChartBox } from "@/lib/useChartBox";

const SIGNAL_META = [
  {
    key: "tna" as const,
    color: "#0f766e",
    title: "Atlantique tropical nord (TNA)",
    role: "Signal le plus robuste pour les pluies modérées du Sahel (littérature).",
    lag: "Décalage typique : 3 à 6 mois.",
  },
  {
    key: "oni" as const,
    color: "#b45309",
    title: "Pacifique / El Niño (ONI)",
    role: "Plutôt lié aux extrêmes, de façon plus indirecte.",
    lag: "Décalage typique : 4 à 8 mois.",
  },
  {
    key: "gog" as const,
    color: "#1d4ed8",
    title: "Golfe de Guinée",
    role: "Rôle secondaire, décalage plus court.",
    lag: "Décalage typique : 1 à 3 mois.",
  },
];

export default function OceanSignalsPanel() {
  const signals = getSignals();
  const { ref, width, height } = useChartBox(signals != null);

  if (!signals) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white px-6 pt-16 text-sm text-slate-500">
        {signalsMissing()
          ? "Ces séries ne sont pas encore servies par l’API."
          : "Chargement des signaux océaniques…"}
      </div>
    );
  }

  const rows = signals.series.map((row) => ({
    ...row,
    label: row.time.slice(0, 7),
  }));
  const ticks = yearTickLabels(rows.map((row) => row.label));

  return (
    <div className="absolute inset-0 flex min-w-0 flex-col overflow-x-hidden overflow-y-auto bg-white px-6 pt-16 pb-4">
      <h2 className="shrink-0 text-xl font-semibold text-slate-900">
        Signaux océaniques
      </h2>
      <p className="mt-1 max-w-3xl shrink-0 text-sm text-slate-500">
        {signals.note}
      </p>

      <div ref={ref} className="mt-4 h-64 w-full min-w-0 shrink-0">
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
              width={40}
              tick={{ fontSize: 12, fill: "#334155" }}
              tickMargin={6}
            />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="tna" name="TNA" stroke="#0f766e" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="oni" name="ONI" stroke="#b45309" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="gog" name="Golfe de Guinée" stroke="#1d4ed8" dot={false} strokeWidth={2} />
          </LineChart>
        )}
      </div>

      <ul className="mt-4 grid shrink-0 gap-3 md:grid-cols-3">
        {SIGNAL_META.map((signal) => (
          <li key={signal.key} className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold" style={{ color: signal.color }}>
              {signal.title}
            </p>
            <p className="mt-2 text-sm text-slate-600">{signal.role}</p>
            <p className="mt-2 text-xs text-slate-500">{signal.lag}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
