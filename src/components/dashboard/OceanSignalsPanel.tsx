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
import { oceanSignals } from "@/data/mockApi";

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
  const rows = oceanSignals.series.map((row) => ({
    ...row,
    label: row.time.slice(0, 7),
  }));

  return (
    <div className="h-full overflow-auto bg-white px-6 pt-20 pb-6">
      <h2 className="text-xl font-semibold text-slate-900">
        Signaux océaniques
      </h2>
      <p className="mt-1 max-w-3xl text-sm text-slate-500">
        {oceanSignals.note} L’outil affiche ces courbes pour préparer EF8 : le
        fichier réel de M3 pourra les remplacer sans changer l’écran.
      </p>

      <div className="mt-6 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={5} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="tna" name="TNA" stroke="#0f766e" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="oni" name="ONI" stroke="#b45309" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="gog" name="Golfe de Guinée" stroke="#1d4ed8" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-8 grid gap-4 md:grid-cols-3">
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
