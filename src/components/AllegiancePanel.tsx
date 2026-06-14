"use client";

import { useState } from "react";
import { useGame } from "@/game/store";
import {
  ALLEGIANCE_BUILDINGS, totalContribution,
  type GovModel, type AllegianceBuildingId,
} from "@/game/allegiance";

const GOV_MODELS: { id: GovModel; label: string; desc: string }[] = [
  { id: "democracy", label: "Democracy", desc: "1 member = 1 vote." },
  { id: "weighted", label: "Weighted", desc: "Votes scale with contribution (capped)." },
  { id: "council", label: "Council", desc: "Elected council leans permissive." },
  { id: "founder", label: "Founder", desc: "Founder's bloc decides." },
];

function num(n: number) {
  return Math.floor(n).toLocaleString();
}

export function AllegiancePanel() {
  const allegiances = useGame((s) => s.allegiances);
  const pid = useGame((s) => s.playerAllegianceId);
  const create = useGame((s) => s.createAllegiance);
  const join = useGame((s) => s.joinAllegiance);
  const leave = useGame((s) => s.leaveAllegiance);
  const contribute = useGame((s) => s.contributeWar);
  const propose = useGame((s) => s.proposeBuilding);
  const vote = useGame((s) => s.voteProposal);
  const buffs = useGame((s) => s.allegianceBuffs)();

  const [name, setName] = useState("");
  const [gov, setGov] = useState<GovModel>("council");
  const [contribAmt, setContribAmt] = useState(1000);

  const mine = pid ? allegiances[pid] : null;
  const others = Object.values(allegiances).filter((a) => a.id !== pid);

  return (
    <div className="mx-auto max-w-3xl p-5">
      <h2 className="mb-1 text-xl font-bold text-amber-400">Allegiances</h2>
      <p className="mb-4 text-xs text-zinc-500">
        Political/military/economic orgs. Pool specialization, treasury & defense. Buildings grant region-wide buffs (GDD §10–11).
      </p>

      {!mine ? (
        <div className="space-y-5">
          {/* Found one */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-2 text-sm font-semibold text-zinc-200">Found an Allegiance (5,000 $WAR sink)</h3>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Allegiance name"
              className="mb-2 w-full rounded bg-zinc-800 px-3 py-1.5 text-sm"
            />
            <div className="mb-3 grid grid-cols-2 gap-1.5">
              {GOV_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setGov(m.id)}
                  className={`rounded p-2 text-left text-xs ${gov === m.id ? "bg-amber-500/20 ring-1 ring-amber-500" : "bg-zinc-800 hover:bg-zinc-700"}`}
                >
                  <div className="font-semibold">{m.label}</div>
                  <div className="text-[10px] text-zinc-400">{m.desc}</div>
                </button>
              ))}
            </div>
            <button onClick={() => create(name, gov)} className="w-full rounded bg-amber-500 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-400">
              Found Allegiance
            </button>
          </div>

          {/* Join existing */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-200">Apply to an existing Allegiance</h3>
            <div className="space-y-2">
              {others.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                  <div>
                    <div className="font-semibold">{a.name} <span className="text-[10px] uppercase text-zinc-500">{a.govModel}</span></div>
                    <div className="text-xs text-zinc-500">
                      {a.members.length} members · treasury {num(a.treasuryWar)} $WAR · {a.buildings.map((b) => ALLEGIANCE_BUILDINGS[b].icon).join(" ")}
                    </div>
                  </div>
                  <button onClick={() => join(a.id)} className="rounded bg-sky-700 px-3 py-1.5 text-xs font-semibold hover:bg-sky-600">Join</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overview */}
          <div className="rounded-lg border border-amber-500/30 bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-amber-300">{mine.name}</div>
                <div className="text-xs text-zinc-500">{mine.govModel} governance · {mine.members.length} members · CS pool {num(totalContribution(mine))}</div>
              </div>
              <button onClick={leave} className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10">Leave</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-zinc-800 px-2 py-1">Treasury: {num(mine.treasuryWar)} $WAR</span>
              {buffs.production > 0 && <span className="rounded bg-emerald-900/40 px-2 py-1 text-emerald-300">+{Math.round(buffs.production * 100)}% production</span>}
              {buffs.defense > 0 && <span className="rounded bg-sky-900/40 px-2 py-1 text-sky-300">+{Math.round(buffs.defense * 100)}% defense</span>}
              {buffs.marketFeeDiscount > 0 && <span className="rounded bg-amber-900/40 px-2 py-1 text-amber-300">−{Math.round(buffs.marketFeeDiscount * 100)}% market fees</span>}
              {buffs.scout > 0 && <span className="rounded bg-purple-900/40 px-2 py-1 text-purple-300">+{Math.round(buffs.scout * 100)}% scouting</span>}
            </div>
          </div>

          {/* Treasury contribution */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-2 text-sm font-semibold text-zinc-200">Contribute to Treasury (raises your CS)</h3>
            <div className="flex gap-2">
              <input type="number" value={contribAmt} min={1} onChange={(e) => setContribAmt(Math.max(1, Number(e.target.value) || 1))} className="w-32 rounded bg-zinc-800 px-3 py-1.5 text-right font-mono text-sm" />
              <button onClick={() => contribute(contribAmt)} className="rounded bg-emerald-700 px-4 py-1.5 text-sm font-semibold hover:bg-emerald-600">Contribute $WAR</button>
            </div>
          </div>

          {/* Governance: propose buildings */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-2 text-sm font-semibold text-zinc-200">Allegiance Buildings — propose to build (treasury-funded)</h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ALLEGIANCE_BUILDINGS) as AllegianceBuildingId[])
                .filter((b) => b !== "hq")
                .map((b) => {
                  const def = ALLEGIANCE_BUILDINGS[b];
                  const built = mine.buildings.includes(b);
                  return (
                    <button
                      key={b}
                      onClick={() => propose(b)}
                      disabled={built}
                      className="rounded bg-zinc-800 p-2 text-left text-xs hover:bg-zinc-700 disabled:opacity-40"
                    >
                      <div className="font-semibold">{def.icon} {def.name} {built && "✓"}</div>
                      <div className="text-[10px] text-zinc-400">{def.benefit}</div>
                      <div className="text-[10px] text-amber-400">{num(def.cost)} $WAR treasury</div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Active proposals */}
          {mine.proposals.length > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <h3 className="mb-2 text-sm font-semibold text-zinc-200">Proposals</h3>
              <div className="space-y-2">
                {mine.proposals.map((p) => (
                  <div key={p.id} className="rounded bg-zinc-800/60 p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>{p.label}</span>
                      {p.resolved ? (
                        <span className={p.passed ? "text-emerald-400" : "text-red-400"}>{p.passed ? "PASSED" : "FAILED"}</span>
                      ) : (
                        <span className="text-zinc-500">For {p.votesFor} / Against {p.votesAgainst}</span>
                      )}
                    </div>
                    {!p.resolved && !p.playerVoted && (
                      <div className="mt-1 flex gap-1">
                        <button onClick={() => vote(p.id, true)} className="rounded bg-emerald-700 px-2 py-0.5 text-[11px] hover:bg-emerald-600">Vote For</button>
                        <button onClick={() => vote(p.id, false)} className="rounded bg-red-700 px-2 py-0.5 text-[11px] hover:bg-red-600">Vote Against</button>
                      </div>
                    )}
                    {!p.resolved && p.playerVoted && <div className="mt-1 text-[10px] text-zinc-500">You voted. Resolving when the window closes…</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-2 text-sm font-semibold text-zinc-200">Members (by contribution)</h3>
            <div className="space-y-1 text-xs">
              {[...mine.members].sort((a, b) => b.contribution - a.contribution).slice(0, 12).map((m, i) => (
                <div key={i} className={`flex justify-between rounded px-2 py-1 ${m.isPlayer ? "bg-amber-500/10 text-amber-200" : "bg-zinc-800/40"}`}>
                  <span>{m.name} <span className="text-[10px] uppercase text-zinc-500">{m.role} · {m.archetype}</span></span>
                  <span className="font-mono">{num(m.contribution)} CS</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
