"use client";

import { useGame } from "@/game/store";
import { empirePower, type Stance } from "@/game/empire";
import { UNITS, UNIT_IDS } from "@/game/units";

const STANCE_STYLE: Record<Stance, string> = {
  neutral: "bg-zinc-800 text-zinc-300",
  ally: "bg-sky-900/60 text-sky-200",
  war: "bg-red-900/60 text-red-200",
};

export function DiplomacyPanel() {
  const empires = useGame((s) => s.empires);
  const setStance = useGame((s) => s.setStance);
  const list = Object.values(empires);

  return (
    <div className="mx-auto max-w-3xl p-5">
      <h2 className="mb-1 text-xl font-bold text-amber-400">Diplomacy &amp; Rival Empires</h2>
      <p className="mb-4 text-xs text-zinc-500">
        Rival powers hold territory across the map (GDD §10.5–10.6). Make peace, ally, or wage war —
        empires at war will raid your richest plots, and siege victories conquer their land.
      </p>

      {list.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center text-sm text-zinc-400">
          🏆 All rival empires have been eliminated. The map is yours to contest.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((e) => {
            const territories = Object.keys(e.plots).length;
            return (
              <div key={e.id} className="rounded-lg border bg-zinc-900 p-4" style={{ borderColor: e.color + "44" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold" style={{ color: e.color }}>{e.banner} {e.name}</div>
                    <div className="text-xs text-zinc-500">
                      {territories} territories · power {empirePower(e)} · tier {e.tier}
                    </div>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${STANCE_STYLE[e.stance]}`}>{e.stance.toUpperCase()}</span>
                </div>

                {e.scouted && (
                  <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-zinc-400">
                    {UNIT_IDS.map((u) => {
                      const n = Object.values(e.plots).reduce((s, p) => s + (p.garrison[u] ?? 0), 0);
                      return n > 0 ? <span key={u} className="rounded bg-zinc-800 px-1.5 py-0.5">{UNITS[u].icon} {n}</span> : null;
                    })}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-1">
                  {e.stance !== "war" && (
                    <button onClick={() => setStance(e.id, "war")} className="rounded border border-red-500/40 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/10">Declare War</button>
                  )}
                  {e.stance === "war" && (
                    <button onClick={() => setStance(e.id, "neutral")} className="rounded border border-zinc-600 px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:bg-zinc-800">Sue for Peace</button>
                  )}
                  {e.stance !== "ally" && (
                    <button onClick={() => setStance(e.id, "ally")} className="rounded border border-sky-500/40 px-2.5 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/10">Propose Alliance</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
