import { describe, it, expect } from "vitest";
import { createWorld, addPlayer, storageCap, STARTING_HEXAR } from "./world";
import { applyCommand } from "./commands";
import { applyTick } from "./tick";
import type { Command, WorldState } from "./types";
import { RESOURCE_IDS } from "@/game/resources";
import { UNIT_IDS, UNIT_IDS as UNITS_ALL } from "@/game/units";
import type { BuildingId } from "@/game/buildings";
import type { AllegianceBuildingId } from "@/game/allegiance";

// ---- deterministic RNG ----
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ---- invariants ----
/** Total $HEXAR that should be conserved: balances + locked stake + treasuries + burned. */
function totalWar(s: WorldState): number {
  let t = 0;
  for (const p of Object.values(s.players)) t += p.war;
  for (const pl of Object.values(s.plots)) t += pl.stakeLocked;
  for (const a of Object.values(s.allegiances)) t += a.treasuryWar;
  t += s.burned;
  return t;
}

function isFiniteNum(n: unknown): boolean {
  return typeof n === "number" && Number.isFinite(n);
}

/** Returns a list of invariant-violation strings for the given state. */
function violations(s: WorldState): string[] {
  const out: string[] = [];
  for (const p of Object.values(s.players)) {
    if (!isFiniteNum(p.war)) out.push(`player ${p.id} war not finite: ${p.war}`);
    if (p.war < 0) out.push(`player ${p.id} war negative: ${p.war}`);
    if (p.allegianceId) {
      const a = s.allegiances[p.allegianceId];
      if (!a) out.push(`player ${p.id} points to missing allegiance ${p.allegianceId}`);
      else if (!a.members.includes(p.id)) out.push(`player ${p.id} not in members of ${a.id}`);
    }
  }
  for (const [k, pl] of Object.entries(s.plots)) {
    const cap = storageCap(pl);
    for (const [r, v] of Object.entries(pl.resources)) {
      if (!isFiniteNum(v)) out.push(`plot ${k} ${r} not finite: ${v}`);
      else {
        if (v < -1e-6) out.push(`plot ${k} ${r} negative: ${v}`);
        if (v > cap + 1e-3) out.push(`plot ${k} ${r} over cap: ${v} > ${cap}`);
      }
    }
    for (const [u, n] of Object.entries(pl.army)) {
      if ((n ?? 0) < 0) out.push(`plot ${k} army ${u} negative: ${n}`);
    }
    if (!isFiniteNum(pl.defensePct) || pl.defensePct < 0) out.push(`plot ${k} defensePct bad: ${pl.defensePct}`);
  }
  for (const a of Object.values(s.allegiances)) {
    if (a.treasuryWar < 0) out.push(`allegiance ${a.id} treasury negative: ${a.treasuryWar}`);
    if (a.members.length === 0) out.push(`allegiance ${a.id} has no members (should be disbanded)`);
    if (!a.members.includes(a.founder)) out.push(`allegiance ${a.id} founder not a member`);
  }
  for (const o of s.market.book) {
    if (o.qty <= 0) out.push(`market order ${o.id} qty <= 0: ${o.qty}`);
    if (!s.players[o.owner]) out.push(`market order ${o.id} owner missing`);
    if (!isFiniteNum(o.price) || o.price <= 0) out.push(`market order ${o.id} price bad: ${o.price}`);
  }
  return out;
}

const BUILDINGS_POOL: BuildingId[] = ["farm", "well", "lumberCamp", "quarry", "ironMine", "oilDerrick", "refinery", "foundry", "warehouse"];
const ALLY_BUILDINGS: AllegianceBuildingId[] = ["fortress", "research", "tradeHub", "radar"];

function ownedKeys(s: WorldState, pid: string): string[] {
  return Object.keys(s.plots).filter((k) => s.plots[k].owner === pid);
}
function unownedHexKeys(s: WorldState): string[] {
  return Object.keys(s.hexes).filter((k) => !s.plots[k]);
}

/** Generate a (often valid, sometimes nonsensical) command for `pid`. */
function genCommand(s: WorldState, pid: string, r: () => number): Command {
  const owned = ownedKeys(s, pid);
  const pick = <T>(arr: T[]): T => arr[Math.floor(r() * arr.length)];
  const roll = r();
  if (roll < 0.18) {
    const free = unownedHexKeys(s);
    const key = free.length ? pick(free) : "0,0";
    const [q, rr] = key.split(",").map(Number);
    return { type: "stake", q, r: rr };
  }
  if (roll < 0.34 && owned.length) {
    return { type: "build", key: pick(owned), buildingId: pick(BUILDINGS_POOL) };
  }
  if (roll < 0.42 && owned.length) {
    const key = pick(owned);
    return { type: "upgrade", key, index: Math.floor(r() * (s.plots[key].buildings.length + 1)) };
  }
  if (roll < 0.52 && owned.length) {
    return { type: "train", key: pick(owned), unit: pick(UNIT_IDS) };
  }
  if (roll < 0.6 && owned.length) {
    const from = pick(owned);
    const targets = Object.keys(s.plots).filter((k) => s.plots[k].owner !== pid);
    if (targets.length) {
      const army = { ...s.plots[from].army };
      return { type: "raid", fromKey: from, targetKey: pick(targets), army, intent: r() < 0.5 ? "raid" : "siege" };
    }
  }
  if (roll < 0.68 && owned.length) {
    return { type: "list", key: pick(owned), item: pick(RESOURCE_IDS), qty: 1 + Math.floor(r() * 50), price: Math.round((0.5 + r() * 6) * 100) / 100 };
  }
  if (roll < 0.78 && owned.length && s.market.book.length) {
    return { type: "buy", item: pick(RESOURCE_IDS), qty: 1 + Math.floor(r() * 50), toKey: pick(owned) };
  }
  if (roll < 0.82 && s.market.book.length) {
    return { type: "cancel", orderId: pick(s.market.book).id, toKey: owned.length ? pick(owned) : "0,0" };
  }
  if (roll < 0.86) return { type: "found", name: `Pact${Math.floor(r() * 1000)}` };
  if (roll < 0.9) {
    const others = Object.keys(s.allegiances);
    if (others.length) return { type: "joinAllegiance", id: pick(others) };
  }
  if (roll < 0.92) return { type: "leaveAllegiance" };
  if (roll < 0.95) return { type: "contribute", amount: 1 + Math.floor(r() * 3000) };
  if (roll < 0.97) return { type: "allegianceBuild", buildingId: pick(ALLY_BUILDINGS) };
  if (roll < 0.99) return { type: "propose", buildingId: pick(ALLY_BUILDINGS) };
  // vote on a random proposal in your allegiance
  const me = s.players[pid];
  const a = me?.allegianceId ? s.allegiances[me.allegianceId] : null;
  if (a && a.proposals.length) return { type: "vote", proposalId: pick(a.proposals).id, support: r() < 0.6 };
  return { type: "unstake", key: owned.length ? pick(owned) : "0,0" };
}

function giftResources(s: WorldState, key: string): WorldState {
  const plot = s.plots[key];
  if (!plot) return s;
  const bag: Record<string, number> = {};
  for (const id of RESOURCE_IDS) bag[id] = 1000; // under base cap (1500)
  return { ...s, plots: { ...s.plots, [key]: { ...plot, resources: bag as never } } };
}

describe("sim fuzz — invariants under random command streams", () => {
  it("preserves $HEXAR conservation, non-negativity, and never throws (200k steps)", () => {
    const SEEDS = [1, 2, 7, 42, 1337];
    const STEPS = 40000;
    const PLAYERS = ["A", "B", "C", "D"];
    const INITIAL = PLAYERS.length * STARTING_HEXAR;

    // record distinct leak/violation signatures across the whole run
    const warLeaks = new Map<string, { delta: number; count: number }>();
    const stateViolations = new Map<string, { count: number; action: string }>();

    for (const seed of SEEDS) {
      const r = rng(seed);
      let s = createWorld(seed);
      for (const p of PLAYERS) s = addPlayer(s, p);
      // Anchor the absolute total: conservation below keeps it here for the whole run.
      expect(totalWar(s)).toBe(INITIAL);

      for (let step = 0; step < STEPS; step++) {
        if (r() < 0.06) {
          const owned = Object.keys(s.plots);
          if (owned.length) s = giftResources(s, owned[Math.floor(r() * owned.length)]);
        }

        const before = totalWar(s);
        let action: string;
        let next: WorldState;
        if (r() < 0.12) {
          action = "tick";
          next = applyTick(s);
        } else {
          const pid = PLAYERS[Math.floor(r() * PLAYERS.length)];
          const cmd = genCommand(s, pid, r);
          action = cmd.type;
          // commands must NEVER throw, whatever the input
          const res = applyCommand(s, pid, cmd);
          next = res.state;
        }
        s = next;

        // 1. $HEXAR conservation — attribute any leak to the exact action
        const after = totalWar(s);
        if (Math.abs(after - before) > 1e-6) {
          const key = `${action}`;
          const cur = warLeaks.get(key) ?? { delta: 0, count: 0 };
          cur.delta = after - before;
          cur.count++;
          warLeaks.set(key, cur);
        }

        // 2. structural invariants
        const v = violations(s);
        for (const msg of v) {
          const sig = msg.replace(/[0-9.,-]+/g, "#"); // collapse numbers for grouping
          const cur = stateViolations.get(sig) ?? { count: 0, action };
          cur.count++;
          stateViolations.set(sig, cur);
        }
      }
    }

    const report = {
      warLeaks: Object.fromEntries(warLeaks),
      stateViolations: Object.fromEntries(stateViolations),
    };
    if (warLeaks.size || stateViolations.size) {
      // surface a readable report in the failure
      throw new Error("FUZZ FOUND BUGS:\n" + JSON.stringify(report, null, 2));
    }
    expect(report.warLeaks).toEqual({});
    expect(report.stateViolations).toEqual({});
  });

  // Targeted per-command conservation tests (derived from the fuzzer's findings).
  describe("per-command $HEXAR conservation", () => {
    function stakedPlains(player = "A") {
      let s = addPlayer(createWorld(1), player);
      const key = Object.keys(s.hexes).find((k) => s.hexes[k].terrain === "plains")!;
      const [q, r] = key.split(",").map(Number);
      s = applyCommand(s, player, { type: "stake", q, r }).state;
      s = giftResources(s, key);
      return { s, key };
    }

    it("build burns its cost (conserves $HEXAR)", () => {
      const { s, key } = stakedPlains();
      const before = totalWar(s);
      const res = applyCommand(s, "A", { type: "build", key, buildingId: "farm" });
      expect(res.error).toBeUndefined();
      expect(totalWar(res.state)).toBe(before);
    });

    it("upgrade burns its cost (conserves $HEXAR)", () => {
      const { s: s0, key } = stakedPlains();
      let s = s0;
      s = applyCommand(s, "A", { type: "build", key, buildingId: "farm" }).state;
      const idx = s.plots[key].buildings.findIndex((b) => b.id === "farm");
      const before = totalWar(s);
      const res = applyCommand(s, "A", { type: "upgrade", key, index: idx });
      expect(res.error).toBeUndefined();
      expect(totalWar(res.state)).toBe(before);
    });

    it("train burns the full cost (conserves $HEXAR)", () => {
      const { s, key } = stakedPlains();
      const before = totalWar(s);
      const res = applyCommand(s, "A", { type: "train", key, unit: "infantry" });
      expect(res.error).toBeUndefined();
      expect(totalWar(res.state)).toBe(before);
    });

    it("buy conserves $HEXAR even with fractional prices", () => {
      const sA = stakedPlains("A");
      let s = addPlayer(sA.s, "B");
      const k2 = Object.keys(s.hexes).find((k) => s.hexes[k].terrain === "plains" && !s.plots[k])!;
      const [q, r] = k2.split(",").map(Number);
      s = applyCommand(s, "B", { type: "stake", q, r }).state;
      s = applyCommand(s, "A", { type: "list", key: sA.key, item: "food", qty: 1, price: 2.5 }).state;
      const before = totalWar(s);
      const res = applyCommand(s, "B", { type: "buy", item: "food", qty: 1, toKey: k2 });
      expect(res.error).toBeUndefined();
      expect(totalWar(res.state)).toBe(before);
    });

    it("disbanding an allegiance refunds the treasury (conserves $HEXAR)", () => {
      let s = addPlayer(createWorld(1), "A");
      s = applyCommand(s, "A", { type: "found", name: "Solo" }).state;
      const before = totalWar(s);
      const res = applyCommand(s, "A", { type: "leaveAllegiance" });
      expect(res.error).toBeUndefined();
      expect(totalWar(res.state)).toBe(before);
    });
  });

  it("survives a JSON snapshot round-trip with identical subsequent ticks", () => {
    const r = rng(99);
    let s = createWorld(99);
    for (const p of ["A", "B"]) s = addPlayer(s, p);
    for (let i = 0; i < 3000; i++) {
      const pid = r() < 0.5 ? "A" : "B";
      if (r() < 0.1) s = applyTick(s);
      else s = applyCommand(s, pid, genCommand(s, pid, r)).state;
    }
    const round = JSON.parse(JSON.stringify(s)) as WorldState;
    // a tick on the original and on the round-tripped snapshot must match
    expect(applyTick(round)).toEqual(applyTick(s));
  });
});

void UNITS_ALL;
