import type { IncomingMessage, ServerResponse } from "node:http";
import { loadEnv, type Connect } from "vite";

const DEFAULT_MODEL = "openai/gpt-oss-20b";

const SYSTEM = `Tu montres une carte de pluie à quelqu'un qui n'est pas météorologue.
Parle comme si tu montrais l'écran du doigt. Deux ou trois phrases, en français parlé. Pas de liste, pas de métaphore.
Commence par la couleur : ce qu'elle veut dire, concrètement.
N'emploie pas ces mots : maille, anomalie, sigma, percentile, skill, RMSE, latitude, longitude, écart-type, climatologie, grille.
Ne récite pas les totaux de la région. Un seul chiffre, seulement s'il est écrit dans le texte. N'en invente aucun.
Termine par une courte phrase : c'est un exemple de 1985, pas la météo d'aujourd'hui.`;

type Turn = { role?: string; text?: string };

type GuideBody = {
  question?: string;
  context?: unknown;
  zone?: unknown;
};

function asRecord(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function plainBrief(context: unknown, zone: unknown) {
  const ctx = asRecord(context);
  const box = asRecord(zone);
  const gap = num(ctx?.anomalie_regionale_pct);
  const mean = num(box?.mean);
  const lines = [
    typeof ctx?.lieu === "string" ? `Endroit affiché : ${ctx.lieu}.` : "",
    typeof ctx?.couche === "string" ? `Carte affichée : ${ctx.couche}.` : "",
    typeof ctx?.couleurs === "string" ? `Couleurs : ${ctx.couleurs}` : "",
  ];
  if (gap != null) {
    const amount = Math.abs(Math.round(gap));
    const way = gap < -5 ? `${amount} % de pluie en moins que d'habitude` : gap > 5 ? `${amount} % de pluie en plus que d'habitude` : "proche de d'habitude";
    lines.push(`Sur toute la région : ${way}.`);
  }
  if (mean != null) {
    const look =
      mean < -5
        ? "Le rectangle est plutôt brun : plus sec que d'habitude."
        : mean > 5
          ? "Le rectangle est plutôt vert : plus mouillé que d'habitude."
          : "Le rectangle est plutôt clair : proche de d'habitude.";
    lines.push(look);
  } else {
    lines.push("Aucun rectangle n'est tracé.");
  }
  return lines.filter(Boolean).join("\n");
}

function send(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
      if (Buffer.concat(chunks).length > 20_000) {
        reject(new Error("body"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function guideMiddleware(mode: string): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const path = req.url?.split("?")[0];
    if (path !== "/api/guide") {
      next();
      return;
    }
    if (req.method !== "POST") {
      send(res, 405, { error: "method" });
      return;
    }

    try {
      const env = loadEnv(mode, process.cwd(), "");
      const key = env.GROQ_API_KEY?.trim();
      const model = env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
      if (!key) {
        send(res, 503, { error: "missing_key" });
        return;
      }

      const body = JSON.parse(await readBody(req)) as GuideBody;
      const question = body.question?.trim().slice(0, 1500);
      if (!question) {
        send(res, 400, { error: "question" });
        return;
      }

      const history = Array.isArray((body as { history?: Turn[] }).history)
        ? ((body as { history?: Turn[] }).history ?? []).slice(-6)
        : [];
      const prior = history
        .map((turn) => {
          const who = turn.role === "user" ? "Personne" : "Guide";
          return `${who} : ${(turn.text ?? "").slice(0, 500)}`;
        })
        .join("\n");

      const user = [
        prior ? `Échange récent, à reformuler sans jargon :\n${prior}` : "",
        plainBrief(body.context, body.zone),
        `Question : ${question}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: 700,
          reasoning_effort: "low",
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: user },
          ],
        }),
      });

      if (!response.ok) {
        send(res, 502, { error: "upstream" });
        return;
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const answer = data.choices?.[0]?.message?.content?.trim();
      if (!answer) {
        send(res, 502, { error: "empty" });
        return;
      }
      send(res, 200, { answer, model });
    } catch {
      send(res, 500, { error: "proxy" });
    }
  };
}
