"use client";

import { useGame } from "@/game/store";
import { Panel, Stat } from "./ui";

function Spark({ data, color, height = 56 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) {
    return <div style={{ height, display: "grid", placeItems: "center", color: "var(--text-muted)", fontSize: "11px" }}>collecting data…</div>;
  }
  const w = 280;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - 4 - ((v - min) / span) * (height - 8);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <path d={area} fill={color} fillOpacity={0.14} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

function num(n: number) {
  return Math.floor(n).toLocaleString();
}

export function StatsPanel() {
  const history = useGame((s) => s.history);
  const stats = useGame((s) => s.stats);
  const war = useGame((s) => s.war);
  const burned = useGame((s) => s.warBurned);
  const pool = useGame((s) => s.seasonPool);
  const plots = useGame((s) => Object.keys(s.plots).length);

  const charts: { label: string; key: "war" | "staked" | "burned" | "pool" | "plots"; color: string }[] = [
    { label: "$HEXAR Balance", key: "war", color: "var(--amber)" },
    { label: "Total Burned (sinks)", key: "burned", color: "var(--blood-text)" },
    { label: "Season Pool", key: "pool", color: "var(--emerald-text)" },
    { label: "Plots Held", key: "plots", color: "var(--sky-text)" },
  ];

  return (
    <div className="mx-auto max-w-3xl p-5">
      <h2 className="wl-title" style={{ fontSize: "22px", color: "var(--amber)" }}>Statistics</h2>
      <p className="mb-4" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        Live macro telemetry, sampled every 5 ticks. Burn rises monotonically (deflation); the
        pool tracks sink revenue available for season rewards.
      </p>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Panel padding="12px"><Stat label="$HEXAR" value={num(war)} accent="amber" align="stack" /></Panel>
        <Panel padding="12px"><Stat label="Burned" value={num(burned)} accent="blood" align="stack" /></Panel>
        <Panel padding="12px"><Stat label="Pool" value={num(pool)} accent="emerald" align="stack" /></Panel>
        <Panel padding="12px"><Stat label="Plots" value={String(plots)} accent="sky" align="stack" /></Panel>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {charts.map((c) => (
          <Panel key={c.key} title={c.label}>
            <Spark data={history.map((h) => h[c.key])} color={c.color} />
          </Panel>
        ))}
      </div>

      <Panel title="Lifetime Record" className="mt-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" style={{ fontSize: "12px" }}>
          {([
            ["Plots claimed", stats.plotsClaimed],
            ["Raids won", stats.raidsWon],
            ["Sieges won", stats.siegesWon],
            ["Empires crushed", stats.empiresEliminated],
            ["Tech researched", stats.techsResearched],
            ["Commanders", stats.commandersRecruited],
            ["Trades", stats.trades],
            ["Seasons", stats.seasonsPlayed],
          ] as const).map(([label, v]) => (
            <div key={label} className="flex flex-col px-2 py-1.5" style={{ borderRadius: "var(--radius-sm)", background: "var(--panel-2)" }}>
              <span className="wl-num" style={{ fontSize: "16px", fontWeight: 700, color: "var(--amber-text)" }}>{v}</span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{label}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
