#!/usr/bin/env node
/**
 * WARLANDS — one-shot mainnet "go-live" from a single input: your token mint.
 *
 *   node scripts/go-live.mjs --mint <MINT> [--rpc <PAID_RPC>] [--write]
 *
 * Assembles the entire mainnet config from the mint, prints the exact env to set on Vercel
 * (frontend) and Railway (world server), runs the preflight GO/NO-GO check, and prints the deploy
 * sequence. `--write` drops a `.env.mainnet` you can load. It does NOT mutate your cloud or move
 * funds — it leaves you with: set env, then deploy.
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const arg = (k) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : undefined; };
const MINT = arg("--mint") || process.env.NEXT_PUBLIC_HEXAR_MINT;
const RPC = arg("--rpc") || process.env.NEXT_PUBLIC_SOLANA_RPC || "";
const WRITE = process.argv.includes("--write");
const DEVNET_DEFAULT = "BHdvBpziU37TjyNCxjrFy4FFQ1DP2TButgrZyP9Qi8pT";
const isMint = (s) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s ?? "");

if (!isMint(MINT)) { console.error("✗ Provide your real mint:  node scripts/go-live.mjs --mint <address>"); process.exit(1); }
if (MINT === DEVNET_DEFAULT) { console.error("✗ That's the devnet placeholder mint — pass your real mainnet mint."); process.exit(1); }

const env = {
  NEXT_PUBLIC_SOLANA_CLUSTER: "mainnet-beta",
  NEXT_PUBLIC_HEXAR_MINT: MINT,
  NEXT_PUBLIC_SOLANA_RPC: RPC || "<YOUR_PAID_MAINNET_RPC>",
  NEXT_PUBLIC_HEXAR_DECIMALS: process.env.NEXT_PUBLIC_HEXAR_DECIMALS || "9",
  NEXT_PUBLIC_TOKEN_GATE: "on",
  NEXT_PUBLIC_TOKEN_GATE_MIN: process.env.NEXT_PUBLIC_TOKEN_GATE_MIN || "1000",
  AUTH_REQUIRED: "1",
};

const line = (s = "") => console.log(s);
line("\n=== WARLANDS go-live — assembled mainnet config ===");
for (const [k, v] of Object.entries(env)) line(`${k}=${v}`);

if (WRITE) {
  fs.writeFileSync(".env.mainnet", Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n") + "\n");
  line("\n→ wrote .env.mainnet");
}

line("\n=== Vercel (frontend) — set production env ===");
for (const [k, v] of Object.entries(env)) if (k.startsWith("NEXT_PUBLIC_")) line(`vercel env add ${k} production   # ${v}`);
line("\n=== Railway (world server) — set env ===");
line("AUTH_REQUIRED=1   DATABASE_URL=<prod-postgres>   PERSIST_EVERY=3");
line("NEXT_PUBLIC_SOLANA_CLUSTER / NEXT_PUBLIC_HEXAR_MINT / NEXT_PUBLIC_SOLANA_RPC  (same as above)");

line("\n=== Preflight ===");
const pf = spawnSync(process.execPath, ["scripts/preflight-mainnet.mjs"], { env: { ...process.env, ...env }, stdio: "inherit" });

line("\n=== Deploy sequence ===");
line("1) Frontend:   vercel deploy --prod");
line("2) Server:     deploy server/ to Railway with the env above");
line("3) On-chain distributor (when settling via the program; see onchain/README.md):");
line("   cd onchain && anchor keys sync && anchor build && anchor deploy --provider.cluster mainnet");
line(`   # then initialize a distribution for ${MINT.slice(0, 6)}… and fund its vault (onchain/README.md)`);
line("\n⚠️  Real payouts still require a MULTISIG treasury + audit before going live —");
line("   see docs/runbooks/mainnet-launch.md. Until then keep payout-war.mjs in --dry-run.");
process.exit(pf.status ?? 0);
