# Runbook — On-chain $WAR payout (Solana devnet treasury)

**Status:** the agent environment has **no network egress and no signer access**, so it cannot run
this. These are the exact steps for *you* to settle in-game $WAR claims to real on-chain $WAR.

## How the loop works
- `$WAR` is sink-funded in-game: every $WAR **sink** (finish-now / extra builders / shield extend)
  flows into `world.seasonPool`; every **reward** (raid stars, objectives) is paid **out of the
  pool** (never minted beyond it). See `src/sim/coc/commands.ts` (`sinkToPool` / `payFromPool`).
- When a player taps **CLAIM** (`{ type: "claim", amount }` → `commands.ts` `claim()`), their
  in-game `war` is reduced and `players[id].claimed` is incremented. `claimed` is the **on-chain
  amount the treasury owes that player** and is persisted in the Postgres `world_snapshots` JSON.

## Prerequisites (one-time)
- Solana CLI on PATH, devnet config, treasury keypair **in a no-space path** (the repo path has
  spaces and breaks the CLIs): `~/.config/solana/id.json` (holds the 1B $WAR supply).
  - `solana config set --url https://api.devnet.solana.com --keypair ~/.config/solana/id.json`
- WAR mint (Token-2022, 9 decimals): `BHdvBpziU37TjyNCxjrFy4FFQ1DP2TButgrZyP9Qi8pT`.

## Gap to close first: wallet association
`playerId` is a random UUID with **no Solana address attached**, so the treasury can't know where to
send. Before automated payouts, capture the player's wallet:
1. Extend the `claim` command to include the connected Phantom pubkey: `{ type: "claim", amount, wallet }`
   (the client already has it via `useWallet()` in `src/web3/`), and store `players[id].wallet`.
2. Persist (already snapshotted) so the payout reads `{ wallet, claimed }` per player.

## Manual settlement (per player)
```bash
# from a NO-SPACE cwd, treasury keypair active
spl-token transfer BHdvBpziU37TjyNCxjrFy4FFQ1DP2TButgrZyP9Qi8pT <AMOUNT> <RECIPIENT_WALLET> \
  --fund-recipient --url devnet
```
Then mark it settled to avoid double-paying: subtract the paid amount from that player's `claimed`
(add a `settleClaim` admin command, or track a separate `settled` ledger).

## Automated batch (recommended)
A small Node script (run from a no-space path, treasury keypair loaded), using
`@solana/web3.js` + `@solana/spl-token`:
1. Read the latest snapshot (server `loadLatest()` / query `world_snapshots`).
2. For each player with `claimed > settled`, transfer `(claimed - settled)` $WAR to `wallet`
   (`getOrCreateAssociatedTokenAccount` + `transferChecked`, programId = Token-2022).
3. Record `settled = claimed` (persist a settlement ledger).
4. Schedule (cron) and alert on failures. Cap per-run total to the treasury balance.

## Notes
- Keep the treasury keypair off any space-containing path (Anchor/Solana CLI footgun).
- Devnet airdrops are rate-limited; the treasury already holds enough SOL + the 1B $WAR.
- This settles **devnet** $WAR; mainnet would require a fresh mint + audited treasury custody.
