"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HEXAR_SYMBOL } from "@/web3/solana";
import { siteOrigin, xIntent } from "@/lib/share";
import type { LeaderboardResponse, LeaderboardRow } from "@/app/api/leaderboard/route";

// League name -> CSS-var color (mirrors the trophy-league tones in src/sim/coc/config.ts).
const LEAGUE_COLOR: Record<string, string> = {
  Unranked: "var(--text-lo)",
  Bronze: "var(--amber)",
  Silver: "var(--concrete)",
  Gold: "var(--amber-text)",
  Crystal: "var(--teal)",
  Master: "var(--violet)",
  Champion: "var(--blood-text)",
};

const nf = new Intl.NumberFormat("en-US");

/** Format ticks (≈ seconds at 1 Hz) as a coarse countdown like "3d 04h 12m". */
function fmtCountdown(ticks: number): string {
  const d = Math.floor(ticks / 86400);
  const h = Math.floor((ticks % 86400) / 3600);
  const m = Math.floor((ticks % 3600) / 60);
  const s = Math.floor(ticks % 60);
  if (d > 0) return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export default function AirdropPage() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  // Local ticking clock so the countdown moves between fetches (world runs at ~1 Hz).
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        const json = (await res.json()) as LeaderboardResponse;
        if (alive) {
          setData(json);
          setElapsed(0);
          setFailed(false);
        }
      } catch {
        if (alive) setFailed(true);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    // Refresh the board every 30s; tick the local countdown every second.
    const refresh = setInterval(load, 30_000);
    const clock = setInterval(() => setElapsed((e) => e + 1), 1_000);
    return () => {
      alive = false;
      clearInterval(refresh);
      clearInterval(clock);
    };
  }, []);

  const configured = !!data?.configured;
  const rows = data?.rows ?? [];
  const ticksRemaining = data?.season.ticksRemaining ?? null;
  const countdown = ticksRemaining != null ? Math.max(0, ticksRemaining - elapsed) : null;

  const shareUrl = `${siteOrigin()}/airdrop`;
  const shareIntent = xIntent(
    `Earning my $${HEXAR_SYMBOL} allocation in WARLANDS — season points from real raids, no presale. Climb the board:`,
    shareUrl,
  );

  return (
    <div
      className="wl-grain relative min-h-dvh overflow-hidden bg-[#0a0d12] text-zinc-200"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      {/* atmosphere */}
      <div className="wl-hexgrid pointer-events-none absolute inset-0 opacity-40" />
      <div className="wl-glow pointer-events-none absolute -top-40 left-1/2 h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-[#f5b301]/10 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,#05070b_100%)]" />

      {/* nav */}
      <nav className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="grid h-7 w-7 place-items-center font-black text-black"
            style={{ fontFamily: "var(--font-display)", background: "var(--amber)" }}
          >
            W
          </span>
          <span
            className="text-lg font-bold tracking-[0.2em] text-zinc-100"
            style={{ fontFamily: "var(--font-display)" }}
          >
            WARLANDS
          </span>
        </Link>
        <Link
          href="/world"
          className="border border-amber-500/60 bg-amber-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-amber-300 transition hover:bg-amber-500 hover:text-black"
        >
          Enter War Room →
        </Link>
      </nav>

      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-8">
        {/* header */}
        <div
          className="inline-flex items-center gap-2 border border-zinc-700/70 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-zinc-400"
        >
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Season airdrop · live standings
        </div>

        <h1
          className="mt-5 text-4xl font-bold leading-[0.95] tracking-tight text-zinc-50 sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          SEASON AIRDROP
          <span className="block text-amber-400">${HEXAR_SYMBOL} ALLOCATION</span>
        </h1>

        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Season points convert to a future <span className="text-amber-300">${HEXAR_SYMBOL}</span>{" "}
          allocation. They are earned only by <span className="text-zinc-200">real play</span> — winning
          raids and completing objectives. Bots and free-try accounts earn nothing here; only full
          commanders place on the board. Your projected share is your points over the total points
          earned this season.
        </p>

        {/* season readout */}
        <div
          className="mt-9 grid grid-cols-2 gap-px border sm:grid-cols-4"
          style={{ background: "var(--hairline)", borderColor: "var(--hairline)", fontFamily: "var(--font-mono)" }}
        >
          <Stat label="Season" value={data?.season.id != null ? `#${data.season.id}` : "—"} />
          <Stat
            label="Ends in"
            value={countdown != null ? fmtCountdown(countdown) : "—"}
            accent
          />
          <Stat label="Commanders" value={configured ? nf.format(data?.playerCount ?? 0) : "—"} />
          <Stat label="Total points" value={configured ? nf.format(data?.totalPoints ?? 0) : "—"} />
        </div>

        {/* actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/world"
            className="bg-amber-500 px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-amber-400"
          >
            Enter War Room →
          </Link>
          <a
            href={shareIntent}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-zinc-700 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            Share on X ↗
          </a>
        </div>

        {/* board */}
        <section className="mt-10">
          <div className="flex items-center gap-4">
            <h2
              className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Top Commanders
            </h2>
            <span className="h-px flex-1 bg-zinc-800" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-600" style={{ fontFamily: "var(--font-mono)" }}>
              by season points
            </span>
          </div>

          {loading ? (
            <EmptyState>Loading standings…</EmptyState>
          ) : !configured ? (
            <EmptyState>
              Leaderboard opens when the season is live. Check back once the war room is running.
            </EmptyState>
          ) : failed ? (
            <EmptyState>Standings are temporarily unavailable. Try again shortly.</EmptyState>
          ) : rows.length === 0 ? (
            <EmptyState>
              No points scored yet this season. Win a raid or clear an objective to take the lead.
            </EmptyState>
          ) : (
            <LeaderboardTable rows={rows} />
          )}
        </section>

        {/* explainer footer */}
        <p className="mt-10 max-w-2xl text-xs leading-relaxed text-zinc-500" style={{ fontFamily: "var(--font-mono)" }}>
          Projected allocation % is indicative and recalculates as the season runs. ${HEXAR_SYMBOL} is a
          sink-funded token — rewards are only ever paid from what the in-game economy collected.
          Commander ids shown are shortened; wallets are never exposed here.
        </p>
      </main>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="px-4 py-3" style={{ background: "var(--panel-void)" }}>
      <div className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</div>
      <div className={`mt-1 text-lg font-bold ${accent ? "text-amber-300" : "text-zinc-100"}`}>{value}</div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-6 border border-dashed px-6 py-14 text-center text-sm text-zinc-500"
      style={{ borderColor: "var(--hairline)", background: "var(--panel-void)" }}
    >
      {children}
    </div>
  );
}

function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div
      className="mt-6 overflow-x-auto border"
      style={{ borderColor: "var(--hairline)", background: "var(--surface-card)" }}
    >
      <table className="w-full border-collapse text-sm" style={{ fontFamily: "var(--font-mono)" }}>
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-zinc-500" style={{ borderBottom: "1px solid var(--hairline)" }}>
            <th className="px-4 py-3 text-left font-medium">#</th>
            <th className="px-4 py-3 text-left font-medium">Commander</th>
            <th className="px-4 py-3 text-left font-medium">League</th>
            <th className="px-4 py-3 text-right font-medium">Points</th>
            <th className="px-4 py-3 text-right font-medium">Alloc %</th>
            <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Refs</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const color = LEAGUE_COLOR[r.league] ?? "var(--text-lo)";
            const top3 = r.rank <= 3;
            return (
              <tr
                key={`${r.rank}-${r.id}`}
                className="transition-colors hover:bg-white/[0.02]"
                style={{ borderBottom: "1px solid var(--hairline)" }}
              >
                <td className="px-4 py-3 text-left">
                  <span
                    className={`inline-grid h-6 w-6 place-items-center text-xs font-bold ${top3 ? "text-black" : "text-zinc-400"}`}
                    style={top3 ? { background: "var(--amber)" } : undefined}
                  >
                    {r.rank}
                  </span>
                </td>
                <td className="px-4 py-3 text-left text-zinc-200">
                  <span className="text-zinc-600">cmdr-</span>
                  {r.id}
                </td>
                <td className="px-4 py-3 text-left">
                  <span
                    className="inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] uppercase tracking-wide"
                    style={{ borderColor: color, color }}
                  >
                    <span className="inline-block h-1.5 w-1.5" style={{ background: color }} />
                    {r.league}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-amber-300">{nf.format(r.points)}</td>
                <td className="px-4 py-3 text-right text-zinc-300">{(r.share * 100).toFixed(2)}%</td>
                <td className="hidden px-4 py-3 text-right text-zinc-400 sm:table-cell">{r.refsConverted}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
