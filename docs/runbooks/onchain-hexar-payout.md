# Runbook — On-chain $HEXAR payout (beta treasury)

**Status:** the agent environment has **no network egress and no signer access**, so it cannot run
this. These are the exact steps for *you* to settle in-game $HEXAR claims to real on-chain $HEXAR
during the beta. For the full launch flow (incl. the Merkle-gated payout) see
[mainnet-launch.md](mainnet-launch.md).

## How the loop works
- `$HEXAR` is sink-funded in-game: every $HEXAR **sink** (finish-now / extra builders / shield extend)
  flows into `world.seasonPool`; every **reward** (raid stars, objectives) is paid **out of the
  pool** (never minted beyond it). See `src/sim/coc/commands.ts` (`sinkToPool` / `payFromPool`).
- When a player taps **CLAIM** (`{ type: "claim", amount }` → `commands.ts` `claim()`), their
  in-game `hexar` is reduced and `players[id].claimed` is incremented. `claimed` is the **on-chain
  amount the treasury owes that player** and is persisted in the Postgres `world_snapshots` JSON.

## Prerequisites (one-time)
- Solana CLI on PATH, configured for **your network** (`SOLANA_RPC`), treasury keypair **in a
  no-space path** (the repo path has spaces and breaks the CLIs): e.g. `~/.config/solana/id.json`.
  - `solana config set --url "$SOLANA_RPC" --keypair ~/.config/solana/id.json`
- $HEXAR mint (Token-2022, 9 decimals) from env: `HEXAR_MINT` (or `NEXT_PUBLIC_HEXAR_MINT`).

> ⚠️ Beta is **non-custodial** by default — keep payouts in `--dry-run`. Real settlement needs a
> **multisig treasury + audit** first (see mainnet-launch.md). The treasury key here is a hot key.

## Wallet association — DONE
Players authenticate with a wallet signature (the **$HEXAR** panel shows the proven wallet); the
server stores `players[id].wallet` (`setWallet` in `src/sim/coc/world.ts`, base58-validated) and it's
persisted in the snapshot. `claim` records the owed amount in `players[id].claimed`. So the snapshot
has everything the treasury needs: `{ id, wallet, claimed }` per player.

## Settle with the script (recommended)
`scripts/payout-war.mjs` reads the latest snapshot, pays each player `(claimed − already-settled)`
$HEXAR, and keeps a local ledger so nobody is paid twice. Prefer the **Merkle-gated** flow
(`build-merkle.mjs` → `--merkle`). **Copy the scripts to a NO-SPACE path first.**
```bash
cp scripts/{payout-war,build-merkle,merkle}.mjs ~/warlands-payout/ && cd ~/warlands-payout
npm i pg @solana/web3.js @solana/spl-token @noble/hashes bs58
DATABASE_URL="<Railway Postgres URL>" node build-merkle.mjs                          # commit a root
DATABASE_URL="..." HEXAR_MINT=<mint> SOLANA_RPC=<rpc> node payout-war.mjs --merkle merkle-distribution.json --dry-run
DATABASE_URL="..." HEXAR_MINT=<mint> SOLANA_RPC=<rpc> node payout-war.mjs --merkle merkle-distribution.json
```
- Uses the treasury keypair (`TREASURY_SECRET`/`TREASURY_KEYPAIR`), your `SOLANA_RPC`, Token-2022
  transfers, and ledger `./payout-ledger.json`.
- No `DATABASE_URL`? Export a snapshot to JSON and pass `--file snapshot.json`.
- Schedule with cron once you've confirmed a dry-run; the ledger makes re-runs idempotent.

## Manual one-off (alternative)
```bash
# from a NO-SPACE cwd, treasury keypair active
spl-token transfer "$HEXAR_MINT" <AMOUNT> <RECIPIENT_WALLET> --fund-recipient --url "$SOLANA_RPC"
```

## Notes
- Keep the treasury keypair off any space-containing path (Anchor/Solana CLI footgun).
- The treasury must hold enough SOL (gas) + $HEXAR to cover owed claims before settling.
- Real-money settlement requires a fresh audited mint + multisig treasury custody (mainnet-launch.md).
