# WARLANDS — Mainnet Launch Runbook ($HEXAR)

Everything is env-driven so going live is a **one-step config change** once you have a real
mint. This file is the single source of truth for that flip.

---

## TL;DR — the one step

Easiest path — feed your mint to the orchestrator, which assembles all env + runs preflight:

```bash
node scripts/go-live.mjs --mint <YOUR_MINT> --rpc <PAID_RPC> --write
node scripts/preflight-mainnet.mjs --env .env.mainnet   # GO / NO-GO
```

Or set them by hand. When your $HEXAR token is live on Solana mainnet, set these and redeploy:

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

That's it for the code. Nothing is hardcoded to a fixed network anymore:
- [src/web3/solana.ts](../../src/web3/solana.ts) reads cluster/mint/RPC from env; mainnet has **no
  default mint** (blank = "not configured"), so prod can never silently use the beta/dev default token.
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
| **Wallet-signature identity** | Anonymous UUIDs → sybil/multi-account | ✅ DONE — set `AUTH_REQUIRED=1` |
| **Merkle claim pipeline** | On-chain claims must be provable/tamper-evident | ✅ DONE — `build-merkle.mjs` + `--merkle` gate |
| **Multisig treasury** (Squads/Realms) holds $HEXAR, not a hot key | Today the payout signer is a single hot key — one leak = total loss | ❌ TODO |
| **Timelock** on treasury withdrawals | Lets a quorum cancel a malicious/erroneous payout | ❌ TODO |
| **On-chain claim distributor** (Anchor) verifying the Merkle root | Full trustlessness | ✅ BUILT ([onchain/](../../onchain/), compiles + cross-language test) — needs **audit + deploy** |
| **Contract/treasury audit** | No third-party review yet | ❌ TODO |
| **Paid mainnet RPC** | Public RPC will rate-limit/drop under load | ⚠️ set `NEXT_PUBLIC_SOLANA_RPC` |

The two app-layer blockers are now closed (wallet-sig identity + Merkle commitment). The remaining
items are treasury custody (multisig/timelock), the on-chain distributor, and an audit. Until those
land, run mainnet as a **free / non-custodial** experience (token gate + `AUTH_REQUIRED=1` on; keep
the payout worker in `--dry-run`).

---

## Wallet-signature identity

Set `AUTH_REQUIRED=1` on the world server (Railway). Then a player's identity is the Solana wallet
they prove control of by signing a server-issued nonce (Phantom `signMessage`) — no anonymous UUIDs,
no typed payout addresses. One token-gated wallet = one base, so sybil costs real capital. The
client already signs automatically via the connected wallet; the token gate guarantees a wallet is
present. (Leave `AUTH_REQUIRED` off only for local dev / anonymous playtests.)

## Payout worker (when preconditions are met)

Production flow: **build the Merkle commitment → review the root → pay against it.**

```bash
# From a NO-SPACE path (the repo path has spaces, which breaks the Solana toolchain).
# Copy BOTH scripts + the shared lib together:
cp scripts/{payout-war,build-merkle,merkle}.mjs ~/warlands-payout/ && cd ~/warlands-payout
npm i pg @solana/web3.js @solana/spl-token @noble/hashes bs58

# 1) Commit entitlements to a Merkle root (tamper-evident; publish this root).
DATABASE_URL=... node build-merkle.mjs                 # → merkle-distribution.json

# 2) Pay only what the root commits (verifies each wallet's proof + amount before sending).
DATABASE_URL=... HEXAR_MINT=<mint> SOLANA_RPC=<rpc> node payout-war.mjs --merkle merkle-distribution.json --dry-run
DATABASE_URL=... HEXAR_MINT=<mint> SOLANA_RPC=<rpc> node payout-war.mjs --merkle merkle-distribution.json
```

Built-in safety: per-wallet lifetime cap (`CLAIM_CAP`, keep in sync with `HEXAR_CLAIM_CAP` in
[src/sim/coc/config.ts](../../src/sim/coc/config.ts)), `MAX_PER_RUN`, `MIN_TREASURY_SOL` preflight,
a durable signed ledger that prevents double-paying, and — with `--merkle` — a keccak proof check so
the operator can't pay an amount that isn't in the published, reviewable root. The same root/proofs
are the seam for the future on-chain Anchor distributor.

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
