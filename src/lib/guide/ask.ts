import type { ZoneSummary } from "@/lib/gridImage";
import { answerQuestion, colorStory, type GuideSnapshot } from "@/lib/guide/explain";

export type GuideSource = "local" | "groq";

export type GuideReply = {
  text: string;
  source: GuideSource;
  note?: string;
};

type HistoryTurn = { role: "user" | "guide"; text: string };

type ApiPayload = {
  answer?: string;
  model?: string;
  error?: string;
};

function compact(snapshot: GuideSnapshot, zone: ZoneSummary | null) {
  return {
    lieu: snapshot.locationLabel,
    periode: snapshot.viewMode,
    couche: snapshot.layerLabel,
    unite: snapshot.layerUnit,
    couleurs: colorStory(snapshot.layerId),
    onglet: snapshot.screenLabel,
    observation_mm: snapshot.observation,
    prevision_mm: snapshot.forecast,
    total_mm: snapshot.total,
    note: snapshot.note,
    anomalie_regionale_pct: snapshot.anomalyPct,
    severite: snapshot.severity,
    part_zone_sous_normale_pct: snapshot.areaBelow,
    part_deficit_severe_pct: snapshot.areaSevere,
    zone,
  };
}

export function replyLocally(question: string, snapshot: GuideSnapshot): GuideReply {
  return { text: answerQuestion(question, snapshot), source: "local" };
}

export async function askGuide(
  question: string,
  snapshot: GuideSnapshot,
  zone: ZoneSummary | null,
  history: HistoryTurn[],
  localText: string,
): Promise<GuideReply> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch("/api/guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        context: compact(snapshot, zone),
        zone,
        history: history.slice(-6),
      }),
      signal: controller.signal,
    });
    const payload = (await response.json()) as ApiPayload;
    if (response.status === 503 && payload.error === "missing_key") {
      return {
        text: localText,
        source: "local",
        note: "Réponse locale. Colle ta clé dans GROQ_API_KEY, dans le fichier .env, puis relance le serveur.",
      };
    }
    if (!response.ok || !payload.answer?.trim()) {
      return {
        text: localText,
        source: "local",
        note: "Groq n’a pas répondu. Voici la lecture locale.",
      };
    }
    return {
      text: payload.answer.trim(),
      source: "groq",
      note: payload.model ? `Groq · ${payload.model}` : "Groq",
    };
  } catch {
    return {
      text: localText,
      source: "local",
      note: "Groq n’a pas répondu. Voici la lecture locale.",
    };
  } finally {
    window.clearTimeout(timer);
  }
}
