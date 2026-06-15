"use client";

import { useGame } from "@/game/store";
import { WalletButton } from "./WalletButton";
import { Badge, Stat } from "./ui";

function num(n: number) {
  return Math.floor(n).toLocaleString();
}

export function TopBar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const war = useGame((s) => s.war);
  const staked = useGame((s) => s.warStaked);
  const burned = useGame((s) => s.warBurned);
  const pool = useGame((s) => s.seasonPool);
  const seasonIdx = useGame((s) => s.season.index);
  const plots = useGame((s) => s.plots);
  const tick = useGame((s) => s.tick);

  const plotCount = Object.keys(plots).length;

  return (
    <header
      className="flex items-center gap-2 px-2 py-2 sm:gap-3 sm:px-4"
      style={{ borderBottom: "1px solid var(--hairline)", background: "var(--panel-void)" }}
    >
      <div className="flex shrink-0 items-center gap-2">
        <span
          className="wl-title"
          style={{ fontSize: "17px", fontWeight: 900, letterSpacing: "-0.01em", color: "var(--amber)" }}
        >
          WARLANDS
        </span>
        <span className="hidden sm:inline-flex">
          <Badge tone="blood" variant="solid">
            Prototype
          </Badge>
        </span>
      </div>
      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-3 overflow-x-auto sm:gap-4">
        <Stat label="$WAR" value={num(war)} accent="amber" />
        <Stat label="Staked" value={num(staked)} accent="sky" />
        <Stat label="Burned" value={num(burned)} accent="blood" />
        <Stat label="Pool" value={num(pool)} accent="emerald" />
        <Stat label="Plots" value={String(plotCount)} accent="emerald" />
        <Stat label={`S${seasonIdx}·t`} value={String(tick)} accent="neutral" />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <WalletButton />
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="px-1.5 py-1"
          style={{ borderRadius: "var(--radius-sm)", color: "var(--text-lo)", fontSize: "17px", minWidth: 36, minHeight: 36 }}
        >
          ⚙️
        </button>
      </div>
    </header>
  );
}
