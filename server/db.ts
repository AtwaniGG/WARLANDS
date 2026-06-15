import pg from "pg";
import type { WorldState } from "@/sim/types";

const url = process.env.DATABASE_URL;
const pool = url ? new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } }) : null;

export async function initDb(): Promise<void> {
  if (!pool) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS world_snapshots (
    id SERIAL PRIMARY KEY,
    tick INTEGER NOT NULL,
    state JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
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
