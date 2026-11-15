import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMetrics } from "@/data/mockApi";

function fmt(value: number | null, digits = 2) {
  if (value == null) return "—";
  return value.toLocaleString("fr-FR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export default function MetricsPanel() {
  const metrics = getMetrics();

  if (!metrics) {
    return (
      <div className="flex h-full items-center justify-center bg-white pt-20 text-sm text-slate-400">
        Chargement des métriques…
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-white px-6 pt-20 pb-6">
      <h2 className="text-xl font-semibold text-slate-900">
        Comparaison des modèles
      </h2>
      <p className="mt-1 max-w-3xl text-sm text-slate-500">{metrics.note}</p>
      <p className="mt-2 text-xs text-slate-400">Cible : {metrics.target}</p>

      <div className="mt-6 rounded-xl border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Modèle</TableHead>
              <TableHead>RMSE</TableHead>
              <TableHead>MAE</TableHead>
              <TableHead>Biais</TableHead>
              <TableHead>R²</TableHead>
              <TableHead>NSE</TableHead>
              <TableHead>PBIAS</TableHead>
              <TableHead>Skill vs clim.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.models.map((row) => {
              const skill = row.skill_vs_climatology;
              const beatsClim = skill != null && skill > 0;
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium text-slate-800">{row.label}</p>
                    <p className="text-[11px] text-slate-500">{row.split}</p>
                  </TableCell>
                  <TableCell>{fmt(row.rmse)}</TableCell>
                  <TableCell>{fmt(row.mae)}</TableCell>
                  <TableCell>{fmt(row.bias)}</TableCell>
                  <TableCell>{fmt(row.r2, 3)}</TableCell>
                  <TableCell>{fmt(row.nse, 3)}</TableCell>
                  <TableCell>{row.pbias == null ? "—" : `${fmt(row.pbias)} %`}</TableCell>
                  <TableCell>
                    <span
                      className={
                        skill == null
                          ? "text-slate-400"
                          : beatsClim
                            ? "font-semibold text-teal-700"
                            : "font-semibold text-amber-800"
                      }
                    >
                      {fmt(skill, 3)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="mt-6 space-y-3">
        {metrics.models.map((row) => (
          <li key={`${row.id}-note`} className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">{row.label} : </span>
            {row.comment}
          </li>
        ))}
      </ul>

      <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Un skill ≤ 0 signifie que le modèle ne fait pas mieux que prévoir la
        normale du mois. C’est le critère d’honnêteté du cahier (EF5 / H5).
      </p>
    </div>
  );
}
