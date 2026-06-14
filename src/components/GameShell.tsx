"use client";

import { useState } from "react";
import { TopBar } from "./TopBar";
import { HexMap } from "./HexMap";
import { PlotPanel } from "./PlotPanel";
import { EventLog } from "./EventLog";
import { GameClock } from "./GameClock";
import { BattleReport } from "./BattleReport";
import { MarketPanel } from "./MarketPanel";
import { AllegiancePanel } from "./AllegiancePanel";
import { SeasonPanel } from "./SeasonPanel";
import { WalletPanel } from "./WalletPanel";

type View = "map" | "market" | "allegiance" | "season" | "wallet";

const TABS: { id: View; label: string; icon: string }[] = [
  { id: "map", label: "World", icon: "🗺️" },
  { id: "market", label: "Market", icon: "💱" },
  { id: "allegiance", label: "Allegiance", icon: "🤝" },
  { id: "season", label: "Season", icon: "🏆" },
  { id: "wallet", label: "Wallet", icon: "🔗" },
];

export function GameShell() {
  const [view, setView] = useState<View>("map");

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-100">
      <GameClock />
      <BattleReport />
      <TopBar />

      <nav className="flex gap-1 border-b border-zinc-800 bg-zinc-950 px-3 py-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`rounded px-3 py-1 text-xs font-semibold ${view === t.id ? "bg-amber-500 text-black" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      <div className="flex min-h-0 flex-1">
        {view === "map" ? (
          <>
            <main className="relative min-w-0 flex-1">
              <HexMap />
            </main>
            <aside className="flex w-[360px] flex-col border-l border-zinc-800 bg-zinc-900">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <PlotPanel />
              </div>
              <EventLog />
            </aside>
          </>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {view === "market" && <MarketPanel />}
            {view === "allegiance" && <AllegiancePanel />}
            {view === "season" && <SeasonPanel />}
            {view === "wallet" && <WalletPanel />}
          </div>
        )}
      </div>
    </div>
  );
}
