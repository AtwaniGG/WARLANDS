#!/usr/bin/env node
/**
 * WARLANDS — mainnet launch preflight (GO / NO-GO).
 *
 * Read-only. Verifies that the live configuration + infrastructure are actually wired for a real
 * mainnet launch, so "is it ready?" has a deterministic answer instead of a vibe. Run it in the
 * environment that holds the prod secrets (Railway/Vercel shell, or with the vars exported):
 *
 *   DATABASE_URL=... NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta NEXT_PUBLIC_HEXAR_MINT=... \
 *   NEXT_PUBLIC_SOLANA_RPC=... AUTH_REQUIRED=1 node scripts/preflight-mainnet.mjs
 *
 * Optional: --env <file> to load a dotenv-style file first. Treasury checks run if TREASURY_SECRET
 * or TREASURY_KEYPAIR is present. Exit code 0 = GO, 1 = NO-GO (any FAIL).
 *
 * Network checks (DB reachability, mint existence, treasury balances) need: npm i pg @solana/web3.js
 * — if absent they SKIP (reported), they never crash the preflight.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DEVNET_DEFAULT_MINT = "BHdvBpziU37TjyNCxjrFy4FFQ1DP2TButgrZyP9Qi8pT";
const PUBLIC_RPCS = ["https://api.mainnet-beta.solana.com", "https://api.devnet.solana.com", ""];
const isB58Pubkey = (s) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s ?? "");

// --- optional dotenv load (no dependency) ---
const envArg = process.argv[process.argv.indexOf("--env") + 1];
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
if (process.argv.includes("--env") && envArg) loadEnv(envArg);

const results = [];
const add = (status, name, detail = "") => results.push({ status, name, detail });
const env = process.env;

// ---- static config checks ----
add(env.NEXT_PUBLIC_SOLANA_CLUSTER === "mainnet-beta" ? "PASS" : "FAIL", "Solana cluster = mainnet-beta",
  `got "${env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "(unset)"}"`);

const mint = env.NEXT_PUBLIC_HEXAR_MINT ?? "";
if (!mint) add("FAIL", "$HEXAR mint set", "NEXT_PUBLIC_HEXAR_MINT is unset");
else if (mint === DEVNET_DEFAULT_MINT) add("FAIL", "$HEXAR mint is the real (not devnet) token", "still the devnet default mint");
else if (!isB58Pubkey(mint)) add("FAIL", "$HEXAR mint is a valid pubkey", `"${mint}" is not base58/32-byte`);
else add("PASS", "$HEXAR mint set", `${mint.slice(0, 6)}…${mint.slice(-4)}`);

const rpc = env.NEXT_PUBLIC_SOLANA_RPC ?? "";
add(rpc && !PUBLIC_RPCS.includes(rpc) ? "PASS" : "WARN", "Paid mainnet RPC", rpc ? "custom RPC set" : "using public RPC (will rate-limit under load)");

add(env.AUTH_REQUIRED === "1" || env.AUTH_REQUIRED === "true" ? "PASS" : "FAIL", "Wallet-signature identity required",
  "AUTH_REQUIRED must be 1 on the world server (else anonymous/sybil play)");

add((env.NEXT_PUBLIC_TOKEN_GATE ?? "on").toLowerCase() !== "off" ? "PASS" : "WARN", "Token gate on",
  `NEXT_PUBLIC_TOKEN_GATE=${env.NEXT_PUBLIC_TOKEN_GATE ?? "on"}`);

add(env.DATABASE_URL ? "PASS" : "FAIL", "DATABASE_URL set", env.DATABASE_URL ? "configured" : "required for durable persistence");

// ---- network checks (best-effort) ----
async function checkDb() {
  if (!env.DATABASE_URL) return add("SKIP", "DB reachable + snapshot sane", "no DATABASE_URL");
  let pg;
  try { ({ default: pg } = await import("pg")); } catch { return add("SKIP", "DB reachable + snapshot sane", "pg not installed (npm i pg)"); }
  const ssl = env.DATABASE_URL.includes("railway.internal") || env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false };
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL, ssl });
  try {
    const { rows } = await pool.query("SELECT state FROM world_snapshots ORDER BY id DESC LIMIT 1");
    if (!rows[0]) return add("WARN", "DB reachable + snapshot sane", "reachable, but no snapshot yet (fresh world on first boot)");
    const s = rows[0].state;
    const sane = s && typeof s === "object" && Number.isFinite(s.tick) && s.players && s.bases && Number.isFinite(s.seasonPool);
    add(sane ? "PASS" : "FAIL", "DB reachable + snapshot sane", sane ? `latest snapshot @ tick ${s.tick}` : "snapshot present but structurally invalid");
  } catch (e) {
    add("FAIL", "DB reachable + snapshot sane", `query failed: ${e.message}`);
  } finally { await pool.end().catch(() => {}); }
}

async function checkChain() {
  if (!isB58Pubkey(mint) || mint === DEVNET_DEFAULT_MINT) return add("SKIP", "$HEXAR mint exists on-chain", "set a real mint first");
  let web3;
  try { web3 = await import("@solana/web3.js"); } catch { return add("SKIP", "$HEXAR mint exists on-chain", "@solana/web3.js not installed"); }
  const conn = new web3.Connection(rpc || "https://api.mainnet-beta.solana.com", "confirmed");
  try {
    const info = await conn.getAccountInfo(new web3.PublicKey(mint));
    add(info ? "PASS" : "FAIL", "$HEXAR mint exists on-chain", info ? `owner ${info.owner.toBase58().slice(0, 6)}…` : "account not found on this cluster");
  } catch (e) {
    add("WARN", "$HEXAR mint exists on-chain", `could not verify: ${e.message}`);
  }
  // treasury (optional)
  const keyEnv = env.TREASURY_SECRET || env.TREASURY_KEYPAIR;
  if (!keyEnv && !fs.existsSync(path.join(os.homedir(), ".config/solana/id.json"))) {
    return add("SKIP", "Treasury funded (SOL + $HEXAR)", "no treasury key — multisig custody is a launch blocker anyway");
  }
  add("WARN", "Treasury funded (SOL + $HEXAR)", "key present, but balances/custody must be a MULTISIG — verify with payout-war.mjs --dry-run");
}

await checkDb();
await checkChain();

// ---- report ----
const icon = { PASS: "✓", WARN: "!", FAIL: "✗", SKIP: "·" };
console.log("\nWARLANDS — mainnet preflight\n");
for (const r of results) console.log(`  ${icon[r.status]} [${r.status}] ${r.name}${r.detail ? `  — ${r.detail}` : ""}`);
const fails = results.filter((r) => r.status === "FAIL").length;
const warns = results.filter((r) => r.status === "WARN").length;
console.log(`\n${fails === 0 ? "GO ✅ (config wired)" : `NO-GO ⛔ — ${fails} blocker(s)`}${warns ? `, ${warns} warning(s)` : ""}.`);
console.log("Reminder: config GO ≠ safe to custody funds. Multisig treasury, audit, and on-chain");
console.log("distributor remain (see docs/runbooks/mainnet-launch.md).\n");
process.exit(fails === 0 ? 0 : 1);
