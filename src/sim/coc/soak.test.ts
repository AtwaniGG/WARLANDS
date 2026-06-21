/**
 * Launch soak — long-running invariant/stress test. NOT part of the normal suite (gated on SOAK=1).
 *
 *   SOAK=1 SOAK_MINUTES=100 npx vitest run src/sim/coc/soak.test.ts
 *
 * Hammers the authoritative multiplayer sim with random command streams across many players for the
 * target wall-clock duration, exercising the exact launch-critical paths:
 *   - applyCommand / applyTick under load (raids use server entropy, like production)
 *   - structural invariants + validateWorld() every batch
 *   - snapshot round-trip: JSON serialize → normalizeWorld → validateWorld (the persist/restore path)
 *   - Merkle build + proof verify over players with claims (the payout path)
 * Any throw, invariant break, or restore failure fails the run.
 */
import { describe, it, expect } from "vitest";
import { createWorld, addPlayer, builderCount, fitsInGrid, housingCap, housingUsed, inGrid, parseTile, normalizeWorld, validateWorld, setWallet } from "./world";
import { applyCommand } from "./commands";
import { applyTick } from "./tick";
import { maxLevelOf, TRAP_IDS, UNIT_IDS, WALL, claimableHexar } from "./config";
import { ed25519 } from "@noble/curves/ed25519";
import bs58 from "bs58";
import { buildDistribution, hashLeaf, verifyProof, fromHex } from "../../../scripts/merkle.mjs";
import type { CocBuildingId, CocCommand, CocUnitId, CocWorld } from "./types";

const RUN = process.env.SOAK === "1";
const MINUTES = Number(process.env.SOAK_MINUTES ?? 100);
const DURATION_MS = MINUTES * 60_000;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const BUILDABLE: CocBuildingId[] = ["goldCollector", "elixirCollector", "goldStorage", "elixirStorage", "cannon", "mortar", "airDefense", "barracks", "armyCamp", "builderHut", "clanCastle"];
const pick = <T>(rnd: () => number, arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const randomTile = (rnd: () => number): string => `${Math.floor(rnd() * 20)},${Math.floor(rnd() * 20)}`;

function checkInvariants(w: CocWorld): void {
  expect(validateWorld(w).ok).toBe(true); // structural + treasury (claimed ≤ earned) invariant
  for (const p of Object.values(w.players)) {
    expect(p.hexar).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(p.hexar)).toBe(true);
    expect(claimableHexar(p)).toBeGreaterThanOrEqual(0); // payout never goes negative
  }
  for (const [owner, b] of Object.entries(w.bases)) {
    expect(b.gold).toBeGreaterThanOrEqual(0);
    expect(b.elixir).toBeGreaterThanOrEqual(0);
    expect(b.jobs.length).toBeLessThanOrEqual(builderCount(b));
    expect(housingUsed(b)).toBeLessThanOrEqual(housingCap(b));
    expect(w.claimedHexes[b.location]).toBe(owner);
    for (const [tk, bld] of Object.entries(b.buildings)) {
      expect(fitsInGrid(tk, bld.id)).toBe(true);
      expect(bld.level).toBeLessThanOrEqual(maxLevelOf(bld.id));
    }
    for (const [tk, lvl] of Object.entries(b.walls)) {
      const { x, y } = parseTile(tk);
      expect(inGrid(x, y)).toBe(true);
      expect(lvl).toBeGreaterThanOrEqual(1);
      expect(lvl).toBeLessThanOrEqual(WALL.levels.length);
    }
    for (const u of UNIT_IDS) { expect(b.army[u] ?? 0).toBeGreaterThanOrEqual(0); expect(b.garrison[u] ?? 0).toBeGreaterThanOrEqual(0); }
  }
  for (const [cid, clan] of Object.entries(w.clans)) {
    expect(clan.members.length).toBeGreaterThan(0);
    for (const m of clan.members) expect(w.players[m]?.clanId).toBe(cid);
  }
}

function randomCommand(rnd: () => number, w: CocWorld, pid: string): CocCommand {
  const hexes = Object.keys(w.hexes);
  const owners = Object.keys(w.bases);
  const r = rnd();
  if (r < 0.10) { const [q, c] = pick(rnd, hexes).split(",").map(Number); return { type: "claimBase", q, r: c }; }
  if (r < 0.30) return { type: "placeBuilding", tileKey: randomTile(rnd), buildingId: pick(rnd, BUILDABLE) };
  if (r < 0.40) return { type: "upgradeBuilding", tileKey: randomTile(rnd) };
  if (r < 0.48) return { type: "collect" };
  if (r < 0.55) return { type: "moveBuilding", fromTile: randomTile(rnd), toTile: randomTile(rnd) };
  if (r < 0.62) return { type: "placeWall", tileKey: randomTile(rnd) };
  if (r < 0.66) return { type: "upgradeWall", tileKey: randomTile(rnd) };
  if (r < 0.70) return { type: "placeTrap", tileKey: randomTile(rnd), trapId: pick(rnd, TRAP_IDS) };
  if (r < 0.77) return { type: "trainTroop", unit: pick(rnd, UNIT_IDS) as CocUnitId };
  if (r < 0.86) {
    const deploy = [];
    const n = Math.floor(rnd() * 12);
    for (let i = 0; i < n; i++) deploy.push({ unit: pick(rnd, UNIT_IDS) as CocUnitId, x: Math.floor(rnd() * 20), y: Math.floor(rnd() * 20) });
    return { type: "raid", targetOwner: owners.length ? pick(rnd, owners) : pid, deploy };
  }
  if (r < 0.90) return { type: "finishNow", tileKey: randomTile(rnd) };
  if (r < 0.94) return { type: "extendShield", hours: Math.floor(rnd() * 26) };
  if (r < 0.96) return { type: "createClan", name: `Clan${Math.floor(rnd() * 1000)}` };
  if (r < 0.98) return { type: "claimObjective", id: "x" };
  if (r < 0.99) return { type: "claim", amount: Math.floor(rnd() * 100000) };
  return { type: "leaveClan" };
}

(RUN ? describe : describe.skip)("LAUNCH SOAK", () => {
  it(`survives ${MINUTES} minutes of random multiplayer load with all invariants intact`, () => {
    const start = Date.now();
    const rnd = mulberry32((0x50ac ^ 0x1234 ^ (MINUTES * 7919)) >>> 0);
    let w = createWorld(1337);
    const players = Array.from({ length: 12 }, (_, i) => `p${i + 1}`);
    for (const p of players) w = addPlayer(w, p);
    // give some players linked wallets (drives claim + merkle paths)
    const wallets = new Map<string, string>();
    for (const p of players.slice(0, 8)) {
      const wal = bs58.encode(ed25519.getPublicKey(ed25519.utils.randomPrivateKey()));
      wallets.set(p, wal);
      w = setWallet(w, p, wal);
    }

    let cmds = 0, ticks = 0, errs = 0, restores = 0, merkleRuns = 0, lastLog = start;
    while (Date.now() - start < DURATION_MS) {
      // a batch of random commands
      for (let i = 0; i < 2000; i++) {
        const pid = pick(rnd, players);
        const cmd = randomCommand(rnd, w, pid);
        const entropy = cmd.type === "raid" ? Math.floor(rnd() * 0xffffffff) : 0;
        const res = applyCommand(w, pid, cmd, entropy);
        if (res.error) errs++;
        w = res.state;
        cmds++;
        if (i % 25 === 0) { w = applyTick(w); ticks++; }
      }
      checkInvariants(w);

      // persist → restore round-trip (the data-safety path), must stay valid
      const restored = normalizeWorld(JSON.parse(JSON.stringify(w)));
      expect(validateWorld(restored).ok).toBe(true);
      restores++;

      // merkle payout path over wallet-linked players that have claimed
      const entries = Object.values(w.players)
        .filter((p) => wallets.has(p.id) && (p.claimed ?? 0) > 0)
        .map((p) => ({ wallet: wallets.get(p.id)!, amount: BigInt(Math.floor(p.claimed ?? 0)) * 1_000_000_000n }));
      if (entries.length > 0) {
        const dist = buildDistribution(entries);
        for (const l of dist.leaves) {
          expect(verifyProof(hashLeaf(l.wallet, BigInt(l.amount)), l.proof.map(fromHex), fromHex(dist.root))).toBe(true);
        }
        merkleRuns++;
      }

      if (Date.now() - lastLog > 30_000) {
        const mins = ((Date.now() - start) / 60000).toFixed(1);
        console.log(`[soak] ${mins}/${MINUTES}m · cmds=${cmds} ticks=${ticks} handledErrs=${errs} restores=${restores} merkle=${merkleRuns} bases=${Object.keys(w.bases).length} clans=${Object.keys(w.clans).length} tick=${w.tick}`);
        lastLog = Date.now();
      }
    }

    checkInvariants(w);
    console.log(`[soak] DONE ${MINUTES}m · cmds=${cmds} ticks=${ticks} handledErrs=${errs} restores=${restores} merkleRuns=${merkleRuns}`);
    expect(cmds).toBeGreaterThan(0);
  }, DURATION_MS + 120_000);
});
