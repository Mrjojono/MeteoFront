import { MessageCircle, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { SidebarStats } from "@/data/mockApi";
import type { ZoneSummary } from "@/lib/gridImage";
import { askGuide, replyLocally } from "@/lib/guide/ask";
import {
  GUIDE_PROMPTS,
  buildSnapshot,
  contextLine,
  explainZone,
} from "@/lib/guide/explain";
import type { DashboardScreen, LayerId, LocationId, ViewMode } from "@/types/meteo";

type Props = {
  open: boolean;
  locationId: LocationId;
  viewMode: ViewMode;
  layerId: LayerId;
  screen: DashboardScreen;
  stats: SidebarStats;
  zoneToken: number;
  zone: ZoneSummary | null;
  onOpenChange: (open: boolean) => void;
};

type GuideMessage = {
  id: number;
  role: "user" | "guide";
  text: string;
  note?: string;
};

function Paragraphs({ text, tone }: { text: string; tone: "ink" | "inverse" }) {
  const color = tone === "inverse" ? "text-white" : "text-[#123044]";
  return (
    <div className="space-y-2">
      {text.split("\n\n").map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 16)}`} className={`text-sm leading-6 ${color}`}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export default function GuidePanel({
  open,
  locationId,
  viewMode,
  layerId,
  screen,
  stats,
  zoneToken,
  zone,
  onOpenChange,
}: Props) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<GuideMessage[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const seenZone = useRef(0);
  const titleId = useId();

  const snapshot = buildSnapshot({ locationId, viewMode, layerId, screen, stats });

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (!zone || zoneToken === 0 || zoneToken === seenZone.current) return;
    seenZone.current = zoneToken;
    const localText = explainZone(snapshot, zone);
    void publish("Explique la zone tracée sur la carte.", localText, zone);
    // La zone du moment est capturée ici ; les rendus suivants ne doivent pas relancer Groq.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone, zoneToken]);

  async function publish(
    question: string,
    localText: string,
    zoneForQuestion: typeof zone,
  ) {
    const userId = nextId.current++;
    const guideId = nextId.current++;
    const history = messages.map((message) => ({ role: message.role, text: message.text }));
    setMessages((current) => [
      ...current,
      { id: userId, role: "user", text: question },
      { id: guideId, role: "guide", text: "Je rédige…" },
    ]);
    setDraft("");
    const reply = await askGuide(question, snapshot, zoneForQuestion, history, localText);
    setMessages((current) =>
      current.map((message) =>
        message.id === guideId
          ? { ...message, text: reply.text, note: reply.note }
          : message,
      ),
    );
  }

  async function ask(question: string) {
    const clean = question.trim();
    if (!clean) return;
    await publish(clean, replyLocally(clean, snapshot).text, zone);
  }

  if (!open) return null;

  return (
    <section
      id={titleId}
      aria-label="En clair"
      className="ml-2 flex h-full w-[min(22rem,100%)] shrink-0 flex-col overflow-hidden rounded-xl bg-white max-[860px]:absolute max-[860px]:inset-y-3 max-[860px]:right-3 max-[860px]:z-[1300] max-[860px]:ml-0 max-[860px]:h-auto max-[860px]:max-h-none max-[860px]:shadow-[0_12px_28px_rgba(12,40,64,0.2)]"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#d5e3ea] px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[#154a7a]">
            <MessageCircle size={18} aria-hidden />
            <h2 className="text-base font-semibold">En clair</h2>
          </div>
          <p className="mt-0.5 truncate text-sm text-[#1d4e68]">{contextLine(snapshot)}</p>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="shrink-0 rounded-full p-1.5 text-[#154a7a] hover:bg-[#e7f3f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#154a7a]"
          aria-label="Fermer le guide"
        >
          <X size={16} />
        </button>
      </header>

      <div ref={listRef} className="guide-scroll min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
        {messages.length === 0 && (
          <p className="text-sm leading-6 text-[#123044]">
            Pose une question, ou trace un rectangle sur la carte. Les réponses s’empilent ici et se font défiler.
          </p>
        )}
        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="ml-8 rounded-2xl bg-[#154a7a] px-3 py-2">
              <Paragraphs text={message.text} tone="inverse" />
            </div>
          ) : (
            <div key={message.id} className="mr-6">
              <Paragraphs text={message.text} tone="ink" />
              {message.note && <p className="mt-2 text-sm text-[#1d4e68]">{message.note}</p>}
            </div>
          ),
        )}
      </div>

      <form
        className="shrink-0 border-t border-[#d5e3ea] px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(draft);
        }}
      >
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {GUIDE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void ask(prompt)}
              className="shrink-0 rounded-full bg-[#e7f3f6] px-3 py-1.5 text-sm font-medium text-[#0f3a52] hover:bg-[#d3e8ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#154a7a]"
            >
              {prompt}
            </button>
          ))}
        </div>
        <label htmlFor="guide-question" className="sr-only">
          Question
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="guide-question"
            value={draft}
            rows={2}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void ask(draft);
              }
            }}
            placeholder="Une question, avec tes mots."
            className="min-w-0 flex-1 resize-none rounded-xl border border-[#b7cdd6] bg-white px-3 py-2 text-sm leading-6 text-[#123044] caret-[#154a7a] outline-none placeholder:text-[#3d6274] focus-visible:border-[#154a7a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#154a7a]"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="shrink-0 rounded-full bg-[#154a7a] px-4 py-2 text-sm font-semibold text-white disabled:bg-[#8aa4b4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#154a7a]"
          >
            Expliquer
          </button>
        </div>
      </form>
    </section>
  );
}
