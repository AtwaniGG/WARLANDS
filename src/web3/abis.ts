// Minimal typed ABIs for the WARLANDS contracts (only the functions the client uses).
// These mirror contracts/src/*.sol. Keep in sync with the Solidity.

export const warTokenAbi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "o", type: "address" }, { name: "s", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;

export const stakingManagerAbi = [
  { type: "function", name: "stakeForPlot", stateMutability: "nonpayable", inputs: [{ name: "plotId", type: "uint256" }, { name: "plotType", type: "uint8" }], outputs: [] },
  { type: "function", name: "requestUnstake", stateMutability: "nonpayable", inputs: [{ name: "plotId", type: "uint256" }], outputs: [] },
  { type: "function", name: "withdraw", stateMutability: "nonpayable", inputs: [{ name: "plotId", type: "uint256" }], outputs: [] },
  { type: "function", name: "claimRefund", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "totalStaked", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "stakerOf", stateMutability: "view", inputs: [{ name: "plotId", type: "uint256" }], outputs: [{ type: "address" }] },
  { type: "function", name: "plotStatus", stateMutability: "view", inputs: [{ name: "plotId", type: "uint256" }], outputs: [{ type: "uint8" }] },
  { type: "function", name: "refunds", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
] as const;

export const sinkRouterAbi = [
  { type: "function", name: "totalBurned", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalToPool", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalToTax", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

export const rewardDistributorAbi = [
  { type: "function", name: "totalFunded", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalClaimed", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [{ name: "seasonId", type: "uint256" }, { name: "amount", type: "uint256" }, { name: "proof", type: "bytes32[]" }], outputs: [] },
] as const;
