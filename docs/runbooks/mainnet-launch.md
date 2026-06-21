# WARLANDS — Mainnet Launch Runbook ($HEXAR)

Everything is env-driven so going live is a **one-step config change** once you have a real
mint. This file is the single source of truth for that flip.

---

## TL;DR — the one step

When your $HEXAR token is live on Solana mainnet, set these and redeploy:

```bash
# Vercel (frontend) — Production env
NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta
NEXT_PUBLIC_HEXAR_MINT=<YOUR_MAINNET_MINT_ADDRESS>
NEXT_PUBLIC_SOLANA_RPC=<YOUR_PAID_MAINNET_RPC>     # strongly recommended (public RPC is rate-limited)
NEXT_PUBLIC_HEXAR_DECIMALS=9                        # match your mint

# Treasury payout worker (server-side, scripts/payout-war.mjs)
HEXAR_MINT=<YOUR_MAINNET_MINT_ADDRESS>
SOLANA_RPC=<YOUR_PAID_MAINNET_RPC>
TREASURY_SECRET=<json byte array>                  # from a SECRET MANAGER, never disk/CI logs
```

That's it for the code. Nothing is hardcoded to devnet anymore:
- [src/web3/solana.ts](../../src/web3/solana.ts) reads cluster/mint/RPC from env; mainnet has **no
  default mint** (blank = "not configured"), so prod can never silently use the devnet token.
- [src/components/TokenGate.tsx](../../src/components/TokenGate.tsx) gates on the configured mint.
- [scripts/payout-war.mjs](../../scripts/payout-war.mjs) refuses to run without an explicit mint.

Verify after deploy: the token gate reads balances from your mint, and
`explorer.solana.com` links resolve on mainnet (no `?cluster=` suffix).

---

## ⛔ The mint flip ≠ safe to custody real money

Pointing the app at mainnet is **not** the same as being safe for users' funds. Do **not** open a
real-money beta until ALL of these are true (none are solved by setting the mint):

| Precondition | Why | Status |
|---|---|---|
| **Multisig treasury** (Squads/Realms) holds $HEXAR, not a hot key | Today the payout signer is a single hot key — one leak = total loss | ❌ TODO |
| **Timelock** on treasury withdrawals | Lets a quorum cancel a malicious/erroneous payout | ❌ TODO |
| **Contract/treasury audit** | No third-party review yet | ❌ TODO |
| **Merkle claim pipeline** | On-chain claims must be provable; `rewardClaims.merkleProof` is unpopulated | ❌ TODO |
| **Wallet-signature identity** | Identity is an anonymous client UUID today → sybil/multi-account | ❌ TODO |
| **Paid mainnet RPC** | Public RPC will rate-limit/drop under load | ⚠️ set `NEXT_PUBLIC_SOLANA_RPC` |

Until then, run mainnet as a **free / non-custodial** experience (token gate can stay on for
holders; do not enable real payouts). The payout worker is gated behind `--dry-run` — keep it there.

---

## Payout worker (when preconditions are met)

```bash
# From a NO-SPACE path (the repo path has spaces, which breaks the Solana toolchain):
cp scripts/payout-war.mjs ~/warlands-payout/ && cd ~/warlands-payout
npm i pg @solana/web3.js @solana/spl-token

DATABASE_URL=... HEXAR_MINT=<mint> SOLANA_RPC=<rpc> node payout-war.mjs --dry-run   # preview
DATABASE_URL=... HEXAR_MINT=<mint> SOLANA_RPC=<rpc> node payout-war.mjs             # execute
```

Built-in safety: per-wallet lifetime cap (`CLAIM_CAP`, keep in sync with `HEXAR_CLAIM_CAP` in
[src/sim/coc/config.ts](../../src/sim/coc/config.ts)), `MAX_PER_RUN`, `MIN_TREASURY_SOL` preflight,
and a durable signed ledger that prevents double-paying.

---

## Server / data-safety env (Railway)

The world server now refuses to silently lose data:

```bash
DATABASE_URL=<neon/railway postgres>   # REQUIRED in prod: if set but unreachable, the server
                                       # hard-fails instead of booting a fresh (empty) world
PERSIST_EVERY=3                        # snapshot cadence in ticks (default 3s); lower = less loss
# WORLD_ALLOW_FRESH_ON_CORRUPT=1       # ONLY to intentionally reset after a corrupt snapshot
RL_CAPACITY=25                         # per-player command burst
RL_REFILL=12                           # per-player commands/sec refill
```

A corrupt/unreadable snapshot or a missing-but-configured DB stops the boot (so you notice)
rather than overwriting real player progress. SIGTERM/SIGINT (Railway redeploys) flush a final
snapshot before exit.
