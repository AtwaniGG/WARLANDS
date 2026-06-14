"use client";

import { useGame } from "@/game/store";
import { TECHS, TECH_IDS, canResearch, type TechId } from "@/game/research";
import { Button, Panel, Badge } from "./ui";

const BRANCHES = ["Production", "Industry", "Military", "Economy"] as const;
const BRANCH_TONE = { Production: "emerald", Industry: "amber", Military: "blood", Economy: "teal" } as const;

export function ResearchPanel() {
  const unlocked = useGame((s) => s.unlockedTech);
  const research = useGame((s) => s.research);
  const bonuses = useGame((s) => s.techBonuses)();
  const data = useGame((s) => s.resourceTotal("dataChips"));
  const war = useGame((s) => s.war);

  return (
    <div className="mx-auto max-w-3xl p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="wl-title" style={{ fontSize: "22px", color: "var(--amber)" }}>Research &amp; Technology</h2>
        <span className="wl-num" style={{ fontSize: "12px", color: "var(--text-lo)" }}>💽 {Math.floor(data).toLocaleString()} Data Chips</span>
      </div>
      <p className="mb-3" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        Spend $WAR + Data Chips (mined on Tech Ruins terrain) to permanently unlock empire-wide
        bonuses (GDD §6.4). Prerequisites gate the deeper techs.
      </p>

      {/* active bonuses */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {bonuses.production > 0 && <Badge tone="emerald">+{Math.round(bonuses.production * 100)}% production</Badge>}
        {bonuses.combat > 0 && <Badge tone="blood">+{Math.round(bonuses.combat * 100)}% combat</Badge>}
        {bonuses.scout > 0 && <Badge tone="sky">+{Math.round(bonuses.scout * 100)}% scouting</Badge>}
        {bonuses.marketFee > 0 && <Badge tone="teal">−{Math.round(bonuses.marketFee * 100)}% market fees</Badge>}
        {bonuses.storage > 0 && <Badge tone="amber">+{bonuses.storage.toLocaleString()} storage</Badge>}
        {unlocked.length === 0 && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>No tech researched yet.</span>}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {BRANCHES.map((branch) => (
          <Panel key={branch} title={branch} accent>
            <div className="space-y-2">
              {TECH_IDS.filter((id) => TECHS[id].branch === branch).map((id) => {
                const t = TECHS[id];
                const done = unlocked.includes(id);
                const avail = canResearch(unlocked, id);
                const affordable = avail && war >= t.costWar && data >= t.costData;
                return (
                  <div
                    key={id}
                    className="p-2.5"
                    style={{
                      borderRadius: "var(--radius-sm)",
                      border: `1px solid ${done ? "rgba(52,211,153,0.4)" : "var(--hairline)"}`,
                      background: done ? "rgba(52,211,153,0.06)" : "var(--panel-2)",
                      opacity: !done && !avail ? 0.55 : 1,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>{t.name}</span>
                      {done && <Badge tone="emerald">done</Badge>}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-lo)" }}>{t.desc}</div>
                    {!done && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="wl-num" style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                          {t.costWar.toLocaleString()}$ · {t.costData}💽
                          {t.requires.length > 0 && !avail && <span style={{ color: "var(--blood-text)" }}> · needs {t.requires.map((r) => TECHS[r as TechId].name).join(", ")}</span>}
                        </span>
                        <Button size="sm" variant={BRANCH_TONE[branch] === "amber" ? "primary" : "info"} disabled={!affordable} onClick={() => research(id)}>
                          Research
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
