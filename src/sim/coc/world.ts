import { generateWorld, hexKey } from "@/game/world";
import { BASE_STORAGE_CAP, BUILDINGS, STARTING_WAR, UNITS } from "./config";
import type { CocBase, CocPlayer, CocResource, CocWorld } from "./types";

export const WORLD_RADIUS = 9;

export function createWorld(seed: number): CocWorld {
  const { radius, hexes } = generateWorld(WORLD_RADIUS);
  const hexRecord: CocWorld["hexes"] = {};
  for (const [k, h] of hexes) hexRecord[k] = h;
  return { seed, radius, tick: 0, hexes: hexRecord, bases: {}, claimedHexes: {}, players: {}, clans: {}, nextClanId: 1 };
}

export function addPlayer(state: CocWorld, id: string): CocWorld {
  if (state.players[id]) return state;
  const player: CocPlayer = { id, war: STARTING_WAR, joinedTick: state.tick };
  return { ...state, players: { ...state.players, [id]: player } };
}

export function ccLevel(base: CocBase): number {
  return base.buildings[base.centerKey]?.level ?? 1;
}

export function storageCap(base: CocBase, resource: CocResource): number {
  let cap = BASE_STORAGE_CAP;
  for (const b of Object.values(base.buildings)) {
    const def = BUILDINGS[b.id];
    if (def.stores === resource && b.level >= 1) {
      cap += def.levels[b.level - 1]?.storageCap ?? 0;
    }
  }
  return cap;
}

export function freeBuilders(base: CocBase): number {
  return base.builders - base.jobs.length;
}

/** Canonical key for a wall on the edge between two adjacent hexes. */
export function edgeKey(aKey: string, bKey: string): string {
  return [aKey, bKey].sort().join("|");
}

/** Total troop housing from operational army camps. */
export function housingCap(base: CocBase): number {
  let cap = 0;
  for (const b of Object.values(base.buildings)) {
    if (b.id === "armyCamp" && b.level >= 1) cap += BUILDINGS.armyCamp.levels[b.level - 1]?.housing ?? 0;
  }
  return cap;
}

/** Housing consumed by the standing army plus in-progress training. */
export function housingUsed(base: CocBase): number {
  let used = 0;
  for (const [unit, n] of Object.entries(base.army)) used += UNITS[unit as keyof typeof UNITS].housing * (n ?? 0);
  for (const order of base.trainQueue) used += UNITS[order.unit].housing;
  return used;
}

/** Does the base have a barracks ready to train? */
export function hasBarracks(base: CocBase): boolean {
  return Object.values(base.buildings).some((b) => b.id === "barracks" && b.level >= 1);
}

/** Make a restored snapshot resilient to schema evolution. */
export function normalizeWorld(state: CocWorld): CocWorld {
  const bases: CocWorld["bases"] = {};
  for (const [k, b] of Object.entries(state.bases ?? {})) {
    bases[k] = {
      ...b,
      ownedHexes: b.ownedHexes ?? [],
      buildings: b.buildings ?? {},
      walls: b.walls ?? {},
      jobs: b.jobs ?? [],
      gold: b.gold ?? 0,
      elixir: b.elixir ?? 0,
      builders: b.builders ?? 2,
      army: b.army ?? {},
      trainQueue: b.trainQueue ?? [],
      shieldUntil: b.shieldUntil ?? 0,
      trophies: b.trophies ?? 0,
    };
  }
  return {
    ...state,
    bases,
    claimedHexes: state.claimedHexes ?? {},
    players: state.players ?? {},
    clans: state.clans ?? {},
    nextClanId: state.nextClanId ?? 1,
  };
}

export { hexKey };
