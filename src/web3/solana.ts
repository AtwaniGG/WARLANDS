// Solana on-chain layer — WARLANDS. $HEXAR is a Token-2022 SPL token; the off-chain game is
// chain-agnostic. Everything here is env-driven so a MAINNET launch is a one-step config change:
//
//   NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta
//   NEXT_PUBLIC_HEXAR_MINT=<your real mint address>
//   NEXT_PUBLIC_SOLANA_RPC=<your paid mainnet RPC>     # optional but strongly recommended
//
// See docs/runbooks/mainnet-launch.md for the full checklist (the mint flip is NOT the same as
// being safe to custody real funds — multisig treasury, audit, and Merkle claims come first).

export type SolanaCluster = "mainnet-beta" | "devnet" | "testnet";

export const SOLANA_CLUSTER: SolanaCluster =
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as SolanaCluster) || "devnet";
export const IS_MAINNET = SOLANA_CLUSTER === "mainnet-beta";

const DEFAULT_RPC: Record<SolanaCluster, string> = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
};
export const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC ?? DEFAULT_RPC[SOLANA_CLUSTER];

// Convenience devnet token for local dev. MAINNET intentionally has NO default — you must paste
// your real mint, so production can never silently point at the throwaway devnet token.
const DEVNET_DEFAULT_MINT = "BHdvBpziU37TjyNCxjrFy4FFQ1DP2TButgrZyP9Qi8pT";
export const HEXAR_MINT = process.env.NEXT_PUBLIC_HEXAR_MINT ?? (IS_MAINNET ? "" : DEVNET_DEFAULT_MINT);
export const HEXAR_DECIMALS = Number(process.env.NEXT_PUBLIC_HEXAR_DECIMALS ?? 6);
export const HEXAR_SYMBOL = "HEXAR";

/** Whether the Solana on-chain layer is wired (a real mint is set). */
export const SOLANA_CONFIGURED = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(HEXAR_MINT);

/** Guardrail: mainnet selected but still pointing at the devnet token — a launch-day footgun. */
export const MINT_MISCONFIGURED = IS_MAINNET && HEXAR_MINT === DEVNET_DEFAULT_MINT;

const EXPLORER = "https://explorer.solana.com";
// Mainnet needs no ?cluster suffix; devnet/testnet do.
const clusterQuery = IS_MAINNET ? "" : `?cluster=${SOLANA_CLUSTER}`;
export function explorerTx(sig: string): string {
  return `${EXPLORER}/tx/${sig}${clusterQuery}`;
}
export function explorerAddress(addr: string): string {
  return `${EXPLORER}/address/${addr}${clusterQuery}`;
}
