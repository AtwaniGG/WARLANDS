/**
 * Wallet-signature identity. A player proves control of a Solana wallet by signing a
 * server-issued, single-use nonce with their ed25519 key (Phantom `signMessage`). The server
 * verifies the signature and uses the wallet pubkey AS the player identity — so one wallet is
 * one base, and you can't claim a base (or a payout wallet) you don't actually control.
 *
 * Pure + isomorphic: used by the server (verify) and unit tests (sign+verify). The browser only
 * signs (via the wallet adapter) and base58-encodes the result.
 */
import { ed25519 } from "@noble/curves/ed25519";
import bs58 from "bs58";

export const AUTH_DOMAIN = "WARLANDS";

/** The canonical human-readable message a client signs. `nonce` is server-issued & single-use. */
export function buildAuthMessage(nonce: string): string {
  return `${AUTH_DOMAIN} — sign in\nProve you control this wallet to command a base.\nThis is free and sends no transaction.\nnonce: ${nonce}`;
}

/** True for a valid base58-encoded 32-byte Solana pubkey. */
export function isValidPubkey(pubkey: string): boolean {
  try {
    return bs58.decode(pubkey).length === 32;
  } catch {
    return false;
  }
}

/**
 * Verify an ed25519 signature (base58, 64 bytes) over `message` by `pubkey` (base58, 32 bytes).
 * Returns false on any malformed input — never throws.
 */
export function verifyAuthSignature(pubkey: string, signatureB58: string, message: string): boolean {
  try {
    const pk = bs58.decode(pubkey);
    const sig = bs58.decode(signatureB58);
    if (pk.length !== 32 || sig.length !== 64) return false;
    return ed25519.verify(sig, new TextEncoder().encode(message), pk);
  } catch {
    return false;
  }
}
