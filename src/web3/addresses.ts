// Deployed contract addresses — set via NEXT_PUBLIC_* env once you deploy (see contracts/).
// While unset (zero address) the app stays in mocked-prototype mode.

export const ZERO = "0x0000000000000000000000000000000000000000" as const;

function addr(v: string | undefined): `0x${string}` {
  return (v && /^0x[a-fA-F0-9]{40}$/.test(v) ? v : ZERO) as `0x${string}`;
}

export const ADDRESSES = {
  warToken: addr(process.env.NEXT_PUBLIC_WAR_TOKEN),
  stakingManager: addr(process.env.NEXT_PUBLIC_STAKING_MANAGER),
  sinkRouter: addr(process.env.NEXT_PUBLIC_SINK_ROUTER),
  rewardDistributor: addr(process.env.NEXT_PUBLIC_REWARD_DISTRIBUTOR),
} as const;

/** True once the core contracts are configured — gates on-chain mode. */
export const CONTRACTS_CONFIGURED =
  ADDRESSES.warToken !== ZERO && ADDRESSES.stakingManager !== ZERO;
