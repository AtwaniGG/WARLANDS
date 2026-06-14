"use client";

import { RESOURCES, INTERMEDIATE_RESOURCES, FINISHED_RESOURCES, type ResourceId } from "@/game/resources";
import { UNITS, UNIT_IDS, COUNTER } from "@/game/units";
import { PLOT_TYPES, TERRAIN_IDS } from "@/game/plotTypes";
import { Panel } from "./ui";
import { ResourceIcon, UnitIcon } from "./GameIcons";

function counterColor(v: number) {
  if (v >= 1.4) return "var(--emerald-text)";
  if (v > 1) return "#86efac";
  if (v < 0.7) return "var(--blood-text)";
  if (v < 1) return "#fca5a5";
  return "var(--text-muted)";
}

export function CodexPanel() {
  return (
    <div className="mx-auto max-w-3xl p-5">
      <h2 className="wl-title" style={{ fontSize: "22px", color: "var(--amber)" }}>Codex</h2>
      <p className="mb-4" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        Field manual — supply chains, unit counters, and land. Master these and the world is yours.
      </p>

      <Panel title="Unit Counters" className="mb-4">
        <p className="mb-2" style={{ fontSize: "11px", color: "var(--text-lo)" }}>Row attacks column. Green = strong, red = weak. Bring counters, not just numbers.</p>
        <div style={{ overflowX: "auto" }}>
          <table className="wl-num" style={{ borderCollapse: "collapse", fontSize: "11px", minWidth: 420 }}>
            <thead>
              <tr>
                <th style={{ padding: "4px 6px", textAlign: "left", color: "var(--text-muted)" }}>atk \ def</th>
                {UNIT_IDS.map((u) => <th key={u} style={{ padding: "4px 6px", color: "var(--text-lo)" }}><UnitIcon id={u} size={16} /></th>)}
              </tr>
            </thead>
            <tbody>
              {UNIT_IDS.map((a) => (
                <tr key={a}>
                  <td style={{ padding: "4px 6px", color: "var(--text-lo)" }}><span className="inline-flex items-center gap-1"><UnitIcon id={a} size={14} /> {UNITS[a].name}</span></td>
                  {UNIT_IDS.map((d) => (
                    <td key={d} style={{ padding: "4px 6px", textAlign: "center", color: counterColor(COUNTER[a][d]) }}>{COUNTER[a][d].toFixed(1)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Supply Chains" className="mb-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {[...INTERMEDIATE_RESOURCES, ...FINISHED_RESOURCES].map((id) => {
            const def = RESOURCES[id];
            const recipe = def.recipe ?? {};
            return (
              <div key={id} className="px-2.5 py-2" style={{ borderRadius: "var(--radius-sm)", background: "var(--panel-2)", fontSize: "12px" }}>
                <span className="inline-flex items-center gap-1" style={{ fontWeight: 600 }}><ResourceIcon id={id} size={15} /> {def.name}</span>
                <span style={{ color: "var(--text-muted)" }}> ⟵ </span>
                <span className="inline-flex flex-wrap items-center gap-2" style={{ color: "var(--text-lo)" }}>
                  {Object.entries(recipe).map(([k, v]) => (
                    <span key={k} className="inline-flex items-center gap-0.5">{v}×<ResourceIcon id={k as ResourceId} size={13} /></span>
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Land" className="mb-4">
        <div className="grid gap-1.5 sm:grid-cols-2">
          {TERRAIN_IDS.map((t) => {
            const d = PLOT_TYPES[t];
            return (
              <div key={t} className="flex items-center gap-2 px-2 py-1.5" style={{ borderRadius: "var(--radius-sm)", background: "var(--panel-2)", fontSize: "11px" }}>
                <span style={{ width: 10, height: 10, background: d.color, borderRadius: 2, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, minWidth: 110 }}>{d.name}</span>
                <span style={{ color: "var(--text-muted)" }}>{d.blurb}</span>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Core Doctrine">
        <ul style={{ fontSize: "12px", color: "var(--text-lo)", lineHeight: 1.6, paddingLeft: 16, listStyle: "disc" }}>
          <li><b style={{ color: "var(--text-hi)" }}>Staking</b> locks $WAR to secure land — never spent, never lootable. Conquest returns your full principal.</li>
          <li><b style={{ color: "var(--text-hi)" }}>Specialize & trade</b> — no plot makes everything; sell surplus, buy what you lack.</li>
          <li><b style={{ color: "var(--text-hi)" }}>Sinks fund rewards</b> — fees/upkeep are burned or pooled; payouts never exceed what sinks collected.</li>
          <li><b style={{ color: "var(--text-hi)" }}>Counters &gt; numbers</b> — a smart smaller force beats a blind bigger one.</li>
          <li><b style={{ color: "var(--text-hi)" }}>Seasons</b> reset territory; commanders, achievements & reputation are forever.</li>
        </ul>
      </Panel>
    </div>
  );
}
