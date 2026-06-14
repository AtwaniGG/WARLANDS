# WARLANDS — On-Chain Layer (GDD §20)

Solidity smart contracts for the WARLANDS Web3 strategy MMO. Self-contained Foundry project
with **zero external dependencies** (minimal in-repo `lib/` primitives), so it compiles and
tests with no `forge install` step. Swap the `lib/` primitives for OpenZeppelin in production.

Target chain: an **EVM L2 (Base or Arbitrum)** — see GDD §20.1.

## Contracts (`src/`)

| Contract | GDD | Responsibility |
|---|---|---|
| `WarToken.sol` | §12 | `$WAR` — **fixed-supply**, burnable ERC-20. **No mint function exists** after construction. |
| `StakingManager.sol` | §4, §4.1 | Lock $WAR to secure land plots. **Principal-safe**: a player's stake can only ever return to that player; conquest transfers the *right to stake* and refunds the loser in full. 7-day unbonding; 3% voluntary early-unstake fee (a sink). |
| `SinkRouter.sol` | §12.3, §13 | Single entrypoint for every $WAR sink. Splits into **BURN / POOL / TAX** with an immutable **20% burn floor** (structural deflation). |
| `RewardDistributor.sol` | §12.2, §14 | Per-season **Merkle-drop** claims. Enforces the core invariant: **Σ rewards claimed ≤ Σ sinks funded**. Has **no minting power**. |
| `AllegianceTreasury.sol` | §10.4, §11.5 | Per-Allegiance treasury with **officer quorum (multisig) + timelock** withdrawals (anti-capture). |
| `PlotTypes.sol` | §4 | Stake amount per plot type (10k–60k $WAR). |

## The two invariants this layer guarantees

1. **Principal safety** — no code path transfers one player's staked principal to another player.
   Conquest credits the loser a full refund; the winner must stake fresh. (`StakingManager`)
2. **Not a reward printer** — the `RewardDistributor` can only pay out $WAR the `SinkRouter`
   already collected from real sinks; `openSeason` caps and `claim` both revert if they would
   exceed the funded pool. (`RewardDistributor` + `SinkRouter`)

## Build & test

```bash
# Install Foundry (one time)
curl -L https://foundry.paradigm.xyz | bash && foundryup

# From this directory:
forge build
forge test -vvv
```

> Compilation has been verified with `solc 0.8.24`. Tests are written against a minimal
> in-repo cheatcode interface (`test/utils/Vm.sol`) and require the Foundry `forge` runner
> to execute (`forge test`).

### Test coverage (`test/`)
- `Staking.t.sol` — stake locks principal; voluntary withdraw applies fee + returns principal;
  **conquest is principal-safe** (conqueror never receives principal; loser reclaims in full);
  only the game server can resolve conquest; occupied plots can't be re-staked.
- `Tokenomics.t.sol` — sink split (burn/pool/tax) + supply deflation; **burn floor can't be
  violated**; **season cap bounded by funded pool**; full Merkle claim path with double-claim
  protection; fixed supply.
- `Treasury.t.sol` — quorum + timelock enforcement; non-officer rejection; no double-approval.

## Deploy

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast --private-key $PK
# optional env: OWNER, HOLDER, TAX_RECEIVER, GAME_SERVER, WAR_SUPPLY
```

Deploy order: `WarToken` → `RewardDistributor` → `SinkRouter` → `StakingManager`, then wire
`router.setConfig`, `distributor.setFunder`, `staking.setGameServer`.

## Production hardening TODO
- Replace `lib/` primitives with audited OpenZeppelin (`Ownable2Step`, `ReentrancyGuard`, `ERC20Permit`, `MerkleProof`).
- Move `owner` to a multisig + `TimelockController`; add `Pausable` to staking/market settlement.
- Add EIP-2612 `permit` to `$WAR` for gasless approvals.
- Full audit + invariant/fuzz tests before mainnet.
