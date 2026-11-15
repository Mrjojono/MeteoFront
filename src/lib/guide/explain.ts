import { getAlertSnapshot, getLayerMeta } from "@/data/mockApi";
import type { ZoneSummary } from "@/lib/gridImage";
import type { SidebarStats } from "@/data/mockApi";
import { getLocation } from "@/data/locations";
import type { DashboardScreen, LayerId, LocationId, ViewMode } from "@/types/meteo";

export type GuideSnapshot = {
  locationLabel: string;
  viewMode: ViewMode;
  layerId: LayerId;
  layerLabel: string;
  layerUnit: string;
  screenLabel: string;
  observation: number;
  forecast: number;
  total: number;
  note: string;
  anomalyPct: number;
  severity: string;
  areaBelow: number;
  areaSevere: number;
  rainMean: number;
  climMean: number;
  anomalyZ: number;
};

const SCREEN_LABELS: Record<DashboardScreen, string> = {
  map: "Carte",
  series: "Séries",
  signals: "Océans",
  metrics: "Modèles",
  limits: "Limites",
};

const MODE_LABELS: Record<ViewMode, string> = {
  observation: "Observation",
  forecast: "Prévision",
  total: "Total juin–septembre",
};

export function formatNum(value: number, digits = 1) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function buildSnapshot(input: {
  locationId: LocationId;
  viewMode: ViewMode;
  layerId: LayerId;
  screen: DashboardScreen;
  stats: SidebarStats;
}): GuideSnapshot {
  const layer = getLayerMeta(input.layerId);
  const alerts = getAlertSnapshot();
  const indicators = alerts?.indicators;
  return {
    locationLabel: getLocation(input.locationId).label,
    viewMode: input.viewMode,
    layerId: input.layerId,
    layerLabel: layer?.label ?? input.layerId,
    layerUnit: layer?.unit ?? "",
    screenLabel: SCREEN_LABELS[input.screen],
    observation: input.stats.observation,
    forecast: input.stats.forecast,
    total: input.stats.total,
    note: input.stats.note,
    anomalyPct: indicators?.anomaly_pct ?? 0,
    severity: alerts?.severity.label ?? "en cours de chargement",
    areaBelow: indicators?.area_below_normal_pct ?? 0,
    areaSevere: indicators?.area_deficit_severe_pct ?? 0,
    rainMean: indicators?.rain_mean_mm ?? 0,
    climMean: indicators?.clim_mean_mm ?? 0,
    anomalyZ: indicators?.anomaly_z_mean ?? 0,
  };
}

export function colorStory(layerId: LayerId) {
  switch (layerId) {
    case "rain_mm":
      return "Jaune pâle : presque pas de pluie. Vert clair : un peu. Vert foncé : beaucoup de pluie dans le mois.";
    case "anomaly_pct":
      return "Brun : beaucoup moins de pluie que d'habitude. Blanc : comme d'habitude. Vert : plus de pluie que d'habitude.";
    case "anomaly_z":
      return "Brun : un mois rare, dans le sens sec. Blanc : un mois ordinaire. Vert : un mois rare, dans le sens mouillé.";
    case "prob_above_normal":
      return "Bleu très pâle : peu de chances que le mois soit plus mouillé que d'habitude. Bleu moyen : on ne sait pas. Bleu foncé : de bonnes chances qu'il soit plus mouillé.";
    default:
      return "Brun : moins de pluie que d'habitude. Beige : un peu moins. Blanc : comme d'habitude. Vert clair : un peu plus. Vert foncé : beaucoup plus.";
  }
}

export function contextLine(snapshot: GuideSnapshot) {
  return `${MODE_LABELS[snapshot.viewMode]} · ${snapshot.layerLabel}`;
}

function senseOf(layerId: LayerId, mean: number, unit: string) {
  if (layerId === "prob_above_normal") {
    const pct = formatNum(mean * 100, 0);
    if (mean >= 0.6) return `Dans ce rectangle, le mois a plutôt plus de chances d’être plus mouillé que d’habitude (environ ${pct} %).`;
    if (mean <= 0.4) return `Dans ce rectangle, le mois a plutôt plus de chances d’être plus sec que d’habitude (environ ${pct} %).`;
    return `Dans ce rectangle, c’est incertain : environ ${pct} % de chances d’être plus mouillé que la normale, donc proche d’un pile ou face.`;
  }
  if (layerId === "rain_mm") {
    return `La moyenne est ${formatNum(mean)} ${unit} sur le mois. C’est une quantité d’eau, pas le signe que c’est rare. Pour voir si c’est inhabituel, passe sur la couche Anomalie et retrace le rectangle.`;
  }
  if (layerId === "anomaly_pct") {
    if (mean <= -15) return "En moyenne, ce rectangle est nettement plus sec que la normale, en pourcentage.";
    if (mean >= 15) return "En moyenne, ce rectangle est nettement plus mouillé que la normale, en pourcentage.";
    return "En moyenne, ce rectangle reste proche de la normale, en pourcentage.";
  }
  if (layerId === "anomaly_z") {
    if (mean <= -1) return "L’écart est assez rare dans le sens sec : ce n’est pas un mois ordinaire.";
    if (mean >= 1) return "L’écart est assez rare dans le sens mouillé.";
    return "L’écart reste dans la variation habituelle d’une année à l’autre.";
  }
  if (mean <= -15) return "En moyenne, ce rectangle est nettement plus sec que l’habitude de ce mois.";
  if (mean <= -5) return "En moyenne, ce rectangle est un peu plus sec que d’habitude.";
  if (mean >= 15) return "En moyenne, ce rectangle est nettement plus mouillé que l’habitude de ce mois.";
  if (mean >= 5) return "En moyenne, ce rectangle est un peu plus mouillé que d’habitude.";
  return "En moyenne, ce rectangle est proche de la normale du mois.";
}

export function explainZone(snapshot: GuideSnapshot, zone: ZoneSummary) {
  if (zone.mean == null || zone.min == null || zone.max == null) {
    return "Ce rectangle ne tombe pas sur une zone colorée. Il est hors carte, ou sur l’océan.\n\nC’est un exemple de 1985, pas la pluie d’aujourd’hui.";
  }
  return [
    colorStory(snapshot.layerId),
    senseOf(snapshot.layerId, zone.mean, snapshot.layerUnit),
    "C’est un exemple de 1985, pas la pluie d’aujourd’hui.",
  ].join("\n\n");
}

function fold(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function mentions(text: string, words: string[]) {
  return words.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
}

function layerAsked(text: string): LayerId | "spi" | null {
  if (text.includes("spi")) return "spi";
  if (text.includes("probab") || text.includes("humide")) return "prob_above_normal";
  if (text.includes("sigma") || text.includes("standard")) return "anomaly_z";
  if (text.includes("pourcent") || text.includes("ecart %") || text.includes("%")) return "anomaly_pct";
  if (text.includes("anomal")) return "anomaly_mm";
  if (text.includes("pluie") || text.includes("mm")) return "rain_mm";
  return null;
}

function explainLayer(id: LayerId | "spi") {
  switch (id) {
    case "rain_mm":
      return "La couche Pluie est la quantité tombée dans le mois, en millimètres. 1 mm, c’est 1 litre d’eau par mètre carré. Un gros chiffre n’est pas forcément exceptionnel : au Sahel, juillet est presque toujours plus mouillé que janvier.";
    case "anomaly_mm":
      return "Cette carte ne montre pas combien il a plu. Elle montre si c’est plus sec ou plus mouillé que d’habitude. Brun : moins de pluie que d’habitude. Blanc : comme d’habitude. Vert : plus de pluie que d’habitude.";
    case "anomaly_pct":
      return "L’écart en % est la même différence, exprimée par rapport à la normale. Au nord, où il pleut peu, un petit manque de millimètres devient un grand pourcentage. Utile pour comparer des climats très différents, facile à surinterpréter dans le désert.";
    case "anomaly_z":
      return "Le brun foncé veut dire un mois rarement aussi sec. Le blanc, un mois ordinaire. Le vert foncé, un mois rarement aussi mouillé.";
    case "prob_above_normal":
      return "La probabilité « plus humide que la normale » n’est pas une quantité de pluie. 0,5 veut dire pile ou face. Au-dessus, le mois a plus de chances d’être plus mouillé que d’habitude. En dessous, plus de chances d’être plus sec. Elle n’existe que sur la prévision.";
    case "spi":
      return "Le SPI 3 mois est un indice de sécheresse sur trois mois. Il est décrit dans les métadonnées, mais il n’est pas disponible sur cette carte.";
  }
}

function explainForecast(snapshot: GuideSnapshot) {
  return [
    "La prévision ici n’annonce ni un jour de pluie ni un orage. Elle prolonge, en l’atténuant, l’écart récent par rapport à la normale : si le passé proche était plus sec, les mois suivants restent un peu plus secs, de moins en moins.",
    `Sur l’écran, le premier mois prévu est à ${formatNum(snapshot.forecast)} mm. ${snapshot.note}.`,
    "Ce n’est pas une projection climatique du type GIEC, ni une météo à trois jours. Sur le test de 1985, ce prolongement ne fait pas mieux que « prévoir la normale du mois » (skill ≈ 0). Pour une décision, la normale reste souvent un aussi bon repère.",
  ].join("\n\n");
}

function explainRange() {
  return "La fourchette p10–p90 encadre la prévision. Le bas (p10) est un scénario sec mais plausible, le haut (p90) un scénario mouillé. Environ 8 années sur 10 tomberaient entre les deux si l’intervalle est bien calibré. Plus elle est large, plus le chiffre central est fragile : on prévoit alors plutôt avec le bas de la fourchette.";
}

function explainUses(snapshot: GuideSnapshot) {
  const dry = snapshot.anomalyPct <= -10;
  const wet = snapshot.anomalyPct >= 10;
  const season = dry
    ? `L’alerte régionale est sèche (${formatNum(snapshot.anomalyPct)} %).`
    : wet
      ? `L’alerte régionale est plus mouillée que la normale (${formatNum(snapshot.anomalyPct)} %).`
      : `L’alerte régionale est proche de la normale (${formatNum(snapshot.anomalyPct)} %).`;

  const farming = dry
    ? "Agriculture : ne pas compter sur un démarrage plus humide que d’habitude. Garder l’eau pour le mil ou le sorgho, éviter d’agrandir la surface semée. Le chiffre en mm est un total de mois, pas une averse."
    : wet
      ? "Agriculture : la fenêtre de semis est plus confortable que d’habitude. Le produit ne voit pas une crue d’un seul jour, donc un mois « humide » ne dit pas où l’eau va ruisseler."
      : "Agriculture : rien d’assez net pour changer le calendrier habituel. Rester sur les dates et les volumes d’une année normale.";

  return [
    season,
    farming,
    "Énergie : un mois sous la normale, c’est ne pas compter une production hydroélectrique en plus. Ce produit ne mesure pas le soleil : moins de pluie n’est pas la preuve qu’il y aura plus de lumière.",
    "École : faire lire trois choses distinctes — la quantité (Pluie), l’écart à l’habitude (Anomalie), et la confiance (probabilité ou fourchette). « Normal » veut dire « comme la moyenne de ce mois », pas « tout ira bien ».",
    "Dans tous les cas, ce signal est une démonstration de 1985, pas une consigne pour la saison en cours.",
  ].join("\n\n");
}

function explainAlert(snapshot: GuideSnapshot) {
  return [
    `Le niveau « ${snapshot.severity} » résume l’écart régional, pas un danger immédiat. Score affiché à partir de ${formatNum(snapshot.anomalyPct)} % d’anomalie.`,
    `${formatNum(snapshot.areaBelow)} % de la maille est sous la normale, ${formatNum(snapshot.areaSevere)} % en déficit sévère. Une grande zone un peu sèche peut donner une alerte modérée sans que chaque ville le soit autant.`,
    "Ce n’est pas une alerte à diffuser telle quelle : le panneau Limites le dit, le modèle ne bat pas encore la simple normale du mois.",
  ].join("\n\n");
}

function explainGrid() {
  return [
    "Deux choses différentes portent le nom de projection.",
    "Sur la carte, les valeurs restent en latitude et longitude (EPSG:4326). La grille fait 0,5 degré, environ 55 km de côté. Leaflet les dessine ensuite sur le fond de carte. Afficher la carte ne modifie pas les millimètres : une couleur couvre une maille, pas un quartier.",
    "Dans le temps, la « projection » est la prévision à 1 mois et à 3 mois. C’est un calcul statistique sur le passé récent, pas un déplacement de la carte.",
  ].join("\n\n");
}

function explainModel() {
  return "L’onglet Modèles compare la prévision à la climatologie, c’est-à-dire à la moyenne du même mois. Le skill contre cette climatologie est d’environ 0 (légèrement négatif à 1 mois sur le test 1985). RMSE autour de 30 mm : l’erreur typique reste grande face au chiffre prévu. R², NSE et PBIAS du modèle ne sont pas dans ce jeu de données. Un R² élevé sur la seule climatologie reflète surtout l’alternance saison sèche / saison des pluies, pas un talent à prévoir l’exception.";
}

function explainOcean() {
  return "L’onglet Océans montre des indices de température de mer (Pacifique / El Niño, Atlantique tropical nord, golfe de Guinée) qui, dans la littérature, précèdent parfois la pluie de quelques mois. Ici la série est un jeu factice, à ne pas citer comme une observation réelle. Un lien dans le temps n’est pas une preuve que l’océan a causé la pluie.";
}

function explainNormal(snapshot: GuideSnapshot) {
  return `La normale, ou climatologie, est la moyenne de ce mois-calendrier sur les années connues. Dans l’alerte, la pluie moyenne de juin est ${formatNum(snapshot.rainMean)} mm et la climatologie citée est ${formatNum(snapshot.climMean)} mm. L’anomalie de ${formatNum(snapshot.anomalyPct)} % est un autre résumé régional : elle ne se recalcule pas simplement en soustrayant ces deux moyennes. L’anomalie standardisée moyenne est ${formatNum(snapshot.anomalyZ, 2)} σ.`;
}

export function answerQuestion(question: string, snapshot: GuideSnapshot) {
  const text = fold(question);
  const asked = layerAsked(text);

  if (mentions(text, ["cas", "pratique", "agricult", "energie", "ecole", "usage", "utile", "servir", "decision"])) {
    return explainUses(snapshot);
  }
  if (mentions(text, ["fourchette", "p10", "p90", "incert"])) {
    return explainRange();
  }
  if (mentions(text, ["ocean", "nino", "oni", "atlantique", "guinee"])) {
    return explainOcean();
  }
  if (mentions(text, ["rmse", "skill", "nse", "pbias", "biais", "modele"])) {
    return explainModel();
  }
  if (mentions(text, ["alerte", "grave", "danger", "moder"])) {
    return explainAlert(snapshot);
  }
  if (mentions(text, ["grille", "maille", "mercator", "resolution", "projection"]) && mentions(text, ["carte", "grille", "maille", "mercator", "affiche"])) {
    return explainGrid();
  }
  if (text.includes("projection") && !text.includes("prevision")) {
    return explainGrid() + "\n\n" + explainForecast(snapshot);
  }
  if (mentions(text, ["prevision", "prevoit", "predit", "persistance", "mois prochain"])) {
    return explainForecast(snapshot);
  }
  if (mentions(text, ["normale", "climatologie", "habitude"])) {
    return explainNormal(snapshot);
  }
  if (asked || mentions(text, ["couche", "layer", "legende", "couleur"])) {
    const id = asked ?? snapshot.layerId;
    const current =
      id === snapshot.layerId
        ? `C’est la couche affichée (${snapshot.layerLabel}, ${snapshot.layerUnit}).`
        : `Tu as demandé une autre couche que celle sélectionnée (${snapshot.layerLabel}).`;
    return `${current}\n\n${explainLayer(id)}`;
  }

  return `On regarde ${snapshot.locationLabel}, ${contextLine(snapshot).toLowerCase()}.\n\nJe peux détailler la couche, la prévision, la fourchette, ou un cas pratique. Tu peux aussi tracer un rectangle sur la carte.`;
}

export const GUIDE_PROMPTS = [
  "Cette couleur veut dire quoi ?",
  "C’est plus sec ou plus mouillé ?",
  "Qu’est-ce que je dois en retenir ?",
] as const;
