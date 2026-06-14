// Rival AI empires — pushes the GDD's PvP-first vision into the single-player prototype.
// Empires own clusters of territory, hold a diplomatic stance toward the player, retaliate
// when at war, and can be raided for loot or conquered (siege) for their land.

import { hexKey, type World } from "./world";
import type { TerrainId } from "./plotTypes";
import type { Army } from "./units";
import type { ResourceBag } from "./resources";

export type Stance = "neutral" | "ally" | "war";

export interface EmpirePlot {
  q: number;
  r: number;
  terrain: TerrainId;
  garrison: Army;
  stock: ResourceBag;
}

export interface Empire {
  id: string;
  name: string;
  color: string;
  banner: string;
  stance: Stance;
  scouted: boolean;
  plots: Record<string, EmpirePlot>; // keyed by hexKey
  tier: number;
}

const EMPIRES_META = [
  { name: "Iron Concord", color: "#b45309", banner: "⚒️" },
  { name: "Crimson Pact", color: "#b91c1c", banner: "🩸" },
  { name: "Azure League", color: "#1d4ed8", banner: "🌊" },
  { name: "Ashen Horde", color: "#6d28d9", banner: "🐺" },
];

const NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1],
];

// deterministic RNG so empires are stable per world
function mkRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/** Generate rival empires owning small territory clusters on free hexes. */
export function generateEmpires(world: World, taken: Set<string>): Record<string, Empire> {
  const rnd = mkRand(20260614);
  const empires: Record<string, Empire> = {};
  const claimed = new Set<string>(taken);

  // candidate seeds: heartland/crucible hexes (ring between 25% and 75% of radius)
  const candidates = [...world.hexes.values()].filter(
    (h) => h.ring > world.radius * 0.25 && h.ring < world.radius * 0.8 && !claimed.has(hexKey(h.q, h.r)),
  );

  EMPIRES_META.forEach((meta, i) => {
    if (candidates.length === 0) return;
    // pick a seed
    let seed = candidates[Math.floor(rnd() * candidates.length)];
    for (let tries = 0; tries < 8 && claimed.has(hexKey(seed.q, seed.r)); tries++) {
      seed = candidates[Math.floor(rnd() * candidates.length)];
    }
    const id = `emp-${i}`;
    const size = 4 + Math.floor(rnd() * 4); // 4-7 plots
    const tier = seed.ring < world.radius * 0.45 ? 3 : 2;

    // BFS-ish cluster grow from the seed over free hexes
    const plots: Record<string, EmpirePlot> = {};
    const frontier = [seed];
    while (frontier.length && Object.keys(plots).length < size) {
      const h = frontier.shift()!;
      const k = hexKey(h.q, h.r);
      if (claimed.has(k)) continue;
      const cell = world.hexes.get(k);
      if (!cell) continue;
      claimed.add(k);
      const scale = tier;
      plots[k] = {
        q: h.q,
        r: h.r,
        terrain: cell.terrain,
        garrison: {
          infantry: Math.round((6 + rnd() * 8) * scale),
          tanks: Math.round(rnd() * 3 * scale),
          artillery: Math.round(rnd() * 2 * scale),
          drones: tier >= 3 ? Math.round(rnd() * 2) : 0,
        },
        stock: {
          food: Math.round(300 * scale + rnd() * 400 * scale),
          steel: Math.round(120 * scale + rnd() * 200),
          oil: Math.round(100 * scale + rnd() * 200),
          electronics: tier >= 3 ? Math.round(40 + rnd() * 80) : 0,
        },
      };
      // enqueue neighbors
      for (const [dq, dr] of NEIGHBORS) {
        const nk = hexKey(h.q + dq, h.r + dr);
        const ncell = world.hexes.get(nk);
        if (ncell && !claimed.has(nk)) frontier.push(ncell);
      }
    }

    empires[id] = {
      id, name: meta.name, color: meta.color, banner: meta.banner,
      stance: "neutral", scouted: false, plots, tier,
    };
  });

  return empires;
}

/** Map hexKey -> empireId for fast map/panel lookups. */
export function empireIndex(empires: Record<string, Empire>): Record<string, string> {
  const idx: Record<string, string> = {};
  for (const e of Object.values(empires)) {
    for (const k of Object.keys(e.plots)) idx[k] = e.id;
  }
  return idx;
}

export function empirePower(e: Empire): number {
  let p = 0;
  for (const plot of Object.values(e.plots)) {
    for (const n of Object.values(plot.garrison)) p += n ?? 0;
  }
  return p;
}
