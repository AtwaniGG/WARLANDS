#!/usr/bin/env node
/**
 * WARLANDS — on-chain $HEXAR payout (treasury-side settlement). Hardened for production.
 *
 * Reads the latest game snapshot, finds players who have CLAIMED $HEXAR (players[*].claimed) and
 * LINKED a wallet (players[*].wallet), and transfers the still-owed amount to them on Solana from
 * the treasury. A durable, atomic ledger (with tx signatures) prevents double-paying.
 *
 * RUN FROM A NO-SPACE PATH (the repo path has spaces, which breaks the Solana toolchain). Copy this
 * file somewhere like ~/warlands-payout/ and run it there.
 *
 *   npm i pg @solana/web3.js @solana/spl-token
 *   DATABASE_URL=... node payout-war.mjs --dry-run     # preview (no transfers, runs preflight)
 *   DATABASE_URL=... node payout-war.mjs               # execute
 *
 * Flags: --dry-run (no transfers) · --file <snapshot.json> (instead of DATABASE_URL)
 *
 * Env (key custody — prefer a secret manager over a disk file):
 *   TREASURY_SECRET   JSON array secret key, e.g. "[12,34,...]" (same bytes as a Solana id.json).
 *                     Use this in cron/serverless; the key never touches disk. Takes precedence.
 *   TREASURY_KEYPAIR  path to a keypair file (default ~/.config/solana/id.json).
 * Env (network / state):
 *   SOLANA_RPC        RPC endpoint (default devnet public — use a PAID RPC in prod). LEDGER path.
 *   DATABASE_URL      postgres snapshot source (or pass --file).
 * Env (safety limits — all optional):
 *   CLAIM_CAP         per-wallet lifetime ceiling (default 50000 — KEEP IN SYNC with HEXAR_CLAIM_CAP).
 *   MAX_PER_WALLET    max paid to one wallet this run (default = CLAIM_CAP).
 *   MAX_PER_RUN       max total paid across all wallets this run (default Infinity).
 *   MIN_PAYOUT        skip dust below this many $HEXAR (default 1).
 *   MIN_TREASURY_SOL  abort if the treasury holds less SOL than this (default 0.05).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Mint is env-driven so mainnet launch = paste your mint. No default → forces an explicit choice.
const HEXAR_MINT = process.env.HEXAR_MINT || process.env.NEXT_PUBLIC_HEXAR_MINT || "";
const DECIMALS = Number(process.env.HEXAR_DECIMALS ?? 9);
const RPC = process.env.SOLANA_RPC || "https://api.devnet.solana.com";
const LEDGER = process.env.LEDGER || "./payout-ledger.json";

// Safety limits (defense-in-depth; the in-game claim() already caps, this bounds blast radius too).
const CLAIM_CAP = Number(process.env.CLAIM_CAP ?? 50_000);          // == HEXAR_CLAIM_CAP in src/sim/coc/config.ts
const MAX_PER_WALLET = Number(process.env.MAX_PER_WALLET ?? CLAIM_CAP);
const MAX_PER_RUN = Number(process.env.MAX_PER_RUN ?? Infinity);
const MIN_PAYOUT = Number(process.env.MIN_PAYOUT ?? 1);
const MIN_TREASURY_SOL = Number(process.env.MIN_TREASURY_SOL ?? 0.05);

const DRY = process.argv.includes("--dry-run");
const fileArg = process.argv[process.argv.indexOf("--file") + 1];

function die(msg) { console.error(`✗ ${msg}`); process.exit(1); }

if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(HEXAR_MINT))
  die("Set HEXAR_MINT (or NEXT_PUBLIC_HEXAR_MINT) to your SPL mint address before paying out.");

// ---- key custody: env secret (preferred) or keypair file; never logged ----
async function loadTreasury(web3) {
  let bytes;
  if (process.env.TREASURY_SECRET) {
    let parsed;
    try { parsed = JSON.parse(process.env.TREASURY_SECRET); } catch { die("TREASURY_SECRET must be a JSON array of bytes (a Solana id.json's contents)."); }
    if (!Array.isArray(parsed)) die("TREASURY_SECRET must be a JSON array of bytes.");
    bytes = Uint8Array.from(parsed);
  } else {
    const kp = process.env.TREASURY_KEYPAIR || path.join(os.homedir(), ".config/solana/id.json");
    if (!fs.existsSync(kp)) die(`No treasury key: set TREASURY_SECRET or TREASURY_KEYPAIR (looked at ${kp}).`);
    bytes = Uint8Array.from(JSON.parse(fs.readFileSync(kp, "utf8")));
  }
  try { return web3.Keypair.fromSecretKey(bytes); } catch { die("Treasury secret key is malformed (need 64 bytes)."); }
}

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
  } finally {
    await pool.end();
  }
}

// ---- durable ledger: { [playerId]: { paid, txs:[{sig,amount,at}] } }; back-compat with old numeric form ----
function readLedger() {
  let raw;
  try { raw = JSON.parse(fs.readFileSync(LEDGER, "utf8")); } catch { return {}; }
  const out = {};
  for (const [id, v] of Object.entries(raw)) out[id] = typeof v === "number" ? { paid: v, txs: [] } : { paid: v.paid ?? 0, txs: v.txs ?? [] };
  return out;
}
function writeLedger(l) {
  const tmp = `${LEDGER}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(l, null, 2));
  fs.renameSync(tmp, LEDGER); // atomic: a crash mid-write never corrupts the ledger
}

async function withRetry(label, fn, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) { last = e; await new Promise((r) => setTimeout(r, 800 * (i + 1))); }
  }
  throw last;
}

const main = async () => {
  const web3 = await import("@solana/web3.js");
  const spl = await import("@solana/spl-token");

  const state = await loadState();
  const ledger = readLedger();

  // Compute owed, clamped to the lifetime cap and validated recipient — pure, no side effects.
  const owed = [];
  for (const p of Object.values(state.players ?? {})) {
    if (!p || p.isBot || !p.wallet) continue;
    const cleared = ledger[p.id]?.paid ?? 0;
    const lifetimeAllowed = Math.min(p.claimed ?? 0, CLAIM_CAP); // never pay past the cap, even on a bad snapshot
    let amount = Math.min(lifetimeAllowed - cleared, MAX_PER_WALLET);
    if (amount < MIN_PAYOUT) continue;
    let pubkey;
    try { pubkey = new web3.PublicKey(p.wallet); } catch { console.warn(`  ! ${p.id.slice(0, 8)} — invalid wallet, skipped`); continue; }
    if (!web3.PublicKey.isOnCurve(pubkey.toBytes())) { console.warn(`  ! ${p.id.slice(0, 8)} — wallet not on-curve, skipped`); continue; }
    owed.push({ id: p.id, wallet: p.wallet, pubkey, amount });
  }
  owed.sort((a, b) => b.amount - a.amount);

  // Apply the per-run total cap (largest-first), logging anything deferred.
  const queued = [];
  let runTotal = 0;
  for (const o of owed) {
    if (runTotal + o.amount > MAX_PER_RUN) { console.warn(`  ~ ${o.id.slice(0, 8)} — deferred (per-run cap ${MAX_PER_RUN})`); continue; }
    runTotal += o.amount;
    queued.push(o);
  }

  if (queued.length === 0) { console.log("Nothing to settle."); return; }
  const totalOwed = queued.reduce((s, o) => s + o.amount, 0);
  console.log(`${DRY ? "[dry-run] " : ""}${queued.length} payout(s), ${totalOwed.toLocaleString()} $HEXAR total:`);
  for (const o of queued) console.log(`  ${o.id.slice(0, 8)} → ${o.wallet.slice(0, 6)}…${o.wallet.slice(-4)}  ${o.amount.toLocaleString()} $HEXAR`);

  // ---- preflight: treasury must hold enough SOL (fees + ATA rent) and enough $HEXAR ----
  const conn = new web3.Connection(RPC, "confirmed");
  const treasury = await loadTreasury(web3);
  const mint = new web3.PublicKey(HEXAR_MINT);
  const PROG = spl.TOKEN_2022_PROGRAM_ID;

  const sol = (await withRetry("getBalance", () => conn.getBalance(treasury.publicKey))) / web3.LAMPORTS_PER_SOL;
  console.log(`Treasury ${treasury.publicKey.toBase58().slice(0, 6)}…  SOL ${sol.toFixed(4)}`);
  if (sol < MIN_TREASURY_SOL) die(`Treasury SOL ${sol.toFixed(4)} below MIN_TREASURY_SOL ${MIN_TREASURY_SOL} — top up before paying.`);

  const src = await withRetry("src ATA", () => spl.getOrCreateAssociatedTokenAccount(conn, treasury, mint, treasury.publicKey, false, "confirmed", undefined, PROG));
  const warBal = Number((await withRetry("getTokenBal", () => conn.getTokenAccountBalance(src.address))).value.amount) / 10 ** DECIMALS;
  console.log(`Treasury $HEXAR ${warBal.toLocaleString()}`);
  if (warBal < totalOwed) die(`Treasury $HEXAR ${warBal.toLocaleString()} < owed ${totalOwed.toLocaleString()} — fund the treasury before paying.`);

  if (DRY) { console.log("[dry-run] preflight OK — no transfers sent."); return; }

  // ---- execute: confirm each transfer, then persist the ledger (with signature) before the next ----
  let failures = 0;
  for (const o of queued) {
    try {
      const dest = await withRetry("dest ATA", () => spl.getOrCreateAssociatedTokenAccount(conn, treasury, mint, o.pubkey, false, "confirmed", undefined, PROG));
      const sig = await withRetry("transfer", () => spl.transferChecked(conn, treasury, src.address, mint, dest.address, treasury, BigInt(Math.round(o.amount)) * 10n ** BigInt(DECIMALS), DECIMALS, [], undefined, PROG));
      const entry = ledger[o.id] ?? { paid: 0, txs: [] };
      entry.paid += o.amount;
      entry.txs.push({ sig, amount: o.amount, at: Date.now() });
      ledger[o.id] = entry;
      writeLedger(ledger); // settle only after a confirmed transfer; atomic write
      console.log(`  ✓ ${o.id.slice(0, 8)}  ${o.amount.toLocaleString()} $HEXAR  ${sig}`);
    } catch (e) {
      failures++;
      console.error(`  ✗ ${o.id.slice(0, 8)}  ${e.message}`);
    }
  }
  console.log(`Done. ${queued.length - failures}/${queued.length} settled. Ledger: ${LEDGER}`);
  if (failures > 0) process.exit(2); // non-zero so cron/CI alerts on partial failure
};

main().catch((e) => { console.error(e); process.exit(1); });
