import pg from "pg";
import type { CocWorld } from "@/sim/coc/types";

const url = process.env.DATABASE_URL;

/** True when a Postgres URL is configured — i.e. the operator intends durable persistence. */
export const DB_CONFIGURED = !!url;

// Keep only the most recent N world snapshots — `loadLatest` only ever reads the newest,
// so older rows are dead weight. Bounds unbounded table growth on a long-lived server.
const SNAPSHOT_KEEP = Math.max(1, Number(process.env.SNAPSHOT_KEEP ?? 200));

/** Retry a transient DB op a few times with linear backoff before giving up. */
async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts) await new Promise((r) => setTimeout(r, 150 * i));
    }
  }
  throw new Error(`${label} failed after ${attempts} attempts: ${(lastErr as Error)?.message ?? lastErr}`);
}

// Internal/local Postgres speaks plaintext; public/proxied endpoints need (lax) SSL.
function sslFor(u: string): false | { rejectUnauthorized: boolean } {
  if (u.includes("railway.internal") || u.includes("localhost") || u.includes("127.0.0.1")) return false;
  return { rejectUnauthorized: false };
}

const pool = url ? new pg.Pool({ connectionString: url, ssl: sslFor(url) }) : null;

export async function initDb(): Promise<void> {
  if (!pool) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS world_snapshots (
    id SERIAL PRIMARY KEY,
    tick INTEGER NOT NULL,
    state JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    type TEXT NOT NULL,
    player TEXT,
    meta JSONB
  )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS events_type_ts ON events (type, ts DESC)`);
}

/** Fire-and-forget telemetry: record a gameplay/ops event (no-op without a DB). */
export function logEvent(type: string, player?: string | null, meta?: unknown): void {
  if (!pool) return;
  pool.query("INSERT INTO events (type, player, meta) VALUES ($1, $2, $3)", [type, player ?? null, meta == null ? null : JSON.stringify(meta)]).catch(() => {});
}

/**
 * Telegram opt-in lookup (Feature 5): return the chat id a player linked via the bot's
 * `/start <token>` deep-link, or null if they haven't opted in. The webhook (Next app,
 * src/app/api/tg/route.ts) writes the `tg_links` table; we only read it here. Best-effort:
 * resolves null on any error or without a DB so binding never blocks/throws into the WS server.
 */
export async function getTgChatId(token: string): Promise<string | null> {
  if (!pool) return null;
  try {
    const { rows } = await pool.query("SELECT chat_id FROM tg_links WHERE token = $1 LIMIT 1", [token]);
    return rows[0]?.chat_id ?? null;
  } catch {
    return null; // table may not exist yet (no one has opted in) — treat as "not linked"
  }
}

export async function loadLatest(): Promise<CocWorld | null> {
  if (!pool) return null;
  const { rows } = await pool.query("SELECT state FROM world_snapshots ORDER BY id DESC LIMIT 1");
  return rows[0]?.state ?? null;
}

export async function saveSnapshot(state: CocWorld): Promise<void> {
  if (!pool) return;
  // Retry the write — a dropped connection or brief DB hiccup must not silently lose the world.
  // Throws on exhausted retries so the caller can log/alert (don't swallow data-loss).
  await withRetry("saveSnapshot", () =>
    pool.query("INSERT INTO world_snapshots (tick, state) VALUES ($1, $2)", [state.tick, state])
  );
  // Prune everything older than the last SNAPSHOT_KEEP rows (best-effort — never block the snapshot).
  await pool
    .query("DELETE FROM world_snapshots WHERE id <= (SELECT MAX(id) FROM world_snapshots) - $1", [SNAPSHOT_KEEP])
    .catch((e) => console.error(`[snapshot_prune] ${(e as Error).message}`));
}
