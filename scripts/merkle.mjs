/**
 * Keccak256 Merkle tree for $HEXAR reward distributions.
 *
 * Single source of truth, shared by build-merkle.mjs (producer), payout-war.mjs (verifier), and the
 * vitest cross-check in src/web3/merkle.test.ts. Sorted-pair parents ⇒ direction-less proofs.
 *
 *   leaf   = keccak256( walletPubkey(32 bytes) ++ amount(u64 little-endian, base units) )
 *   parent = keccak256( sort(left, right) )
 *
 * The leaf/parent scheme matches a Solana keccak-based claim program, so the published `root` can
 * later be posted to an on-chain distributor that verifies the SAME proofs (the deferred Anchor
 * program). Until then the root is a tamper-evident commitment the payout script checks against.
 */
import { keccak_256 } from "@noble/hashes/sha3";
import bs58 from "bs58";

/** amount (bigint, base units) → 8-byte little-endian. */
export function u64le(amount) {
  const b = new Uint8Array(8);
  let v = BigInt(amount);
  if (v < 0n) throw new Error("amount must be non-negative");
  for (let i = 0; i < 8; i++) { b[i] = Number(v & 0xffn); v >>= 8n; }
  if (v !== 0n) throw new Error("amount exceeds u64");
  return b;
}

export function concat(...arrs) {
  const out = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0));
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}

/** leaf = keccak256( pubkey(32) ++ amount_u64_le(8) ). */
export function hashLeaf(walletB58, amountBaseUnits) {
  const pk = bs58.decode(walletB58);
  if (pk.length !== 32) throw new Error(`bad wallet pubkey: ${walletB58}`);
  return keccak_256(concat(pk, u64le(amountBaseUnits)));
}

function cmp(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}
export function hashPair(a, b) {
  return cmp(a, b) <= 0 ? keccak_256(concat(a, b)) : keccak_256(concat(b, a));
}

/** Returns layers bottom-up; layers[0] = leaves, last layer = [root]. */
export function buildLayers(leaves) {
  if (leaves.length === 0) throw new Error("no leaves");
  const layers = [leaves];
  let layer = leaves;
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      const a = layer[i];
      const b = i + 1 < layer.length ? layer[i + 1] : layer[i]; // duplicate the last when odd
      next.push(hashPair(a, b));
    }
    layers.push(next);
    layer = next;
  }
  return layers;
}
export function getRoot(layers) { return layers[layers.length - 1][0]; }

export function getProof(layers, index) {
  const proof = [];
  let idx = index;
  for (let l = 0; l < layers.length - 1; l++) {
    const layer = layers[l];
    const sib = idx ^ 1;
    proof.push(sib < layer.length ? layer[sib] : layer[idx]); // duplicate self when no sibling
    idx = idx >> 1;
  }
  return proof;
}

export function verifyProof(leaf, proof, root) {
  let h = leaf;
  for (const s of proof) h = hashPair(h, s);
  return cmp(h, root) === 0;
}

export function toHex(b) { return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join(""); }
export function fromHex(s) {
  const c = s.startsWith("0x") ? s.slice(2) : s;
  const o = new Uint8Array(c.length / 2);
  for (let i = 0; i < o.length; i++) o[i] = parseInt(c.slice(i * 2, i * 2 + 2), 16);
  return o;
}

/** Build a full distribution from {wallet, amount(base units)} entries. */
export function buildDistribution(entries) {
  const norm = entries.map((e) => ({ wallet: e.wallet, amount: BigInt(e.amount) }));
  const leaves = norm.map((e) => hashLeaf(e.wallet, e.amount));
  const layers = buildLayers(leaves);
  return {
    root: toHex(getRoot(layers)),
    count: norm.length,
    leaves: norm.map((e, i) => ({
      wallet: e.wallet,
      amount: e.amount.toString(), // base units, decimal string (JSON-safe)
      leaf: toHex(leaves[i]),
      proof: getProof(layers, i).map(toHex),
    })),
  };
}
