import { CloudRain } from "lucide-react";
import type { DashboardScreen } from "@/types/meteo";

const TABS: { id: DashboardScreen; label: string }[] = [
  { id: "map", label: "Carte" },
  { id: "series", label: "Séries" },
  { id: "signals", label: "Océans" },
  { id: "metrics", label: "Modèles" },
  { id: "limits", label: "Limites" },
];

type Props = {
  screen: DashboardScreen;
  onChange: (screen: DashboardScreen) => void;
};

export default function DashboardTabs({ screen, onChange }: Props) {
  return (
    <nav className="flex items-center gap-0.5 rounded-full bg-[#154a7a] px-1.5 py-1 text-white">
      <span className="mr-1 flex size-9 items-center justify-center rounded-full bg-white/15">
        <CloudRain size={18} />
      </span>
      {TABS.map((tab) => {
        const active = screen === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
              active
                ? "bg-white text-[#154a7a] shadow-sm"
                : "text-white/85 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
