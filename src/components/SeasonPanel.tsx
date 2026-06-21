"use client";

import { useGame } from "@/game/store";
import { SEASON_TICKS } from "@/game/store";
import { Button, Panel, ProgressBar, Stat } from "./ui";

function num(n: number) {
  return Math.floor(n).toLocaleString();
}

export function SeasonPanel() {
  const season = useGame((s) => s.season);
  const tick = useGame((s) => s.tick);
  const pool = useGame((s) => s.seasonPool);
  const burned = useGame((s) => s.warBurned);
  const score = useGame((s) => s.seasonScore)();
  const endSeason = useGame((s) => s.endSeason);
  const resetGame = useGame((s) => s.resetGame);

  const elapsed = tick - season.startTick;
  const remaining = Math.max(0, season.lengthTicks - elapsed);
  const pct = Math.min(100, (elapsed / season.lengthTicks) * 100);

  return (
    <div className="mx-auto max-w-2xl p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="wl-title" style={{ fontSize: "22px", color: "var(--amber)" }}>Season {season.index}</h2>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{remaining}s remaining (demo: {SEASON_TICKS}s/season)</span>
      </div>
      <p className="mb-4" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        Rewards are redistributed sinks — payouts can never exceed what the season&apos;s sinks collected (GDD §12.2, §14).
      </p>

      <div className="mb-4">
        <ProgressBar value={pct} tone="amber" />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Panel padding="12px">
          <Stat label="Season Reward Pool (sink-funded)" value={`${num(pool)} $HEXAR`} accent="emerald" align="stack" size="lg" />
        </Panel>
        <Panel padding="12px">
          <Stat label="Total $HEXAR Burned (all sinks)" value={`${num(burned)} $HEXAR`} accent="blood" align="stack" size="lg" />
        </Panel>
      </div>

      <Panel title="Your Season Score (GDD §14.4)">
        <ScoreRow label="Economic output (goods sold)" value={score.econ} weight="w₁" />
        <ScoreRow label="Military (raids & sieges won)" value={score.military} weight="w₂" />
        <ScoreRow label="Territory (control × reward mult)" value={score.territory} weight="w₃" />
        <ScoreRow label="Allegiance contribution (CS)" value={score.allegiance} weight="w₄" />
        <div
          className="mt-2 flex items-center justify-between pt-2"
          style={{ borderTop: "1px solid var(--hairline)", fontSize: "14px", fontWeight: 700 }}
        >
          <span>Total Score</span>
          <span className="wl-num" style={{ color: "var(--amber-text)" }}>{num(score.total)}</span>
        </div>
      </Panel>

      {season.lastPayout !== null && (
        <div
          className="mt-4 p-3"
          style={{ borderRadius: "var(--radius-lg)", border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.08)", fontSize: "14px", color: "var(--emerald-text)" }}
        >
          Last season payout: <span style={{ fontWeight: 700 }}>{num(season.lastPayout)} $HEXAR</span> (your reward share of the pool).
        </div>
      )}

      <Button variant="primary" full className="mt-4" onClick={endSeason}>
        End Season Now & Distribute Rewards (demo)
      </Button>
      <p className="mt-2" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
        Share curve is top-heavy (p=1.5) but not winner-take-all, so mid-ranked players still earn (retention).
        Unpaid remainder rolls into next season&apos;s pool. New map opens (hostile camps refresh; you keep plots, stake, account progression).
      </p>

      <div
        className="mt-6 p-3"
        style={{ borderRadius: "var(--radius-lg)", border: "1px solid rgba(220,38,38,0.2)", background: "rgba(156,43,43,0.08)" }}
      >
        <div className="wl-label" style={{ color: "var(--text-secondary)" }}>Danger zone</div>
        <p className="mt-1" style={{ fontSize: "11px", color: "var(--text-muted)" }}>Your progress auto-saves to this browser. Start over from scratch:</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          style={{ color: "var(--blood-text)", borderColor: "rgba(220,38,38,0.4)" }}
          onClick={() => { if (confirm("Wipe your saved game and start a new world?")) resetGame(); }}
        >
          New Game (reset save)
        </Button>
      </div>
    </div>
  );
}

function ScoreRow({ label, value, weight }: { label: string; value: number; weight: string }) {
  return (
    <div className="flex items-center justify-between py-1" style={{ fontSize: "12px" }}>
      <span style={{ color: "var(--text-lo)" }}>
        <span style={{ color: "var(--text-muted)" }}>{weight}</span> {label}
      </span>
      <span className="wl-num" style={{ color: "var(--text-primary)" }}>{num(value)}</span>
    </div>
  );
}
