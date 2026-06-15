// Solana (devnet) configuration — WARLANDS on-chain layer.
// WAR is a Token-2022 SPL token on Solana devnet. Off-chain game is chain-agnostic.

export const SOLANA_CLUSTER = "devnet" as const;
export const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://api.devnet.solana.com";

/** WAR token mint (Token-2022) on devnet. */
export const WAR_MINT = process.env.NEXT_PUBLIC_WAR_MINT ?? "BHdvBpziU37TjyNCxjrFy4FFQ1DP2TButgrZyP9Qi8pT";
export const WAR_DECIMALS = 9;
export const WAR_SYMBOL = "WAR";

/** Whether the Solana on-chain layer is wired (a real mint is set). */
export const SOLANA_CONFIGURED = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(WAR_MINT);

const EXPLORER = "https://explorer.solana.com";
export function explorerTx(sig: string): string {
  return `${EXPLORER}/tx/${sig}?cluster=${SOLANA_CLUSTER}`;
}
export function explorerAddress(addr: string): string {
  return `${EXPLORER}/address/${addr}?cluster=${SOLANA_CLUSTER}`;
}
