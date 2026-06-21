# WARLANDS on-chain — $HEXAR Merkle claim distributor

Trustless on-chain settlement of the reward roots produced by
[`scripts/build-merkle.mjs`](../scripts/build-merkle.mjs). The program's leaf/parent hashing is
**identical** to [`scripts/merkle.mjs`](../scripts/merkle.mjs), so the same
`merkle-distribution.json` proofs verify on-chain:

```
leaf   = keccak256( claimant_pubkey(32) ++ amount(u64 little-endian, base units) )
parent = keccak256( sort(left, right) )      # lexicographic → direction-less proofs
```

> ⚠️ **UNAUDITED.** This program moves funds. Get a security audit before mainnet. Until then,
> settle off-chain with `payout-war.mjs --merkle` (verifies the same root) behind a multisig.

## Instructions
- `initialize(root)` — create a `Distribution` PDA committed to a Merkle root + a program-owned
  vault (ATA of a PDA). Fund the vault with enough $HEXAR to cover every committed leaf.
- `claim(amount, proof)` — the signing wallet proves its leaf is in `root` and receives `amount`
  base units. A per-`(distribution, claimant)` PDA enforces a single claim.
- `authority_withdraw(amount)` — authority reclaims the unclaimed remainder after an epoch.

Model: **one root = one claimable set, each wallet claims once.** For recurring epochs, publish a
fresh root per epoch (leaf = that epoch's owed amount) or run a new `Distribution`.

## Build & deploy

```bash
cd onchain
anchor keys sync          # generate a program keypair you control + sync declare_id/Anchor.toml
anchor build              # compiles the SBF program (also writes target/idl + types)
anchor deploy --provider.cluster mainnet   # needs a funded deployer wallet (SOL)
```

`anchor keys sync` replaces the committed placeholder program id with one whose upgrade key **you**
hold. Keep that keypair (`target/deploy/hexar_distributor-keypair.json`) secret — it controls
program upgrades; ideally transfer upgrade authority to your multisig after deploy.

## Initialize a distribution + fund it

1. Build the root off-chain: `DATABASE_URL=... node ../scripts/build-merkle.mjs` → `merkle-distribution.json`.
2. Call `initialize(root)` with your `mint` and authority (a TS migration or `anchor run`); it
   creates the `Distribution` + vault ATA. The IDL is at `target/idl/hexar_distributor.json`.
3. Transfer enough $HEXAR into the vault ATA to cover `totalBaseUnits` from the distribution file.
4. Players call `claim(amount, proof)` from the app using their leaf's `amount` + `proof`.

## Leaf-format guarantee

The Rust `claim` recomputes the leaf as `keccak256(claimant.key() ++ amount.to_le_bytes())` and
folds the proof with sorted-pair keccak — byte-for-byte the same as `scripts/merkle.mjs`. The
vitest cross-check in [`src/web3/merkle.test.ts`](../src/web3/merkle.test.ts) pins that JS side;
keep both in sync if you ever change the scheme.
