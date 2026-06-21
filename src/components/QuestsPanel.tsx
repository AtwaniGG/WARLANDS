"use client";

import { useGame } from "@/game/store";
import { ACHIEVEMENTS, QUESTS } from "@/game/achievements";
import { Panel, Badge } from "./ui";

export function QuestsPanel() {
  const stats = useGame((s) => s.stats);
  const doneQuests = useGame((s) => s.completedQuests);
  const unlocked = useGame((s) => s.unlockedAchievements);

  return (
    <div className="mx-auto max-w-3xl p-5">
      <h2 className="wl-title" style={{ fontSize: "22px", color: "var(--amber)" }}>Quests &amp; Achievements</h2>
      <p className="mb-4" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        Objectives auto-complete and pay out once when you hit the target. Achievements are
        permanent account badges that survive season resets.
      </p>

      <Panel title={`Quests (${doneQuests.length}/${QUESTS.length})`} className="mb-4">
        <div className="space-y-2">
          {QUESTS.map((q) => {
            const cur = Math.min(stats[q.stat], q.target);
            const done = doneQuests.includes(q.id);
            return (
              <div key={q.id} className="p-2.5" style={{ borderRadius: "var(--radius-sm)", border: `1px solid ${done ? "rgba(52,211,153,0.4)" : "var(--hairline)"}`, background: done ? "rgba(52,211,153,0.06)" : "var(--panel-2)" }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>{q.name}</span>
                  {done ? <Badge tone="emerald">claimed</Badge> : <span className="wl-num" style={{ fontSize: "11px", color: "var(--amber-text)" }}>+{q.reward.toLocaleString()} $HEXAR</span>}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-lo)" }}>{q.desc}</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden" style={{ borderRadius: "999px", background: "var(--surface-sunken)" }}>
                    <div style={{ width: `${(cur / q.target) * 100}%`, height: "100%", background: done ? "var(--emerald-text)" : "var(--amber)" }} />
                  </div>
                  <span className="wl-num" style={{ fontSize: "10px", color: "var(--text-muted)" }}>{cur}/{q.target}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title={`Achievements (${unlocked.length}/${ACHIEVEMENTS.length})`}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const got = unlocked.includes(a.id);
            return (
              <div key={a.id} className="p-2.5 text-center" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--hairline)", background: "var(--panel-2)", opacity: got ? 1 : 0.45 }}>
                <div style={{ fontSize: "22px", filter: got ? "none" : "grayscale(1)" }}>{a.icon}</div>
                <div style={{ fontSize: "12px", fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{a.desc}</div>
                {got && <div className="mt-1"><Badge tone="amber">unlocked</Badge></div>}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
