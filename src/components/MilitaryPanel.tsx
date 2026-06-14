"use client";

import { useGame } from "@/game/store";
import { UNITS, UNIT_IDS, armySize, type UnitId, type Army } from "@/game/units";
import { RESOURCES, type ResourceId } from "@/game/resources";

/** Military management for the selected owned plot: train units + show garrison. */
export function MilitaryPanel({ plotKey }: { plotKey: string }) {
  const plot = useGame((s) => s.plots[plotKey]);
  const trainUnit = useGame((s) => s.trainUnit);
  if (!plot) return null;

  const hasArmsLab = plot.buildings.some((b) => b.id === "armsFactory" || b.id === "heavyWorks" || b.id === "electronicsLab");

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Garrison ({armySize(plot.army)} units)
      </div>
      {armySize(plot.army) > 0 ? (
        <div className="flex flex-wrap gap-1">
          {UNIT_IDS.filter((u) => (plot.army[u] ?? 0) > 0).map((u) => (
            <span key={u} className="rounded bg-zinc-800/70 px-2 py-1 text-xs">
              {UNITS[u].icon} {UNITS[u].name} ×{plot.army[u]}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-500">No troops. Train units below to defend or raid.</p>
      )}

      {plot.trainQueue.length > 0 && (
        <div className="text-[11px] text-amber-300">
          Training: {plot.trainQueue.map((t) => `${UNITS[t.unit].icon}${t.ticksLeft}s`).join(" · ")}
        </div>
      )}

      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Train Units</div>
      {!hasArmsLab && (
        <p className="text-[11px] text-zinc-500">Tip: build an Arms Factory / Heavy Works to produce unit inputs.</p>
      )}
      <div className="grid grid-cols-1 gap-1">
        {UNIT_IDS.map((u) => {
          const def = UNITS[u];
          const costStr = Object.entries(def.cost)
            .map(([k, v]) => `${v}${RESOURCES[k as ResourceId].icon}`)
            .join(" ");
          return (
            <button
              key={u}
              onClick={() => trainUnit(plotKey, u as UnitId)}
              className="flex items-center justify-between rounded bg-zinc-800/60 px-2 py-1.5 text-left text-xs hover:bg-zinc-700/70"
              title={def.desc}
            >
              <span>{def.icon} {def.name} <span className="text-zinc-500">A{def.attack}/D{def.defense}</span></span>
              <span className="text-[10px] text-zinc-400">{def.costWar}$ {costStr}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Raid planner shown when an NPC camp hex is selected. */
export function RaidPanel({ npcKey }: { npcKey: string }) {
  const npc = useGame((s) => s.npcs[npcKey]);
  const plots = useGame((s) => s.plots);
  const scoutNpc = useGame((s) => s.scoutNpc);
  const raidNpc = useGame((s) => s.raidNpc);

  // pick the player's strongest nearby plot as launch base (closest by hex distance)
  const owned = Object.entries(plots);
  if (!npc) return null;

  if (owned.length === 0) {
    return <p className="p-1 text-xs text-zinc-500">Claim and garrison a plot before raiding.</p>;
  }

  // launch base = owned plot with the most troops
  const [baseKey, base] = owned.sort((a, b) => armySize(b[1].army) - armySize(a[1].army))[0];

  const respawning = npc.defeatedAtTick !== null;

  return (
    <div className="space-y-2 rounded-md border border-red-500/30 bg-red-950/20 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-red-300">⚔ Hostile Camp</span>
        <span className="rounded bg-red-900/50 px-1.5 py-0.5 text-[10px] text-red-200">TIER {npc.tier}</span>
      </div>

      {respawning ? (
        <p className="text-xs text-zinc-400">This camp was cleared. It will regroup shortly.</p>
      ) : (
        <>
          {npc.scouted ? (
            <div className="text-xs text-zinc-300">
              <div className="mb-1 text-zinc-500">Scouted garrison:</div>
              <div className="flex flex-wrap gap-1">
                {UNIT_IDS.filter((u) => (npc.army[u] ?? 0) > 0).map((u) => (
                  <span key={u} className="rounded bg-zinc-800/70 px-1.5 py-0.5">{UNITS[u].icon}×{npc.army[u]}</span>
                ))}
              </div>
              <div className="mt-1 text-zinc-500">Loot: {Object.entries(npc.stock).filter(([, v]) => (v as number) > 0).map(([k]) => RESOURCES[k as ResourceId].icon).join(" ")}</div>
            </div>
          ) : (
            <p className="text-xs text-zinc-400">Unknown strength. Scout first (50 $WAR) to reveal the garrison.</p>
          )}

          <div className="flex gap-1">
            <button
              onClick={() => scoutNpc(npcKey, baseKey)}
              disabled={npc.scouted}
              className="flex-1 rounded bg-sky-700 px-2 py-1 text-xs font-semibold hover:bg-sky-600 disabled:opacity-40"
            >
              🔭 Scout (50$)
            </button>
            <button
              onClick={() => raidNpc(npcKey, baseKey, fullArmy(base.army), "raid")}
              disabled={armySize(base.army) === 0}
              className="flex-1 rounded bg-amber-600 px-2 py-1 text-xs font-semibold text-black hover:bg-amber-500 disabled:opacity-40"
            >
              🗡️ Raid
            </button>
            <button
              onClick={() => raidNpc(npcKey, baseKey, fullArmy(base.army), "siege")}
              disabled={armySize(base.army) === 0}
              className="flex-1 rounded bg-red-700 px-2 py-1 text-xs font-semibold hover:bg-red-600 disabled:opacity-40"
            >
              🏰 Siege
            </button>
          </div>
          <p className="text-[11px] text-zinc-500">
            Launching from <span className="text-zinc-300">{base.name}</span> with{" "}
            <span className="text-zinc-300">{armySize(base.army)}</span> troops.
            {armySize(base.army) === 0 && " Train troops there first."}
          </p>
        </>
      )}
    </div>
  );
}

function fullArmy(a: Army): Army {
  const out: Army = {};
  for (const id of UNIT_IDS) if (a[id]) out[id] = a[id];
  return out;
}
