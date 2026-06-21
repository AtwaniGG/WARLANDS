import { describe, it, expect } from "vitest";
import { ed25519 } from "@noble/curves/ed25519";
import bs58 from "bs58";
// Import the SAME implementation the ops scripts use — this is the cross-check that build-merkle
// and payout-war agree with what we test.
import {
  buildDistribution,
  hashLeaf,
  hashPair,
  verifyProof,
  toHex,
  fromHex,
  u64le,
} from "../../scripts/merkle.mjs";

const wallet = () => bs58.encode(ed25519.getPublicKey(ed25519.utils.randomPrivateKey()));
const fixedWallet = (fill: number) => bs58.encode(new Uint8Array(32).fill(fill));
const B = (n: number) => BigInt(n); // avoid `1000n` literals (tsconfig target predates them)

describe("merkle reward distribution", () => {
  it("single-entry root equals that leaf (structural)", () => {
    const w = fixedWallet(1);
    const dist = buildDistribution([{ wallet: w, amount: B(1_000_000_000) }]);
    expect(dist.root).toBe(toHex(hashLeaf(w, B(1_000_000_000))));
    expect(dist.leaves[0].proof).toEqual([]);
  });

  it("two-entry root equals the sorted-pair hash of the two leaves (structural)", () => {
    const a = fixedWallet(1);
    const b = fixedWallet(2);
    const dist = buildDistribution([{ wallet: a, amount: B(1000) }, { wallet: b, amount: B(2000) }]);
    const expected = toHex(hashPair(hashLeaf(a, B(1000)), hashLeaf(b, B(2000))));
    expect(dist.root).toBe(expected);
  });

  it("every leaf's proof verifies; tampering amount or wallet fails", () => {
    const entries = Array.from({ length: 9 }, (_, i) => ({ wallet: wallet(), amount: B((i + 1) * 1_000_000_000) }));
    const dist = buildDistribution(entries);
    const root = fromHex(dist.root);
    for (const l of dist.leaves) {
      const proof = l.proof.map(fromHex);
      expect(verifyProof(hashLeaf(l.wallet, BigInt(l.amount)), proof, root)).toBe(true);
      // tampered amount → fails
      expect(verifyProof(hashLeaf(l.wallet, BigInt(l.amount) + B(1)), proof, root)).toBe(false);
      // tampered wallet → fails
      expect(verifyProof(hashLeaf(wallet(), BigInt(l.amount)), proof, root)).toBe(false);
    }
  });

  it("a wallet not in the tree cannot forge a valid proof", () => {
    const dist = buildDistribution([{ wallet: wallet(), amount: B(5) }, { wallet: wallet(), amount: B(9) }]);
    const outsider = hashLeaf(wallet(), B(1000));
    expect(verifyProof(outsider, dist.leaves[0].proof.map(fromHex), fromHex(dist.root))).toBe(false);
  });

  it("is deterministic — same inputs produce the same root", () => {
    const e = [{ wallet: fixedWallet(7), amount: B(42) }, { wallet: fixedWallet(8), amount: B(99) }];
    expect(buildDistribution(e).root).toBe(buildDistribution(e).root);
  });

  it("u64le rejects negatives and overflow", () => {
    expect(() => u64le(B(-1))).toThrow();
    expect(() => u64le(B(2) ** B(64))).toThrow();
    expect(u64le(B(1))).toEqual(new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0]));
  });
});
