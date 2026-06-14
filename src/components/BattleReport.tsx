"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/game/store";
import { UNITS, UNIT_IDS, type Army } from "@/game/units";
import { RESOURCES, type ResourceId } from "@/game/resources";
import { play } from "@/game/sound";
import { Button } from "./ui";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ borderRadius: "var(--radius-sm)", background: "var(--surface-raised)", padding: "2px 6px", fontSize: "12px" }}>
      {children}
    </span>
  );
}

function ArmyLine({ army, empty }: { army: Army; empty: string }) {
  const items = UNIT_IDS.filter((u) => (army[u] ?? 0) > 0);
  if (items.length === 0) return <span style={{ color: "var(--text-muted)" }}>{empty}</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {items.map((u) => (
        <Chip key={u}>{UNITS[u].icon} ×{army[u]}</Chip>
      ))}
    </span>
  );
}

export function BattleReport() {
  const report = useGame((s) => s.battleReport);
  const clear = useGame((s) => s.clearReport);
  const lastWin = useRef<boolean | null>(null);

  useEffect(() => {
    if (report && lastWin.current !== report.attackerWins) {
      play(report.attackerWins ? "victory" : "defeat");
      lastWin.current = report.attackerWins;
    }
    if (!report) lastWin.current = null;
  }, [report]);

  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={clear}>
      <div
        className="w-full max-w-lg p-5"
        style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--border-strong)", background: "var(--panel)", boxShadow: "var(--shadow-modal)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="wl-title" style={{ fontSize: "22px", fontWeight: 900, color: report.attackerWins ? "var(--emerald-text)" : "var(--blood-text)" }}>
            {report.attackerWins ? "VICTORY" : "DEFEAT"}
          </h2>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>vs {report.target}</span>
        </div>

        <p className="mb-3" style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{report.summary}</p>

        <div className="mb-3 p-2" style={{ borderRadius: "var(--radius-sm)", background: "rgba(26,32,48,0.5)", fontSize: "12px" }}>
          <div className="flex justify-between">
            <span style={{ color: "var(--text-muted)" }}>Pre-battle win chance</span>
            <span className="wl-num" style={{ color: "var(--amber-text)" }}>{Math.round(report.winChance * 100)}%</span>
          </div>
          <div className="mt-1" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            (GDD §9: counters, terrain & scouting shift this — a smart underdog can still win.)
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3" style={{ fontSize: "12px" }}>
          <div>
            <div className="wl-label mb-1">Your losses</div>
            <ArmyLine army={report.attackerLosses} empty="No losses" />
            <div className="wl-label mb-1 mt-2">Survivors</div>
            <ArmyLine army={report.attackerSurvivors} empty="Wiped out" />
          </div>
          <div>
            <div className="wl-label mb-1">Enemy losses</div>
            <ArmyLine army={report.defenderLosses} empty="None" />
            <div className="wl-label mb-1 mt-2">Enemy survivors</div>
            <ArmyLine army={report.defenderSurvivors} empty="Annihilated" />
          </div>
        </div>

        {Object.keys(report.loot).length > 0 && (
          <div className="mt-3 p-2" style={{ borderRadius: "var(--radius-sm)", background: "rgba(245,179,1,0.1)" }}>
            <div className="wl-label mb-1" style={{ color: "var(--amber-text)" }}>Loot hauled back</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(report.loot).map(([k, v]) => (
                <Chip key={k}>
                  {RESOURCES[k as ResourceId].icon} {Math.floor(v as number).toLocaleString()}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div className="wl-num mt-3 max-h-28 overflow-y-auto p-2" style={{ borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.3)", fontSize: "10px", color: "var(--text-muted)" }}>
          {report.rounds.map((r) => (
            <div key={r.round}>R{r.round}: {r.note} — atk {r.attackerSize} / def {r.defenderSize}</div>
          ))}
        </div>

        <Button variant="primary" full className="mt-4" onClick={clear}>Close</Button>
      </div>
    </div>
  );
}
