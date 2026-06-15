# Deploying the WARLANDS on-chain layer (testnet)

This deploys `WarToken`, `RewardDistributor`, `SinkRouter`, and `StakingManager` to an L2
testnet and wires them together. Default target: **Base Sepolia**.

## What you provide
1. A **fresh throwaway deployer wallet** (not your main wallet).
2. That wallet **funded with Base Sepolia ETH** from a faucet (e.g. https://www.alchemy.com/faucets/base-sepolia — ~0.02 ETH is plenty).
3. The wallet's **private key** in `contracts/.env` (copy from `.env.example`; this file is gitignored).

## Steps (Claude can run all of these once `contracts/.env` has a funded key)

```bash
# 1. Install Foundry (one-time)
curl -L https://foundry.paradigm.xyz | bash && foundryup

# 2. From contracts/, load env and deploy
cd contracts
set -a && source .env && set +a
forge script script/Deploy.s.sol --rpc-url "$RPC_URL" --broadcast --private-key "$PRIVATE_KEY"

# 3. The 4 deployed addresses print in the run + land in broadcast/Deploy.s.sol/<chainId>/run-latest.json
```

## After deploy (Claude wires this automatically)
Set the four addresses as Vercel production env vars and redeploy, flipping the client from
mocked staking to the real chain:

```bash
vercel env add NEXT_PUBLIC_WAR_TOKEN production            # WarToken address
vercel env add NEXT_PUBLIC_STAKING_MANAGER production      # StakingManager address
vercel env add NEXT_PUBLIC_SINK_ROUTER production          # SinkRouter address
vercel env add NEXT_PUBLIC_REWARD_DISTRIBUTOR production   # RewardDistributor address
vercel --prod --yes
```

## Security
- The private key lives only in `contracts/.env` (gitignored) — never committed, never echoed.
- Use a disposable wallet; testnet deploys need no real funds.
- For mainnet later: deploy from a hardware wallet / multisig, not a hot key.
