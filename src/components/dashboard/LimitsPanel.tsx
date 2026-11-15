import { getMeta } from "@/data/mockApi";

export default function LimitsPanel() {
  const meta = getMeta();
  return (
    <div className="h-full overflow-auto bg-white px-6 pt-20 pb-6">
      <h2 className="text-xl font-semibold text-slate-900">
        Limites et précautions
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
        Cet outil montre une prévision statistique expérimentale, pas une alerte
        opérationnelle. Un résultat proche de la normale n’est pas une garantie
        de saison « normale ».
      </p>

      <section className="mt-8 max-w-3xl space-y-4">
        <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Ce que le modèle fait
        </h3>
        <p className="text-sm leading-relaxed text-slate-700">
          Il part de l’anomalie de pluie récente et la prolonge de façon amortie
          (persistance). Il est toujours comparé à la climatologie : la moyenne
          du même mois calendaire.
        </p>

        <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Ce qu’il ne fait pas
        </h3>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          <li>Il ne prédit pas un orage ni un jour précis.</li>
          <li>Il ne bat pas encore la climatologie sur le test mock (skill ≈ 0).</li>
          <li>Corrélation océan–pluie n’est pas une preuve de causalité.</li>
          <li>Les données satellites ont des erreurs, plus fortes au nord et dans les zones peu instrumentées.</li>
          <li>Peu d’années : un lien apparent peut venir du hasard.</li>
        </ul>

        <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Incertitude
        </h3>
        <p className="text-sm leading-relaxed text-slate-700">
          Sur chaque ville, la prévision est encadrée par une fourchette p10–p90.
          Si cette fourchette est large, le signal est faible : s’en tenir à la
          normale du mois est souvent aussi utile.
        </p>

        <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Données affichées
        </h3>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          {meta?.sources.map((source) => (
            <li key={source.id}>
              {source.label}
              {source.attribution ? ` — ${source.attribution}` : ""}
            </li>
          ))}
          <li>
            Signaux océaniques : série factice M8, à remplacer par le livrable M3.
          </li>
          <li>
            Métriques R² / NSE / PBIAS du modèle : absentes du mock ; la
            climatologie a été calculée sur les 3 villes.
          </li>
        </ul>
      </section>
    </div>
  );
}
