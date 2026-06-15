import { generateWorld, hexKey } from "@/game/world";
import { BASE_STORAGE_CAP, BUILDINGS, STARTING_WAR } from "./config";
import type { CocBase, CocPlayer, CocResource, CocWorld } from "./types";

export const WORLD_RADIUS = 9;

export function createWorld(seed: number): CocWorld {
  const { radius, hexes } = generateWorld(WORLD_RADIUS);
  const hexRecord: CocWorld["hexes"] = {};
  for (const [k, h] of hexes) hexRecord[k] = h;
  return { seed, radius, tick: 0, hexes: hexRecord, bases: {}, claimedHexes: {}, players: {} };
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
    };
  }
  return {
    ...state,
    bases,
    claimedHexes: state.claimedHexes ?? {},
    players: state.players ?? {},
  };
}

export { hexKey };
