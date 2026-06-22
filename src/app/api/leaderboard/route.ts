import { NextResponse } from "next/server";
import pg from "pg";
import { leagueFor, SEASON_LENGTH } from "@/sim/coc/config";
import type { CocWorld } from "@/sim/coc/types";

// This route reads the LIVE world snapshot from Postgres on every request, so it must never be
// cached/prerendered. Cache Components is NOT enabled in next.config (so these segment-config
// exports are valid in Next 16); GET handlers already default to dynamic, but we make it explicit.
export const dynamic = "force-dynamic";
export const revalidate = 0;
// We talk to Postgres via the `pg` driver, which needs the Node.js runtime (not Edge).
export const runtime = "nodejs";

/** Top-N players surfaced on the public board. */
const TOP_N = 100;

const DATABASE_URL = process.env.DATABASE_URL;
/** True when a Postgres URL is configured — i.e. the operator intends durable persistence. */
const DB_CONFIGURED = !!DATABASE_URL;

/** One row of the public airdrop/season leaderboard. */
export interface LeaderboardRow {
  /** rank, 1-based, by points desc */
  rank: number;
  /** shortened commander id (~6 chars) — NEVER the full id or wallet */
  id: string;
  points: number;
  trophies: number;
  /** league name from leagueFor(trophies) */
  league: string;
  /** how many of this player's referees have converted */
  refsConverted: number;
  /** projected allocation share of the season pool: points / totalPoints (0..1) */
  share: number;
}

/** Shape returned by GET /api/leaderboard. */
export interface LeaderboardResponse {
  /** false when no DATABASE_URL is set — the board renders an empty/coming-soon state */
  configured: boolean;
  season: {
    id: number | null;
    /** ticks (≈ seconds at 1 Hz) remaining until the season rolls over; null if unknown */
    ticksRemaining: number | null;
  };
  /** number of full (non-bot, non-demo) players counted toward the airdrop */
  playerCount: number;
  /** sum of points across all counted players — the denominator for `share` */
  totalPoints: number;
  rows: LeaderboardRow[];
}

/** Internal/local Postgres speaks plaintext; public/proxied endpoints need (lax) SSL. */
function sslFor(u: string): false | { rejectUnauthorized: boolean } {
  if (u.includes("railway.internal") || u.includes("localhost") || u.includes("127.0.0.1")) return false;
  return { rejectUnauthorized: false };
}

/**
 * Read the latest whole-world JSON snapshot from Postgres — mirrors scripts/build-merkle.mjs and
 * server/db.ts#loadLatest:
 *   SELECT state FROM world_snapshots ORDER BY id DESC LIMIT 1
 * Returns null when no DB is configured or no snapshot exists. We open a tiny throwaway pool and
 * always close it (we can't reuse the WS server's pool — that runtime is intentionally not imported).
 */
async function loadLatestWorld(): Promise<CocWorld | null> {
  if (!DATABASE_URL) return null;
  const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: sslFor(DATABASE_URL), max: 1 });
  try {
    const { rows } = await pool.query("SELECT state FROM world_snapshots ORDER BY id DESC LIMIT 1");
    return (rows[0]?.state as CocWorld | undefined) ?? null;
  } finally {
    await pool.end();
  }
}

/** Shorten a commander id to ~6 chars so we never leak full ids/wallets. */
function shortId(id: string): string {
  const s = id.replace(/^0x/i, "");
  return s.length <= 6 ? s : s.slice(0, 6);
}

function emptyResponse(configured: boolean): LeaderboardResponse {
  return {
    configured,
    season: { id: null, ticksRemaining: null },
    playerCount: 0,
    totalPoints: 0,
    rows: [],
  };
}

function buildLeaderboard(world: CocWorld): LeaderboardResponse {
  const players = Object.values(world.players ?? {});
  // Airdrop basis: real play only. Exclude bots and free-try DEMO accounts.
  const eligible = players.filter((p) => p && !p.isBot && !p.demo);

  const totalPoints = eligible.reduce((sum, p) => sum + Math.max(0, p.points ?? 0), 0);

  const ranked = eligible
    .slice()
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    .slice(0, TOP_N);

  const rows: LeaderboardRow[] = ranked.map((p, i) => {
    const points = Math.max(0, p.points ?? 0);
    const trophies = world.bases?.[p.id]?.trophies ?? 0;
    return {
      rank: i + 1,
      id: shortId(p.id),
      points,
      trophies,
      league: leagueFor(trophies).name,
      refsConverted: p.referralsConverted ?? 0,
      // Guard divide-by-zero: when nobody has points yet, every share is 0.
      share: totalPoints > 0 ? points / totalPoints : 0,
    };
  });

  // endsAtTick is absolute; remaining = endsAtTick - current tick (clamped at 0). Fall back to the
  // full season length when the season block is absent (older/empty snapshots).
  const season = world.season ?? null;
  const ticksRemaining = season
    ? Math.max(0, season.endsAtTick - (world.tick ?? 0))
    : SEASON_LENGTH;

  return {
    configured: true,
    season: { id: season?.id ?? null, ticksRemaining },
    playerCount: eligible.length,
    totalPoints,
    rows,
  };
}

// GET /api/leaderboard — public, read-only season-points / airdrop-allocation board.
export async function GET() {
  if (!DB_CONFIGURED) {
    // No DB wired: return an empty board with configured:false rather than erroring.
    return NextResponse.json(emptyResponse(false));
  }
  try {
    const world = await loadLatestWorld();
    if (!world) return NextResponse.json(emptyResponse(true));
    return NextResponse.json(buildLeaderboard(world));
  } catch {
    // DB configured but unreachable, or a malformed snapshot — never surface a 500 to the public.
    return NextResponse.json(emptyResponse(true));
  }
}
