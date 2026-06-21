#!/usr/bin/env node
/**
 * WARLANDS — prepare / inspect the world database. Idempotent and NON-DESTRUCTIVE by default.
 *
 * Run where DATABASE_URL resolves — inside Railway (the internal host only resolves there), or
 * locally with the public proxy URL:
 *   DATABASE_URL=... node scripts/db-prep.mjs                       # ensure schema + health report
 *   DATABASE_URL=... CONFIRM_FRESH=1 node scripts/db-prep.mjs --fresh   # clean slate for launch (DESTRUCTIVE)
 *
 * Needs pg (in root + server node_modules). The live server's initDb() also creates these tables on
 * boot, so a normal deploy makes the DB "ready" automatically — this is for explicit prep/inspection.
 */
import { argv, env, exit } from "node:process";

const die = (m) => { console.error(`✗ ${m}`); exit(1); };
const url = env.DATABASE_URL;
if (!url) die("Set DATABASE_URL (run inside Railway, or use the public proxy URL).");

let pg;
try { ({ default: pg } = await import("pg")); } catch { die("pg not installed — run `npm i pg` (or run from the server/ dir)."); }

const ssl = url.includes("railway.internal") || url.includes("localhost") || url.includes("127.0.0.1") ? false : { rejectUnauthorized: false };
const pool = new pg.Pool({ connectionString: url, ssl });

try {
  await pool.query("SELECT 1"); // connectivity
  console.log("✓ connected");

  // ensure schema — byte-for-byte the same DDL as server/db.ts (idempotent)
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
  console.log("✓ schema ensured (world_snapshots, events)");

  // optional clean slate for a fresh launch (guarded)
  if (argv.includes("--fresh")) {
    if (env.CONFIRM_FRESH !== "1") die("--fresh is destructive — set CONFIRM_FRESH=1 to wipe world_snapshots.");
    await pool.query("TRUNCATE world_snapshots");
    console.log("⚠️  world_snapshots TRUNCATED — the server will boot a fresh world.");
  }

  // health report
  const snaps = (await pool.query("SELECT count(*)::int n FROM world_snapshots")).rows[0].n;
  const evs = (await pool.query("SELECT count(*)::int n FROM events")).rows[0].n;
  const latest = (await pool.query("SELECT tick, state, created_at FROM world_snapshots ORDER BY id DESC LIMIT 1")).rows[0];
  console.log(`snapshots=${snaps}  events=${evs}`);
  if (latest) {
    const s = latest.state;
    const players = s?.players ? Object.keys(s.players).length : 0;
    const bases = s?.bases ? Object.keys(s.bases).length : 0;
    const sane = s && typeof s === "object" && Number.isFinite(s.tick) && s.players && s.bases && Number.isFinite(s.seasonPool);
    console.log(`latest snapshot: tick=${latest.tick} players=${players} bases=${bases} sane=${sane ? "yes" : "NO"} (${latest.created_at})`);
    if (!sane) console.error("  ! latest snapshot is structurally invalid — the hardened server would refuse to boot against it (intended: no silent wipe).");
  } else {
    console.log("no snapshot yet — server will boot a fresh world (expected pre-launch).");
  }
  console.log("\nDB ready ✅");
} catch (e) {
  die(`db-prep failed: ${e.message}`);
} finally {
  await pool.end().catch(() => {});
}
