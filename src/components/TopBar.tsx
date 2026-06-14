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
      className="flex items-center justify-between px-4 py-2"
      style={{ borderBottom: "1px solid var(--hairline)", background: "var(--panel-void)" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="wl-title"
          style={{ fontSize: "19px", fontWeight: 900, letterSpacing: "-0.01em", color: "var(--amber)" }}
        >
          WARLANDS
        </span>
        <Badge tone="blood" variant="solid">
          Prototype
        </Badge>
      </div>
      <div className="flex items-center gap-4">
        <Stat label="$WAR" value={num(war)} accent="amber" />
        <Stat label="Staked" value={num(staked)} accent="sky" />
        <Stat label="Burned" value={num(burned)} accent="blood" />
        <Stat label="Pool" value={num(pool)} accent="emerald" />
        <Stat label="Plots" value={String(plotCount)} accent="emerald" />
        <Stat label={`S${seasonIdx}·t`} value={String(tick)} accent="neutral" />
        <WalletButton />
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="px-1.5 py-1"
          style={{ borderRadius: "var(--radius-sm)", color: "var(--text-lo)", fontSize: "15px" }}
        >
          ⚙️
        </button>
      </div>
    </header>
  );
}
