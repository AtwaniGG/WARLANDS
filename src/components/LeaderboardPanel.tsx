"use client";

import { useGame } from "@/game/store";
import { empirePower } from "@/game/empire";
import { armySize } from "@/game/units";
import { Panel, Badge } from "./ui";

function num(n: number) {
  return Math.floor(n).toLocaleString();
}

export function LeaderboardPanel() {
  const plots = useGame((s) => s.plots);
  const empires = useGame((s) => s.empires);
  const score = useGame((s) => s.seasonScore)();

  // Unified "world powers" ranking by military strength + territory.
  const playerUnits = Object.values(plots).reduce((s, p) => s + armySize(p.army), 0);
  const playerPower = playerUnits + Object.keys(plots).length * 2;

  const powers = [
    { id: "you", name: "You", color: "var(--amber)", banner: "👑", power: playerPower, territories: Object.keys(plots).length, isPlayer: true },
    ...Object.values(empires).map((e) => ({
      id: e.id, name: e.name, color: e.color, banner: e.banner,
      power: empirePower(e) + Object.keys(e.plots).length * 2,
      territories: Object.keys(e.plots).length, isPlayer: false,
    })),
  ].sort((a, b) => b.power - a.power);
  const maxPower = Math.max(1, ...powers.map((p) => p.power));

  // Season standings vs the AI competitors used at season resolution.
  const aiScores = [
    { name: "Vanguard Coalition", score: score.total * 1.3 },
    { name: "Free Companies", score: score.total * 0.9 },
    { name: "Border Lords", score: score.total * 0.6 },
    { name: "Frontier Holdouts", score: score.total * 0.4 },
  ];
  const standings = [{ name: "You", score: score.total, isPlayer: true }, ...aiScores.map((a) => ({ ...a, isPlayer: false }))]
    .sort((a, b) => b.score - a.score);

  return (
    <div className="mx-auto max-w-3xl p-5">
      <h2 className="wl-title" style={{ fontSize: "22px", color: "var(--amber)" }}>Leaderboard</h2>
      <p className="mb-4" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        Where you stand among the powers of the world — by raw strength and by season score.
      </p>

      <Panel title="World Powers · Military Strength" className="mb-4">
        <div className="space-y-2">
          {powers.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="wl-num" style={{ width: 22, fontSize: "12px", color: "var(--text-muted)" }}>#{i + 1}</span>
              <span style={{ width: 18 }}>{p.banner}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "12px", fontWeight: p.isPlayer ? 700 : 500, color: p.isPlayer ? "var(--amber-text)" : "var(--text-hi)" }}>
                    {p.name}
                  </span>
                  <span className="wl-num" style={{ fontSize: "11px", color: "var(--text-lo)" }}>{num(p.power)} · {p.territories} terr.</span>
                </div>
                <div className="mt-0.5 h-1.5 overflow-hidden" style={{ borderRadius: "999px", background: "var(--surface-sunken)" }}>
                  <div style={{ width: `${(p.power / maxPower) * 100}%`, height: "100%", background: p.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Season Standings · Score">
        <div className="space-y-1.5">
          {standings.map((s, i) => (
            <div key={s.name} className="flex items-center justify-between px-2 py-1.5"
              style={{ borderRadius: "var(--radius-sm)", background: s.isPlayer ? "rgba(245,179,1,0.1)" : "var(--panel-2)" }}>
              <span style={{ fontSize: "12px", color: s.isPlayer ? "var(--amber-text)" : "var(--text-hi)" }}>
                #{i + 1} {s.name}
              </span>
              <div className="flex items-center gap-2">
                {i === 0 && <Badge tone="amber">leader</Badge>}
                <span className="wl-num" style={{ fontSize: "12px", color: "var(--text-lo)" }}>{num(s.score)}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
