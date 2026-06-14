"use client";

import { useGame } from "@/game/store";
import { SKILLS, RARITY_META, xpForLevel, type Commander } from "@/game/commanders";
import { PLOT_TYPES } from "@/game/plotTypes";
import { Button, Panel, Badge } from "./ui";
import { CommanderPortrait } from "./GameIcons";

function rarityTone(r: Commander["rarity"]) {
  return r === "legendary" ? "amber" : r === "epic" ? "violet" : r === "rare" ? "sky" : "neutral";
}

export function CommandersPanel() {
  const commanders = useGame((s) => s.commanders);
  const pool = useGame((s) => s.recruitPool);
  const plots = useGame((s) => s.plots);
  const plotCommander = useGame((s) => s.plotCommander);
  const recruit = useGame((s) => s.recruitCommander);
  const reroll = useGame((s) => s.rerollRecruits);
  const assign = useGame((s) => s.assignCommander);

  const assignedTo = (id: string) => Object.entries(plotCommander).find(([, cid]) => cid === id)?.[0];
  const plotEntries = Object.entries(plots);

  return (
    <div className="mx-auto max-w-3xl p-5">
      <h2 className="wl-title" style={{ fontSize: "22px", color: "var(--amber)" }}>Commanders</h2>
      <p className="mb-4" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        Account-permanent heroes (GDD §8.4). Assign one to a plot to buff its raids/defense and
        economy. They gain XP and level up from victories, and survive season resets.
      </p>

      {/* Owned */}
      <Panel title={`Your Roster (${commanders.length})`} className="mb-4">
        {commanders.length === 0 ? (
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No commanders yet. Recruit one below.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {commanders.map((c) => {
              const s = SKILLS[c.skillId];
              const need = xpForLevel(c.level, c.rarity);
              const at = assignedTo(c.id);
              return (
                <div key={c.id} className="p-3" style={{ borderRadius: "var(--radius-md)", border: `1px solid ${RARITY_META[c.rarity].color}55`, background: "var(--panel-2)" }}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5" style={{ fontWeight: 600 }}>
                      <CommanderPortrait id={c.id} fallback={c.icon} rarity={c.rarity} size={24} /> {c.name}
                    </span>
                    <Badge tone={rarityTone(c.rarity)}>{c.rarity}</Badge>
                  </div>
                  <div className="mt-1" style={{ fontSize: "11px", color: "var(--text-lo)" }}>
                    {s.icon} {s.name} — {s.desc}
                  </div>
                  <div className="mt-2 flex items-center gap-2" style={{ fontSize: "11px" }}>
                    <span className="wl-num" style={{ color: "var(--amber-text)" }}>L{c.level}</span>
                    <div className="h-1.5 flex-1 overflow-hidden" style={{ borderRadius: "999px", background: "var(--surface-sunken)" }}>
                      <div style={{ width: `${Math.min(100, (c.xp / need) * 100)}%`, height: "100%", background: "var(--amber)" }} />
                    </div>
                    <span className="wl-num" style={{ color: "var(--text-muted)" }}>{Math.floor(c.xp)}/{need}</span>
                  </div>
                  <div className="mt-2">
                    <select
                      value={at ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) assign(v, c.id);
                        else if (at) assign(at, null);
                      }}
                      className="w-full px-2 py-1"
                      style={{ borderRadius: "var(--radius-sm)", background: "var(--panel)", border: "1px solid var(--hairline)", color: "var(--text-hi)", fontSize: "11px" }}
                    >
                      <option value="">— unassigned —</option>
                      {plotEntries.map(([k, p]) => (
                        <option key={k} value={k}>{PLOT_TYPES[p.terrain].name} ({k})</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Recruit pool */}
      <Panel
        title="Recruit Candidates"
        headerRight={<Button size="sm" variant="ghost" onClick={reroll}>↻ Reroll (500 $WAR)</Button>}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {pool.map((c) => {
            const s = SKILLS[c.skillId];
            return (
              <div key={c.id} className="p-3" style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--hairline)", background: "var(--panel-2)" }}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5" style={{ fontWeight: 600 }}>
                    <CommanderPortrait id={c.id} fallback={c.icon} rarity={c.rarity} size={24} /> {c.name}
                  </span>
                  <Badge tone={rarityTone(c.rarity)}>{c.rarity}</Badge>
                </div>
                <div className="mt-1" style={{ fontSize: "11px", color: "var(--text-lo)" }}>{s.icon} {s.name} — {s.desc}</div>
                <Button size="sm" variant="primary" full className="mt-2" onClick={() => recruit(c.id)}>
                  Recruit · {RARITY_META[c.rarity].recruitCost.toLocaleString()} $WAR
                </Button>
              </div>
            );
          })}
          {pool.length === 0 && <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No candidates — reroll for more.</p>}
        </div>
      </Panel>
    </div>
  );
}
