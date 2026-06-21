"use client";

import { useState, useEffect } from "react";
import { useGame } from "@/game/store";
import { TopBar } from "./TopBar";
import { HexMap } from "./HexMap";
import { PlotPanel } from "./PlotPanel";
import { EventLog } from "./EventLog";
import { GameClock } from "./GameClock";
import { BattleReport } from "./BattleReport";
import { AllegiancePanel } from "./AllegiancePanel";
import { SeasonPanel } from "./SeasonPanel";
import { WalletPanel } from "./WalletPanel";
import { DiplomacyPanel } from "./DiplomacyPanel";
import { CommandersPanel } from "./CommandersPanel";
import { ResearchPanel } from "./ResearchPanel";
import { QuestsPanel } from "./QuestsPanel";
import { StatsPanel } from "./StatsPanel";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { CodexPanel } from "./CodexPanel";
import { EventBanner } from "./EventBanner";
import { SettingsEffects, SettingsModal } from "./SettingsModal";
import { Toaster } from "./Toaster";
import { TutorialOverlay } from "./TutorialOverlay";
import { Tabs, type TabItem } from "./ui";

type View = "map" | "research" | "allegiance" | "diplomacy" | "commanders" | "quests" | "stats" | "leaderboard" | "codex" | "season" | "wallet";

const TABS: TabItem<View>[] = [
  { id: "map", label: "World", icon: "🗺️" },
  { id: "research", label: "Research", icon: "🔬" },
  { id: "allegiance", label: "Allegiance", icon: "🤝" },
  { id: "diplomacy", label: "Diplomacy", icon: "⚔️" },
  { id: "commanders", label: "Commanders", icon: "🎖️" },
  { id: "quests", label: "Quests", icon: "📜" },
  { id: "stats", label: "Stats", icon: "📊" },
  { id: "leaderboard", label: "Ranks", icon: "🏅" },
  { id: "codex", label: "Codex", icon: "📖" },
  { id: "season", label: "Season", icon: "🏆" },
  { id: "wallet", label: "Wallet", icon: "🔗" },
];

export function GameShell() {
  const [view, setView] = useState<View>("map");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const clearReport = useGame((s) => s.clearReport);

  // Keyboard shortcuts: 1–0 switch tabs, S settings, Esc close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "Escape") { setSettingsOpen(false); clearReport(); return; }
      if (e.key.toLowerCase() === "s") { setSettingsOpen((o) => !o); return; }
      const n = e.key === "0" ? 10 : Number(e.key);
      if (!Number.isNaN(n) && n >= 1 && n <= TABS.length) setView(TABS[n - 1].id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearReport]);

  return (
    <div className="flex h-dvh flex-col" style={{ background: "var(--panel-void)", color: "var(--text-hi)" }}>
      <GameClock />
      <SettingsEffects />
      <Toaster />
      <TutorialOverlay onView={(v) => setView(v as View)} />
      <BattleReport />
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      <TopBar onOpenSettings={() => setSettingsOpen(true)} />

      <Tabs tabs={TABS} value={view} onChange={setView} />
      <EventBanner />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {view === "map" ? (
          <>
            <main className="relative min-w-0 h-[42vh] shrink-0 md:h-auto md:flex-1">
              <HexMap />
            </main>
            <aside
              className="flex min-h-0 w-full flex-1 flex-col border-t md:w-[360px] md:flex-none md:border-l md:border-t-0"
              style={{ borderColor: "var(--hairline)", background: "var(--panel)" }}
            >
              <div className="min-h-0 flex-1 overflow-y-auto">
                <PlotPanel />
              </div>
              <EventLog />
            </aside>
          </>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {view === "research" && <ResearchPanel />}
            {view === "allegiance" && <AllegiancePanel />}
            {view === "diplomacy" && <DiplomacyPanel />}
            {view === "commanders" && <CommandersPanel />}
            {view === "quests" && <QuestsPanel />}
            {view === "stats" && <StatsPanel />}
            {view === "leaderboard" && <LeaderboardPanel />}
            {view === "codex" && <CodexPanel />}
            {view === "season" && <SeasonPanel />}
            {view === "wallet" && <WalletPanel />}
          </div>
        )}
      </div>
    </div>
  );
}
