"use client";

import { useGame } from "@/game/store";
import { PLOT_TYPES } from "@/game/plotTypes";
import { BUILDINGS, BUILDING_IDS, isBuildingAllowedOnTerrain } from "@/game/buildings";
import { RESOURCES, type ResourceId } from "@/game/resources";
import { upgradeCost, diminishingReturns } from "@/game/formulas";
import { MilitaryPanel, RaidPanel } from "./MilitaryPanel";

function num(n: number | undefined) {
  return Math.floor(n ?? 0).toLocaleString();
}

export function PlotPanel() {
  const selected = useGame((s) => s.selectedHex);
  const plots = useGame((s) => s.plots);
  const npcs = useGame((s) => s.npcs);
  const world = useGame((s) => s.world);
  const war = useGame((s) => s.war);
  const claimPlot = useGame((s) => s.claimPlot);
  const build = useGame((s) => s.build);
  const upgrade = useGame((s) => s.upgrade);
  const setFactoryProduct = useGame((s) => s.setFactoryProduct);
  const unstake = useGame((s) => s.unstake);
  const storageCap = useGame((s) => s.storageCap);

  if (!selected) {
    return (
      <div className="p-4 text-sm text-zinc-400">
        Select a hex on the map to inspect or claim it.
      </div>
    );
  }

  const hex = world.hexes.get(selected);
  if (!hex) return null;
  const def = PLOT_TYPES[hex.terrain];
  const plot = plots[selected];
  const npc = npcs[selected];

  // --- Unclaimed: show stake/claim CTA (+ raid panel if a hostile camp sits here) ---
  if (!plot) {
    const claimIndex = Object.keys(plots).length + 1;
    const canAfford = war >= def.stake;
    return (
      <div className="space-y-3 p-4">
        {npc && npc.defeatedAtTick === null && <RaidPanel npcKey={selected} />}
        <div>
          <div className="text-lg font-bold" style={{ color: def.color }}>{def.name}</div>
          <div className="text-xs text-zinc-400">Hex ({hex.q}, {hex.r}) · ring {hex.ring}</div>
        </div>
        <p className="text-sm text-zinc-300">{def.blurb}</p>
        <div className="rounded-md bg-zinc-800/60 p-3 text-xs text-zinc-300 space-y-1">
          <Row label="Stake to claim" value={`${num(def.stake)} $WAR`} />
          <Row label="Defense mult" value={`×${def.defenseMult}`} />
          <Row label="Reward mult" value={`×${def.rewardMult}`} />
          <Row label="This would be plot #" value={`${claimIndex} (yield DR ×${diminishingReturns(claimIndex).toFixed(2)})`} />
          <Row label="Protection" value={def.protectable ? "eligible" : "never (warzone)"} />
        </div>
        <button
          disabled={!canAfford}
          onClick={() => claimPlot(hex.q, hex.r)}
          className="w-full rounded-md bg-amber-500 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {canAfford ? `Stake ${num(def.stake)} $WAR & Claim` : "Insufficient $WAR"}
        </button>
        <p className="text-[11px] text-zinc-500">
          Staked $WAR is <span className="text-zinc-300">locked, never spent</span>. You get it back
          on unstake (minus a small early-unstake fee). It can never be looted by other players.
        </p>
      </div>
    );
  }

  // --- Owned: show economy management ---
  const cap = storageCap(plot);
  const terrainProduces = def.produces;
  const camp = plot.buildings.find((b) => b.id === "camp");
  const slotCap = 3 + (camp?.level ?? 1) * 2;
  const usedSlots = plot.buildings.filter((b) => b.id !== "camp").length;

  const buildable = BUILDING_IDS.filter((id) => {
    const bd = BUILDINGS[id];
    if (bd.kind === "hq") return false;
    return isBuildingAllowedOnTerrain(bd, terrainProduces);
  });

  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold" style={{ color: def.color }}>{plot.name}</div>
          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">OWNED</span>
        </div>
        <div className="text-xs text-zinc-400">
          {def.name} · staked {num(plot.stakeLocked)} $WAR · plot #{plot.claimIndex} (DR ×{diminishingReturns(plot.claimIndex).toFixed(2)})
        </div>
        <div className="mt-1 text-xs">
          Defense: <span className={plot.defensePct < 0.6 ? "text-red-400" : "text-emerald-400"}>{Math.round(plot.defensePct * 100)}%</span>
        </div>
      </div>

      {/* Inventory */}
      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Stockpile (cap {num(cap)})</div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          {(Object.keys(plot.resources) as ResourceId[])
            .filter((r) => (plot.resources[r] ?? 0) > 0.01)
            .map((r) => (
              <div key={r} className="flex items-center justify-between rounded bg-zinc-800/50 px-2 py-1">
                <span>{RESOURCES[r].icon} {RESOURCES[r].name}</span>
                <span className="font-mono text-zinc-300">{num(plot.resources[r])}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Buildings */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Buildings</span>
          <span className="text-[11px] text-zinc-500">slots {usedSlots}/{slotCap}</span>
        </div>
        <div className="space-y-1">
          {plot.buildings.map((b, i) => {
            const bd = BUILDINGS[b.id];
            const cost = upgradeCost(bd.baseCost || 200, b.level + 1);
            return (
              <div key={i} className="rounded bg-zinc-800/50 p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>{bd.icon} {bd.name} <span className="text-zinc-500">L{b.level}</span></span>
                  {b.level < bd.maxLevel && (
                    <button
                      onClick={() => upgrade(selected, i)}
                      disabled={war < cost}
                      className="rounded bg-sky-600 px-2 py-0.5 text-[11px] font-semibold hover:bg-sky-500 disabled:bg-zinc-700 disabled:text-zinc-500"
                    >
                      ⬆ {num(cost)}
                    </button>
                  )}
                </div>
                {bd.kind === "factory" && bd.makes && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {bd.makes.map((p) => (
                      <button
                        key={p}
                        onClick={() => setFactoryProduct(selected, i, p)}
                        className={`rounded px-1.5 py-0.5 text-[10px] ${b.activeProduct === p ? "bg-emerald-600 text-white" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}`}
                      >
                        {RESOURCES[p].icon} {RESOURCES[p].name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Build menu */}
      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Construct</div>
        <div className="grid grid-cols-1 gap-1">
          {buildable.map((id) => {
            const bd = BUILDINGS[id];
            const resCost = Object.entries(bd.baseResourceCost)
              .map(([k, v]) => `${v} ${RESOURCES[k as ResourceId].icon}`)
              .join(" ");
            const blocked = usedSlots >= slotCap || war < bd.baseCost;
            return (
              <button
                key={id}
                onClick={() => build(selected, id)}
                disabled={blocked}
                className="flex items-center justify-between rounded bg-zinc-800/60 px-2 py-1.5 text-left text-xs hover:bg-zinc-700/70 disabled:opacity-40"
              >
                <span>{bd.icon} {bd.name}</span>
                <span className="text-[10px] text-zinc-400">{num(bd.baseCost)}$ {resCost && `· ${resCost}`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Military */}
      <div className="border-t border-zinc-800 pt-3">
        <MilitaryPanel plotKey={selected} />
      </div>

      <button
        onClick={() => unstake(selected)}
        className="w-full rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10"
      >
        Unstake plot (return {num(plot.stakeLocked * 0.97)} $WAR · 3% fee)
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200">{value}</span>
    </div>
  );
}
