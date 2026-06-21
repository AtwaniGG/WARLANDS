#!/usr/bin/env node
/**
 * WARLANDS — build a $HEXAR reward Merkle distribution from a game snapshot.
 *
 * Commits each player's lifetime CLAIMED entitlement (capped) to a Merkle tree. The published
 * `root` is a tamper-evident commitment that payout-war.mjs verifies before paying, and that a
 * future on-chain distributor can verify the same proofs against.
 *
 * RUN FROM A NO-SPACE PATH. Copy this together with merkle.mjs.
 *   npm i pg @noble/hashes bs58
 *   DATABASE_URL=... node build-merkle.mjs            # from the latest DB snapshot
 *   node build-merkle.mjs --file snapshot.json        # from a file
 *   OUT=dist.json node build-merkle.mjs               # custom output path
 *
 * Env: HEXAR_DECIMALS (default 9) · CLAIM_CAP (default 50000, keep == HEXAR_CLAIM_CAP) · OUT.
 */
import fs from "node:fs";
import { buildDistribution } from "./merkle.mjs";

const DECIMALS = Number(process.env.HEXAR_DECIMALS ?? 6); // $HEXAR is Token-2022, 6 decimals (pump.fun)
const CLAIM_CAP = Number(process.env.CLAIM_CAP ?? 50_000);
const OUT = process.env.OUT || "merkle-distribution.json";
const fileArg = process.argv[process.argv.indexOf("--file") + 1];
const die = (m) => { console.error(`✗ ${m}`); process.exit(1); };
const isWallet = (s) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s ?? "");

async function loadState() {
  if (process.argv.includes("--file")) {
    if (!fileArg) die("--file needs a path.");
    return JSON.parse(fs.readFileSync(fileArg, "utf8"));
  }
  const url = process.env.DATABASE_URL;
  if (!url) die("Set DATABASE_URL or pass --file <snapshot.json>.");
  const { default: pg } = await import("pg");
  const ssl = url.includes("railway.internal") || url.includes("localhost") ? false : { rejectUnauthorized: false };
  const pool = new pg.Pool({ connectionString: url, ssl });
  try {
    const { rows } = await pool.query("SELECT state FROM world_snapshots ORDER BY id DESC LIMIT 1");
    if (!rows[0]) die("No snapshot found.");
    return rows[0].state;
  } finally { await pool.end(); }
}

const main = async () => {
  const state = await loadState();
  const scale = 10n ** BigInt(DECIMALS);
  const entries = [];
  for (const p of Object.values(state.players ?? {})) {
    if (!p || p.isBot || !isWallet(p.wallet)) continue;
    const whole = Math.min(Math.floor(p.claimed ?? 0), CLAIM_CAP); // lifetime entitlement, capped
    if (whole <= 0) continue;
    entries.push({ wallet: p.wallet, amount: BigInt(whole) * scale });
  }
  if (entries.length === 0) die("No eligible claims (need a linked wallet + claimed > 0).");
  // Deterministic order ⇒ reproducible root from the same snapshot.
  entries.sort((a, b) => (a.wallet < b.wallet ? -1 : a.wallet > b.wallet ? 1 : 0));

  const dist = buildDistribution(entries);
  const totalBaseUnits = entries.reduce((s, e) => s + e.amount, 0n);
  const out = {
    generatedTick: state.tick ?? null,
    decimals: DECIMALS,
    claimCap: CLAIM_CAP,
    root: dist.root,
    count: dist.count,
    totalBaseUnits: totalBaseUnits.toString(),
    leaves: dist.leaves, // [{ wallet, amount(base units), leaf, proof[] }]
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`root ${dist.root}`);
  console.log(`${dist.count} claim(s), ${Number(totalBaseUnits / scale).toLocaleString()} $HEXAR committed → ${OUT}`);
  console.log("Publish this root (and later post it to the on-chain distributor); pass --merkle " + OUT + " to payout-war.mjs.");
};

main().catch((e) => { console.error(e); process.exit(1); });
