import { describe, it, expect } from "vitest";
import { ed25519 } from "@noble/curves/ed25519";
import bs58 from "bs58";
import { buildAuthMessage, isValidPubkey, verifyAuthSignature } from "./auth";

function keypair() {
  const priv = ed25519.utils.randomPrivateKey();
  const pub = ed25519.getPublicKey(priv);
  return { priv, pubB58: bs58.encode(pub) };
}
const sign = (priv: Uint8Array, msg: string) =>
  bs58.encode(ed25519.sign(new TextEncoder().encode(msg), priv));

describe("wallet-signature auth", () => {
  it("verifies a valid signature over the nonce message", () => {
    const { priv, pubB58 } = keypair();
    const msg = buildAuthMessage("nonce-123");
    expect(verifyAuthSignature(pubB58, sign(priv, msg), msg)).toBe(true);
  });

  it("rejects a signature over a different message (nonce mismatch / replay)", () => {
    const { priv, pubB58 } = keypair();
    const sig = sign(priv, buildAuthMessage("nonce-A"));
    expect(verifyAuthSignature(pubB58, sig, buildAuthMessage("nonce-B"))).toBe(false);
  });

  it("rejects a signature checked against a different pubkey (impersonation)", () => {
    const a = keypair();
    const b = keypair();
    const msg = buildAuthMessage("n");
    expect(verifyAuthSignature(b.pubB58, sign(a.priv, msg), msg)).toBe(false);
  });

  it("rejects malformed input without throwing", () => {
    expect(verifyAuthSignature("notbase58_0OIl", "x", "m")).toBe(false);
    expect(verifyAuthSignature("", "", "")).toBe(false);
  });

  it("isValidPubkey accepts 32-byte keys, rejects junk", () => {
    expect(isValidPubkey(keypair().pubB58)).toBe(true);
    expect(isValidPubkey("abc")).toBe(false);
    expect(isValidPubkey("")).toBe(false);
  });
});
