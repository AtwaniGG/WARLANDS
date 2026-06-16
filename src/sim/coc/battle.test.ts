import { describe, it, expect } from "vitest";
import { resolveRaid } from "./battle";
import { LOOT_PCT } from "./config";
import type { CocBase, CocUnitId, Deployment, PlacedBuilding } from "./types";

const D = (over: Partial<CocBase> = {}): CocBase => ({
  owner: "d",
  location: "0,0",
  buildings: { "8,8": { id: "commandCenter", level: 1 } },
  walls: {},
  gold: 1000,
  elixir: 1000,
  jobs: [],
  army: {},
  trainQueue: [],
  shieldUntil: 0,
  trophies: 0,
  ...over,
});

/** Spread `count` troops of `unit` near (ox,oy) on open corner tiles. */
function units(unit: CocUnitId, count: number, ox = 0, oy = 0): Deployment[] {
  const out: Deployment[] = [];
  for (let i = 0; i < count; i++) out.push({ unit, x: ox + (i % 5), y: oy + Math.floor(i / 5) });
  return out;
}

/** A base whose Town Hall is fully boxed in by a ring of walls. */
function walledBase(extra: Record<string, PlacedBuilding> = {}): CocBase {
  const walls: Record<string, number> = {};
  for (let x = 7; x <= 12; x++) { walls[`${x},7`] = 3; walls[`${x},12`] = 3; }
  for (let y = 7; y <= 12; y++) { walls[`7,${y}`] = 3; walls[`12,${y}`] = 3; }
  return D({ buildings: { "8,8": { id: "commandCenter", level: 1 }, ...extra }, walls });
}

describe("resolveRaid (positional)", () => {
  it("an overwhelming melee army 3-stars an undefended base and loots", () => {
    const defender = D({
      buildings: {
        "8,8": { id: "commandCenter", level: 1 },
        "14,8": { id: "goldCollector", level: 1 },
        "8,14": { id: "goldStorage", level: 1 },
      },
    });
    const r = resolveRaid(units("grunt", 28), defender, 12345);
    expect(r.stars).toBe(3);
    expect(r.destructionPct).toBe(1);
    expect(r.ccDestroyed).toBe(true);
    expect(r.loot.gold).toBe(Math.floor(1000 * LOOT_PCT));
  });

  it("a lone grunt cannot crack a walled, cannon-defended base (0 stars)", () => {
    const defender = walledBase({ "14,8": { id: "cannon", level: 3 }, "8,14": { id: "goldStorage", level: 3 } });
    const r = resolveRaid(units("grunt", 1), defender, 99);
    expect(r.stars).toBe(0);
    expect(r.destructionPct).toBeLessThan(0.5);
  });

  it("walls stop ground troops; breachers open them up", () => {
    const gruntsOnly = resolveRaid(units("grunt", 6), walledBase(), 555);
    const withBreachers = resolveRaid([...units("breacher", 4, 0, 0), ...units("grunt", 14, 0, 3)], walledBase(), 555);
    expect(gruntsOnly.ccDestroyed).toBe(false); // boxed out
    expect(withBreachers.structuresDestroyed).toBeGreaterThan(gruntsOnly.structuresDestroyed);
  });

  it("flying troops beat a heavily walled, ground-only base better than ground troops do", () => {
    const defender = walledBase({ "14,8": { id: "cannon", level: 3 }, "8,14": { id: "goldStorage", level: 2 } }); // cannon = ground-only, no air defense
    const ground = resolveRaid(units("grunt", 12), defender, 777);
    const air = resolveRaid(units("gunship", 3), defender, 777);
    expect(air.destructionPct).toBeGreaterThan(ground.destructionPct);
  });

  it("is deterministic for the same inputs + seed (incl. frames)", () => {
    const defender = D({ buildings: { "8,8": { id: "commandCenter", level: 2 }, "14,8": { id: "cannon", level: 2 } } });
    const deploy = [...units("grunt", 10), ...units("marksman", 5, 0, 2)];
    expect(resolveRaid(deploy, defender, 7)).toEqual(resolveRaid(deploy, defender, 7));
    expect(resolveRaid(deploy, defender, 7, { frames: true })).toEqual(resolveRaid(deploy, defender, 7, { frames: true }));
  });

  it("returns no loot and zero stars with no troops", () => {
    const r = resolveRaid([], D(), 1);
    expect(r.stars).toBe(0);
    expect(r.loot).toEqual({ gold: 0, elixir: 0 });
  });

  it("emits frames with non-increasing structure hp and troop survival", () => {
    const defender = D({ buildings: { "8,8": { id: "commandCenter", level: 1 }, "14,8": { id: "cannon", level: 2 } } });
    const r = resolveRaid(units("grunt", 10), defender, 42, { frames: true });
    expect(r.frames!.length).toBeGreaterThan(1);
    for (let i = 1; i < r.frames!.length; i++) {
      const prev = r.frames![i - 1], cur = r.frames![i];
      const prevHp = prev.structures.reduce((s, x) => s + x.hp, 0);
      const curHp = cur.structures.reduce((s, x) => s + x.hp, 0);
      expect(curHp).toBeLessThanOrEqual(prevHp);
      const prevAlive = prev.troops.filter((t) => t.alive).length;
      const curAlive = cur.troops.filter((t) => t.alive).length;
      expect(curAlive).toBeLessThanOrEqual(prevAlive);
    }
  });
});
