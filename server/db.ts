import pg from "pg";
import type { WorldState } from "@/sim/types";

const url = process.env.DATABASE_URL;

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

export async function loadLatest(): Promise<WorldState | null> {
  if (!pool) return null;
  const { rows } = await pool.query("SELECT state FROM world_snapshots ORDER BY id DESC LIMIT 1");
  return rows[0]?.state ?? null;
}

export async function saveSnapshot(state: WorldState): Promise<void> {
  if (!pool) return;
  await pool.query("INSERT INTO world_snapshots (tick, state) VALUES ($1, $2)", [state.tick, state]);
}
