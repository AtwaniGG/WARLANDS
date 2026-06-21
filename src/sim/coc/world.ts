import { generateWorld, hexKey } from "@/game/world";
import { BASE_STORAGE_CAP, BUILDINGS, GRID_H, GRID_W, SEASON_LENGTH, STARTING_SEASON_POOL, STARTING_HEXAR, UNITS, makeObjectives } from "./config";
import type { CocBase, CocBuildingId, CocPlayer, CocResource, CocWorld } from "./types";

export const WORLD_RADIUS = 9;

/** A pristine, empty world. Bots are seeded at the server boundary (see `ensureBots`), not here,
 *  so the sim/tests stay deterministic against a known-empty world. */
export function createWorld(seed: number): CocWorld {
  const { radius, hexes } = generateWorld(WORLD_RADIUS);
  const hexRecord: CocWorld["hexes"] = {};
  for (const [k, h] of hexes) hexRecord[k] = h;
  return { seed, radius, tick: 0, hexes: hexRecord, bases: {}, claimedHexes: {}, players: {}, clans: {}, nextClanId: 1, pendingReports: {}, seasonPool: STARTING_SEASON_POOL, season: { id: 1, endsAtTick: SEASON_LENGTH } };
}

export function addPlayer(state: CocWorld, id: string): CocWorld {
  if (state.players[id]) return state;
  const player: CocPlayer = { id, hexar: STARTING_HEXAR, joinedTick: state.tick, objectives: makeObjectives(id), claimed: 0, earned: 0 };
  return { ...state, players: { ...state.players, [id]: player } };
}

/** Link a Solana wallet (base58 pubkey) to a player so the treasury can pay out on-chain. */
export function setWallet(state: CocWorld, id: string, wallet: string): CocWorld {
  const player = state.players[id];
  if (!player) return state;
  const clean = wallet.trim();
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean) || player.wallet === clean) return state; // base58 pubkey
  return { ...state, players: { ...state.players, [id]: { ...player, wallet: clean } } };
}

// ---- village grid geometry ----

export function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}
export function parseTile(key: string): { x: number; y: number } {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}
export function inGrid(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < GRID_W && y < GRID_H;
}
/** The list of tiles a building occupies when anchored (top-left) at `anchorKey`. */
export function footprintTiles(anchorKey: string, id: CocBuildingId): string[] {
  const { x, y } = parseTile(anchorKey);
  const { w, h } = BUILDINGS[id].footprint;
  const out: string[] = [];
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) out.push(tileKey(x + dx, y + dy));
  return out;
}
/** Does the building's whole footprint sit inside the grid when anchored at `anchorKey`? */
export function fitsInGrid(anchorKey: string, id: CocBuildingId): boolean {
  const { x, y } = parseTile(anchorKey);
  const { w, h } = BUILDINGS[id].footprint;
  return inGrid(x, y) && inGrid(x + w - 1, y + h - 1);
}
/** Every tile occupied by buildings (minus `excludeAnchor`) and walls — for collision checks. */
export function occupiedTiles(base: CocBase, excludeAnchor?: string): Set<string> {
  const set = new Set<string>();
  for (const [anchor, b] of Object.entries(base.buildings)) {
    if (anchor === excludeAnchor) continue;
    for (const t of footprintTiles(anchor, b.id)) set.add(t);
  }
  for (const t of Object.keys(base.walls)) set.add(t);
  for (const t of Object.keys(base.traps ?? {})) set.add(t);
  return set;
}

/** Defender garrison capacity from the Clan Castle (0 without one). */
export function garrisonCap(base: CocBase): number {
  for (const b of Object.values(base.buildings)) {
    if (b.id === "clanCastle" && b.level >= 1) return BUILDINGS.clanCastle.levels[b.level - 1]?.housing ?? 0;
  }
  return 0;
}
export function garrisonUsed(base: CocBase): number {
  let used = 0;
  for (const [unit, n] of Object.entries(base.garrison ?? {})) used += UNITS[unit as keyof typeof UNITS].housing * (n ?? 0);
  return used;
}

// ---- base introspection ----

/** Command Center (Town Hall) level — scanned from the placed building (no fixed center tile). */
export function ccLevel(base: CocBase): number {
  for (const b of Object.values(base.buildings)) if (b.id === "commandCenter") return b.level;
  return 1;
}
/** Anchor tile of the Town Hall, if placed. */
export function townHallKey(base: CocBase): string | undefined {
  for (const [k, b] of Object.entries(base.buildings)) if (b.id === "commandCenter") return k;
  return undefined;
}
/** Builders come from operational Builder's Huts. */
export function builderCount(base: CocBase): number {
  let n = 0;
  for (const b of Object.values(base.buildings)) if (b.id === "builderHut" && b.level >= 1) n++;
  return n;
}
export function freeBuilders(base: CocBase): number {
  return builderCount(base) - base.jobs.length;
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

/**
 * Make a restored snapshot resilient to schema evolution. GV0 changed the base from a hex
 * cluster to a grid village, so any base that predates `location` (old `centerKey`/`ownedHexes`
 * shape) is incompatible and is dropped (soft reset); `claimedHexes` is rebuilt from survivors.
 */
export function normalizeWorld(state: CocWorld): CocWorld {
  const bases: CocWorld["bases"] = {};
  const claimedHexes: CocWorld["claimedHexes"] = {};
  for (const [owner, b] of Object.entries(state.bases ?? {})) {
    const loc = (b as Partial<CocBase>).location;
    if (!loc || typeof loc !== "string") continue; // old hex-cluster base → drop
    bases[owner] = {
      owner: b.owner ?? owner,
      location: loc,
      buildings: b.buildings ?? {},
      walls: b.walls ?? {},
      traps: b.traps ?? {},
      gold: b.gold ?? 0,
      elixir: b.elixir ?? 0,
      jobs: b.jobs ?? [],
      army: b.army ?? {},
      garrison: b.garrison ?? {},
      trainQueue: b.trainQueue ?? [],
      shieldUntil: b.shieldUntil ?? 0,
      trophies: b.trophies ?? 0,
    };
    claimedHexes[loc] = owner;
  }
  const players: CocWorld["players"] = {};
  for (const [id, p] of Object.entries(state.players ?? {})) {
    const legacyWar = (p as { war?: number }).war; // pre-rename snapshots stored the balance as `war`
    const player = { ...p, objectives: p.objectives ?? (p.isBot ? undefined : makeObjectives(id)), claimed: p.claimed ?? 0, earned: p.earned ?? 0, hexar: p.hexar ?? legacyWar ?? STARTING_HEXAR };
    delete (player as { war?: number }).war; // drop the old field name
    players[id] = player;
  }
  return {
    ...state,
    bases,
    claimedHexes,
    players,
    clans: state.clans ?? {},
    nextClanId: state.nextClanId ?? 1,
    pendingReports: state.pendingReports ?? {},
    seasonPool: state.seasonPool ?? STARTING_SEASON_POOL,
    season: state.season ?? { id: 1, endsAtTick: (state.tick ?? 0) + SEASON_LENGTH },
  };
}

/**
 * Structural sanity check for a (normalized) restored world. Catches irrecoverable corruption
 * — wrong shape, NaN tick, missing core maps, negative balances — so the server can refuse to
 * boot a garbage snapshot instead of silently serving a broken world. Returns the first handful
 * of problems; empty `errors` ⇒ safe to serve.
 */
export function validateWorld(state: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const push = (e: string) => { if (errors.length < 20) errors.push(e); };

  if (typeof state !== "object" || state === null) return { ok: false, errors: ["world is not an object"] };
  const s = state as Partial<CocWorld>;

  if (!Number.isFinite(s.tick) || (s.tick as number) < 0) push(`invalid tick: ${s.tick}`);
  for (const key of ["hexes", "players", "bases", "claimedHexes", "clans"] as const) {
    if (typeof s[key] !== "object" || s[key] === null) push(`missing/invalid map: ${key}`);
  }
  if (!Number.isFinite(s.seasonPool) || (s.seasonPool as number) < 0) push(`invalid seasonPool: ${s.seasonPool}`);
  if (!s.season || !Number.isFinite(s.season.endsAtTick)) push("invalid season");

  for (const [id, p] of Object.entries(s.players ?? {})) {
    if (!p || typeof p !== "object") { push(`player ${id} is not an object`); continue; }
    if (!Number.isFinite(p.hexar) || (p.hexar as number) < 0) push(`player ${id} has invalid hexar: ${p.hexar}`);
    if (!Number.isFinite(p.claimed ?? 0) || (p.claimed ?? 0) < 0) push(`player ${id} has invalid claimed`);
    if (!Number.isFinite(p.earned ?? 0) || (p.earned ?? 0) < 0) push(`player ${id} has invalid earned`);
    if ((p.claimed ?? 0) > (p.earned ?? 0) + 1e-6) push(`player ${id} claimed > earned (treasury invariant)`);
  }
  for (const [owner, b] of Object.entries(s.bases ?? {})) {
    if (!b || typeof b !== "object") { push(`base ${owner} is not an object`); continue; }
    if (typeof b.location !== "string" || !b.location) push(`base ${owner} has no location`);
    if (!Number.isFinite(b.gold) || (b.gold as number) < 0) push(`base ${owner} has invalid gold`);
    if (!Number.isFinite(b.elixir) || (b.elixir as number) < 0) push(`base ${owner} has invalid elixir`);
  }

  return { ok: errors.length === 0, errors };
}

export { hexKey };
