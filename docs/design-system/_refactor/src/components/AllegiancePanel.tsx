"use client";

import { useState } from "react";
import { useGame } from "@/game/store";
import {
  ALLEGIANCE_BUILDINGS, totalContribution,
  type GovModel, type AllegianceBuildingId,
} from "@/game/allegiance";
import { Badge, Button, Panel } from "./ui";

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

  const inputStyle: React.CSSProperties = {
    borderRadius: "var(--radius-sm)",
    background: "var(--panel-2)",
    border: "1px solid var(--hairline)",
    color: "var(--text-hi)",
  };

  return (
    <div className="mx-auto max-w-3xl p-5">
      <h2 className="wl-title mb-1" style={{ fontSize: "22px", color: "var(--amber)" }}>Allegiances</h2>
      <p className="mb-4" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        Political/military/economic orgs. Pool specialization, treasury & defense. Buildings grant region-wide buffs (GDD §10–11).
      </p>

      {!mine ? (
        <div className="space-y-5">
          {/* Found one */}
          <Panel title="Found an Allegiance (5,000 $WAR sink)">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Allegiance name"
              className="mb-2 w-full px-3 py-1.5"
              style={{ ...inputStyle, fontSize: "13px" }}
            />
            <div className="mb-3 grid grid-cols-2 gap-1.5">
              {GOV_MODELS.map((m) => {
                const active = gov === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setGov(m.id)}
                    className="p-2 text-left"
                    style={{
                      borderRadius: "var(--radius-sm)",
                      fontSize: "12px",
                      cursor: "pointer",
                      color: "var(--text-primary)",
                      background: active ? "rgba(245,179,1,0.16)" : "var(--surface-raised)",
                      border: active ? "1px solid var(--amber)" : "1px solid transparent",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{m.label}</div>
                    <div style={{ fontSize: "10px", color: "var(--text-lo)" }}>{m.desc}</div>
                  </button>
                );
              })}
            </div>
            <Button variant="primary" full onClick={() => create(name, gov)}>Found Allegiance</Button>
          </Panel>

          {/* Join existing */}
          <div>
            <h3 className="wl-label mb-2" style={{ color: "var(--text-secondary)" }}>Apply to an existing Allegiance</h3>
            <div className="space-y-2">
              {others.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3" style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--hairline)", background: "var(--panel)" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.name} <span className="wl-label">{a.govModel}</span></div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {a.members.length} members · treasury {num(a.treasuryWar)} $WAR · {a.buildings.map((b) => ALLEGIANCE_BUILDINGS[b].icon).join(" ")}
                    </div>
                  </div>
                  <Button variant="info" size="sm" onClick={() => join(a.id)}>Join</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overview */}
          <Panel rim="amber" padding="16px">
            <div className="flex items-center justify-between">
              <div>
                <div className="wl-title" style={{ fontSize: "18px", color: "var(--amber-text)" }}>{mine.name}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{mine.govModel} governance · {mine.members.length} members · CS pool {num(totalContribution(mine))}</div>
              </div>
              <Button variant="outline" size="sm" style={{ color: "var(--blood-text)", borderColor: "rgba(220,38,38,0.4)" }} onClick={leave}>Leave</Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="neutral">Treasury: {num(mine.treasuryWar)} $WAR</Badge>
              {buffs.production > 0 && <Badge tone="emerald">+{Math.round(buffs.production * 100)}% production</Badge>}
              {buffs.defense > 0 && <Badge tone="sky">+{Math.round(buffs.defense * 100)}% defense</Badge>}
              {buffs.marketFeeDiscount > 0 && <Badge tone="amber">−{Math.round(buffs.marketFeeDiscount * 100)}% market fees</Badge>}
              {buffs.scout > 0 && <Badge tone="violet">+{Math.round(buffs.scout * 100)}% scouting</Badge>}
            </div>
          </Panel>

          {/* Treasury contribution */}
          <Panel title="Contribute to Treasury (raises your CS)">
            <div className="flex gap-2">
              <input type="number" value={contribAmt} min={1} onChange={(e) => setContribAmt(Math.max(1, Number(e.target.value) || 1))} className="wl-num w-32 px-3 py-1.5 text-right" style={{ ...inputStyle, fontSize: "13px" }} />
              <Button variant="success" onClick={() => contribute(contribAmt)}>Contribute $WAR</Button>
            </div>
          </Panel>

          {/* Governance: propose buildings */}
          <Panel title="Allegiance Buildings — propose to build (treasury-funded)">
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
                      className="p-2 text-left"
                      style={{
                        borderRadius: "var(--radius-sm)",
                        background: "var(--surface-raised)",
                        fontSize: "12px",
                        color: "var(--text-primary)",
                        border: "1px solid var(--hairline)",
                        cursor: built ? "not-allowed" : "pointer",
                        opacity: built ? 0.4 : 1,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{def.icon} {def.name} {built && "✓"}</div>
                      <div style={{ fontSize: "10px", color: "var(--text-lo)" }}>{def.benefit}</div>
                      <div className="wl-num" style={{ fontSize: "10px", color: "var(--amber-text)" }}>{num(def.cost)} $WAR treasury</div>
                    </button>
                  );
                })}
            </div>
          </Panel>

          {/* Active proposals */}
          {mine.proposals.length > 0 && (
            <Panel title="Proposals">
              <div className="space-y-2">
                {mine.proposals.map((p) => (
                  <div key={p.id} className="p-2" style={{ borderRadius: "var(--radius-sm)", background: "rgba(26,32,48,0.6)", fontSize: "12px" }}>
                    <div className="flex items-center justify-between">
                      <span>{p.label}</span>
                      {p.resolved ? (
                        <Badge tone={p.passed ? "emerald" : "blood"}>{p.passed ? "Passed" : "Failed"}</Badge>
                      ) : (
                        <span className="wl-num" style={{ color: "var(--text-muted)" }}>For {p.votesFor} / Against {p.votesAgainst}</span>
                      )}
                    </div>
                    {!p.resolved && !p.playerVoted && (
                      <div className="mt-1 flex gap-1">
                        <Button variant="success" size="sm" onClick={() => vote(p.id, true)}>Vote For</Button>
                        <Button variant="danger" size="sm" onClick={() => vote(p.id, false)}>Vote Against</Button>
                      </div>
                    )}
                    {!p.resolved && p.playerVoted && <div className="mt-1" style={{ fontSize: "10px", color: "var(--text-muted)" }}>You voted. Resolving when the window closes…</div>}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Members */}
          <Panel title="Members (by contribution)">
            <div className="space-y-1" style={{ fontSize: "12px" }}>
              {[...mine.members].sort((a, b) => b.contribution - a.contribution).slice(0, 12).map((m, i) => (
                <div
                  key={i}
                  className="flex justify-between px-2 py-1"
                  style={{
                    borderRadius: "var(--radius-sm)",
                    background: m.isPlayer ? "rgba(245,179,1,0.1)" : "rgba(26,32,48,0.4)",
                    color: m.isPlayer ? "var(--amber-text)" : "var(--text-primary)",
                  }}
                >
                  <span>{m.name} <span className="wl-label">{m.role} · {m.archetype}</span></span>
                  <span className="wl-num">{num(m.contribution)} CS</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
