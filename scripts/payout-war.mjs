#!/usr/bin/env node
/**
 * WARLANDS — on-chain $WAR payout (treasury-side settlement).
 *
 * Reads the latest game snapshot, finds players who have CLAIMED $WAR (players[*].claimed) and
 * LINKED a wallet (players[*].wallet), and transfers the still-owed amount to them on Solana
 * devnet from the treasury keypair. A local ledger prevents double-paying.
 *
 * RUN FROM A NO-SPACE PATH (the repo path has spaces, which breaks the Solana toolchain). Copy this
 * file somewhere like ~/warlands-payout/ and run it there.
 *
 *   npm i pg @solana/web3.js @solana/spl-token
 *   DATABASE_URL=... node payout-war.mjs --dry-run     # preview
 *   DATABASE_URL=... node payout-war.mjs               # execute
 *
 * Flags: --dry-run (no transfers) · --file <snapshot.json> (instead of DATABASE_URL)
 * Env:   TREASURY_KEYPAIR (default ~/.config/solana/id.json) · SOLANA_RPC (default devnet)
 *        LEDGER (default ./payout-ledger.json)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const WAR_MINT = "BHdvBpziU37TjyNCxjrFy4FFQ1DP2TButgrZyP9Qi8pT"; // Token-2022, 9 decimals
const DECIMALS = 9;
const RPC = process.env.SOLANA_RPC || "https://api.devnet.solana.com";
const LEDGER = process.env.LEDGER || "./payout-ledger.json";
const KEYPAIR = process.env.TREASURY_KEYPAIR || path.join(os.homedir(), ".config/solana/id.json");
const DRY = process.argv.includes("--dry-run");
const fileArg = process.argv[process.argv.indexOf("--file") + 1];

async function loadState() {
  if (process.argv.includes("--file")) return JSON.parse(fs.readFileSync(fileArg, "utf8"));
  const { default: pg } = await import("pg");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Set DATABASE_URL or pass --file <snapshot.json>");
  const ssl = url.includes("railway.internal") || url.includes("localhost") ? false : { rejectUnauthorized: false };
  const pool = new pg.Pool({ connectionString: url, ssl });
  const { rows } = await pool.query("SELECT state FROM world_snapshots ORDER BY id DESC LIMIT 1");
  await pool.end();
  if (!rows[0]) throw new Error("No snapshot found");
  return rows[0].state;
}

function readLedger() { try { return JSON.parse(fs.readFileSync(LEDGER, "utf8")); } catch { return {}; } }
function writeLedger(l) { fs.writeFileSync(LEDGER, JSON.stringify(l, null, 2)); }

const main = async () => {
  const state = await loadState();
  const ledger = readLedger();
  const owed = Object.values(state.players ?? {})
    .filter((p) => !p.isBot && p.wallet && (p.claimed ?? 0) > (ledger[p.id] ?? 0))
    .map((p) => ({ id: p.id, wallet: p.wallet, amount: (p.claimed ?? 0) - (ledger[p.id] ?? 0) }));

  if (owed.length === 0) { console.log("Nothing to settle."); return; }
  console.log(`${DRY ? "[dry-run] " : ""}${owed.length} payout(s):`);
  for (const o of owed) console.log(`  ${o.id.slice(0, 8)} → ${o.wallet.slice(0, 6)}…  ${o.amount.toLocaleString()} $WAR`);
  if (DRY) return;

  const web3 = await import("@solana/web3.js");
  const spl = await import("@solana/spl-token");
  const conn = new web3.Connection(RPC, "confirmed");
  const treasury = web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR, "utf8"))));
  const mint = new web3.PublicKey(WAR_MINT);
  const PROG = spl.TOKEN_2022_PROGRAM_ID;
  const src = await spl.getOrCreateAssociatedTokenAccount(conn, treasury, mint, treasury.publicKey, false, "confirmed", undefined, PROG);

  for (const o of owed) {
    try {
      const dest = await spl.getOrCreateAssociatedTokenAccount(conn, treasury, mint, new web3.PublicKey(o.wallet), false, "confirmed", undefined, PROG);
      const sig = await spl.transferChecked(conn, treasury, src.address, mint, dest.address, treasury, BigInt(Math.round(o.amount)) * 10n ** BigInt(DECIMALS), DECIMALS, [], undefined, PROG);
      ledger[o.id] = (ledger[o.id] ?? 0) + o.amount; // settle only after a confirmed transfer
      writeLedger(ledger);
      console.log(`  ✓ ${o.id.slice(0, 8)}  ${sig}`);
    } catch (e) {
      console.error(`  ✗ ${o.id.slice(0, 8)}  ${e.message}`);
    }
  }
  console.log("Done. Ledger:", LEDGER);
};

main().catch((e) => { console.error(e); process.exit(1); });
