#!/usr/bin/env node
/**
 * WARLANDS — telemetry summary. Reads the `events` table the server writes.
 *   npm i pg   (or run from ~/warlands-payout which already has it)
 *   DATABASE_URL="<railway Postgres public url>" node stats.mjs
 */
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) { console.error("Set DATABASE_URL"); process.exit(1); }
const ssl = url.includes("railway.internal") || url.includes("localhost") ? false : { rejectUnauthorized: false };
const pool = new pg.Pool({ connectionString: url, ssl });
const q = (sql, p = []) => pool.query(sql, p).then((r) => r.rows);

const main = async () => {
  const totals = await q("SELECT type, count(*)::int n FROM events GROUP BY type ORDER BY n DESC");
  const dau = await q("SELECT count(distinct player)::int n FROM events WHERE ts > now() - interval '24 hours' AND player IS NOT NULL");
  const joins = await q("SELECT count(*)::int n FROM events WHERE type='join' AND ts > now() - interval '24 hours'");
  const raids = await q("SELECT count(*)::int n, coalesce(sum((meta->>'stars')::int),0)::int stars FROM events WHERE type='raid' AND ts > now() - interval '24 hours'");
  const claims = await q("SELECT count(*)::int n, coalesce(sum((meta->>'amount')::numeric),0)::bigint amt FROM events WHERE type='war_claim'");
  const errs = await q("SELECT ts, player, meta->>'message' msg FROM events WHERE type='client_error' ORDER BY ts DESC LIMIT 10");

  console.log("══ WARLANDS telemetry ══");
  console.log("event totals (all time):");
  for (const r of totals) console.log(`  ${String(r.type).padEnd(14)} ${r.n}`);
  console.log(`\nlast 24h:  active players ${dau[0]?.n ?? 0} · joins ${joins[0]?.n ?? 0} · raids ${raids[0]?.n ?? 0} (${raids[0]?.stars ?? 0}★)`);
  console.log(`$WAR claims (all time): ${claims[0]?.n ?? 0} totaling ${claims[0]?.amt ?? 0} $WAR`);
  console.log("\nrecent client errors:");
  if (!errs.length) console.log("  none 🎉");
  else for (const e of errs) console.log(`  ${new Date(e.ts).toISOString()}  ${String(e.player ?? "?").slice(0, 8)}  ${e.msg}`);
  await pool.end();
};
main().catch((e) => { console.error(e); process.exit(1); });
