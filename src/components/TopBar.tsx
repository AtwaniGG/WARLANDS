"use client";

import { useGame } from "@/game/store";

function num(n: number) {
  return Math.floor(n).toLocaleString();
}

export function TopBar() {
  const war = useGame((s) => s.war);
  const staked = useGame((s) => s.warStaked);
  const burned = useGame((s) => s.warBurned);
  const pool = useGame((s) => s.seasonPool);
  const seasonIdx = useGame((s) => s.season.index);
  const plots = useGame((s) => s.plots);
  const tick = useGame((s) => s.tick);

  const plotCount = Object.keys(plots).length;

  return (
    <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-lg font-black tracking-tight text-amber-400">WARLANDS</span>
        <span className="rounded bg-red-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-red-300">PROTOTYPE</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <Stat label="$WAR" value={num(war)} accent="text-amber-300" />
        <Stat label="Staked" value={num(staked)} accent="text-sky-300" />
        <Stat label="Burned" value={num(burned)} accent="text-red-300" />
        <Stat label="Pool" value={num(pool)} accent="text-emerald-300" />
        <Stat label="Plots" value={String(plotCount)} accent="text-emerald-300" />
        <Stat label={`S${seasonIdx}·t`} value={String(tick)} accent="text-zinc-400" />
      </div>
    </header>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</span>
      <span className={`font-mono font-semibold ${accent}`}>{value}</span>
    </div>
  );
}
