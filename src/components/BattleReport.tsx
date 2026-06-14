"use client";

import { useGame } from "@/game/store";
import { UNITS, UNIT_IDS, type Army } from "@/game/units";
import { RESOURCES, type ResourceId } from "@/game/resources";

function ArmyLine({ army, empty }: { army: Army; empty: string }) {
  const items = UNIT_IDS.filter((u) => (army[u] ?? 0) > 0);
  if (items.length === 0) return <span className="text-zinc-600">{empty}</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {items.map((u) => (
        <span key={u} className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">{UNITS[u].icon} ×{army[u]}</span>
      ))}
    </span>
  );
}

export function BattleReport() {
  const report = useGame((s) => s.battleReport);
  const clear = useGame((s) => s.clearReport);
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={clear}>
      <div
        className="w-full max-w-lg rounded-lg border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className={`text-xl font-black ${report.attackerWins ? "text-emerald-400" : "text-red-400"}`}>
            {report.attackerWins ? "VICTORY" : "DEFEAT"}
          </h2>
          <span className="text-xs text-zinc-500">vs {report.target}</span>
        </div>

        <p className="mb-3 text-sm text-zinc-300">{report.summary}</p>

        <div className="mb-3 rounded bg-zinc-800/50 p-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">Pre-battle win chance</span>
            <span className="font-mono text-amber-300">{Math.round(report.winChance * 100)}%</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            (GDD §9: counters, terrain & scouting shift this — a smart underdog can still win.)
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="mb-1 font-semibold text-zinc-400">Your losses</div>
            <ArmyLine army={report.attackerLosses} empty="No losses" />
            <div className="mb-1 mt-2 font-semibold text-zinc-400">Survivors</div>
            <ArmyLine army={report.attackerSurvivors} empty="Wiped out" />
          </div>
          <div>
            <div className="mb-1 font-semibold text-zinc-400">Enemy losses</div>
            <ArmyLine army={report.defenderLosses} empty="None" />
            <div className="mb-1 mt-2 font-semibold text-zinc-400">Enemy survivors</div>
            <ArmyLine army={report.defenderSurvivors} empty="Annihilated" />
          </div>
        </div>

        {Object.keys(report.loot).length > 0 && (
          <div className="mt-3 rounded bg-amber-950/30 p-2">
            <div className="mb-1 text-xs font-semibold text-amber-300">Loot hauled back</div>
            <div className="flex flex-wrap gap-1 text-xs">
              {Object.entries(report.loot).map(([k, v]) => (
                <span key={k} className="rounded bg-zinc-800 px-1.5 py-0.5">
                  {RESOURCES[k as ResourceId].icon} {Math.floor(v as number).toLocaleString()}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 max-h-28 overflow-y-auto rounded bg-black/30 p-2 font-mono text-[10px] text-zinc-500">
          {report.rounds.map((r) => (
            <div key={r.round}>R{r.round}: {r.note} — atk {r.attackerSize} / def {r.defenderSize}</div>
          ))}
        </div>

        <button onClick={clear} className="mt-4 w-full rounded bg-amber-500 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-400">
          Close
        </button>
      </div>
    </div>
  );
}
