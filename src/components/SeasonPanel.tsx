"use client";

import { useGame } from "@/game/store";
import { SEASON_TICKS } from "@/game/store";

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
        <h2 className="text-xl font-bold text-amber-400">Season {season.index}</h2>
        <span className="text-xs text-zinc-500">{remaining}s remaining (demo: {SEASON_TICKS}s/season)</span>
      </div>
      <p className="mb-4 text-xs text-zinc-500">
        Rewards are redistributed sinks — payouts can never exceed what the season&apos;s sinks collected (GDD §12.2, §14).
      </p>

      <div className="mb-4 h-2 w-full overflow-hidden rounded bg-zinc-800">
        <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Stat label="Season Reward Pool (sink-funded)" value={`${num(pool)} $WAR`} accent="text-emerald-400" />
        <Stat label="Total $WAR Burned (all sinks)" value={`${num(burned)} $WAR`} accent="text-red-400" />
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-200">Your Season Score (GDD §14.4)</h3>
        <ScoreRow label="Economic output (goods sold)" value={score.econ} weight="w₁" />
        <ScoreRow label="Military (raids & sieges won)" value={score.military} weight="w₂" />
        <ScoreRow label="Territory (control × reward mult)" value={score.territory} weight="w₃" />
        <ScoreRow label="Allegiance contribution (CS)" value={score.allegiance} weight="w₄" />
        <div className="mt-2 flex items-center justify-between border-t border-zinc-800 pt-2 text-sm font-bold">
          <span>Total Score</span>
          <span className="font-mono text-amber-300">{num(score.total)}</span>
        </div>
      </div>

      {season.lastPayout !== null && (
        <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-sm text-emerald-300">
          Last season payout: <span className="font-bold">{num(season.lastPayout)} $WAR</span> (your reward share of the pool).
        </div>
      )}

      <button
        onClick={endSeason}
        className="mt-4 w-full rounded bg-amber-500 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-400"
      >
        End Season Now & Distribute Rewards (demo)
      </button>
      <p className="mt-2 text-[11px] text-zinc-600">
        Share curve is top-heavy (p=1.5) but not winner-take-all, so mid-ranked players still earn (retention).
        Unpaid remainder rolls into next season&apos;s pool. New map opens (hostile camps refresh; you keep plots, stake, account progression).
      </p>

      <div className="mt-6 rounded-lg border border-red-500/20 bg-red-950/10 p-3">
        <div className="text-xs font-semibold text-zinc-300">Danger zone</div>
        <p className="mt-1 text-[11px] text-zinc-500">Your progress auto-saves to this browser. Start over from scratch:</p>
        <button
          onClick={() => { if (confirm("Wipe your saved game and start a new world?")) resetGame(); }}
          className="mt-2 rounded border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10"
        >
          New Game (reset save)
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-1 font-mono text-lg font-bold ${accent}`}>{value}</div>
    </div>
  );
}

function ScoreRow({ label, value, weight }: { label: string; value: number; weight: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-xs">
      <span className="text-zinc-400">
        <span className="text-zinc-600">{weight}</span> {label}
      </span>
      <span className="font-mono text-zinc-200">{num(value)}</span>
    </div>
  );
}
