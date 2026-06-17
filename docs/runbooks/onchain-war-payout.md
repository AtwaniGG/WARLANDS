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

## Wallet association — DONE
Players now link a payout wallet in-game (the **$WAR** panel → "PAYOUT WALLET" → LINK), which sends a
`{ type: "link", wallet }` ws message; the server stores `players[id].wallet` (`setWallet` in
`src/sim/coc/world.ts`, base58-validated) and it's persisted in the snapshot. `claim` records the
owed amount in `players[id].claimed`. So the snapshot now has everything the treasury needs:
`{ id, wallet, claimed }` per player.

## Settle with the script (recommended)
`scripts/payout-war.mjs` reads the latest snapshot, pays each player `(claimed − already-settled)`
$WAR, and keeps a local ledger so nobody is paid twice. **Copy it to a NO-SPACE path first.**
```bash
cp scripts/payout-war.mjs ~/warlands-payout/ && cd ~/warlands-payout
npm i pg @solana/web3.js @solana/spl-token
DATABASE_URL="<railway Postgres URL>" node payout-war.mjs --dry-run   # preview owed payouts
DATABASE_URL="<railway Postgres URL>" node payout-war.mjs             # execute transfers
```
- Uses the treasury keypair `~/.config/solana/id.json` (override with `TREASURY_KEYPAIR`), devnet RPC
  (`SOLANA_RPC`), Token-2022 transfers, and ledger `./payout-ledger.json`.
- No `DATABASE_URL`? Export a snapshot to JSON and pass `--file snapshot.json`.
- Schedule with cron once you've confirmed a dry-run; the ledger makes re-runs idempotent.

## Manual one-off (alternative)
```bash
# from a NO-SPACE cwd, treasury keypair active
spl-token transfer BHdvBpziU37TjyNCxjrFy4FFQ1DP2TButgrZyP9Qi8pT <AMOUNT> <RECIPIENT_WALLET> \
  --fund-recipient --url devnet
```

## Notes
- Keep the treasury keypair off any space-containing path (Anchor/Solana CLI footgun).
- Devnet airdrops are rate-limited; the treasury already holds enough SOL + the 1B $WAR.
- This settles **devnet** $WAR; mainnet would require a fresh mint + audited treasury custody.
