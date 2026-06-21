import { maxLevelOf } from "./config";
import type { CocBase, CocBuildingId, CocTrapId, CocWorld } from "./types";

/** Deterministic PRNG (mirrors the sim's mulberry32). */
function mulberry32(a: number): () => number {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Default number of AI villages to keep on the map so there is always a target. */
export const BOT_TARGET = 24;

/** A fixed, non-overlapping base layout for a given Town-Hall tier (1–5) on the 20×20 grid. */
function botLayout(tier: number): Pick<CocBase, "buildings" | "walls" | "traps" | "garrison"> {
  const L = Math.max(1, Math.min(5, tier));
  // Town Hall is walled in a 6..13 ring; every other building sits OUTSIDE the ring (no overlap).
  const buildings: CocBase["buildings"] = { "8,8": { id: "commandCenter", level: L } };
  const add = (key: string, id: CocBuildingId, lvl: number) => { buildings[key] = { id, level: Math.max(1, Math.min(lvl, maxLevelOf(id))) }; };
  add("2,8", "goldStorage", L);
  add("15,8", "elixirStorage", L);
  add("2,2", "goldCollector", L);
  add("15,15", "elixirCollector", L);
  add("8,2", "cannon", Math.min(L, 3));
  if (L >= 2) add("8,15", "mortar", L - 1);
  if (L >= 3) add("15,2", "airDefense", L - 2);
  if (L >= 2) add("2,15", "barracks", 1);

  const walls: CocBase["walls"] = {};
  if (L >= 2) {
    const wl = Math.min(L - 1, 3);
    for (let x = 6; x <= 13; x++) { walls[`${x},6`] = wl; walls[`${x},13`] = wl; }
    for (let y = 7; y <= 12; y++) { walls[`6,${y}`] = wl; walls[`13,${y}`] = wl; }
  }
  const traps: CocBase["traps"] = {};
  if (L >= 2) traps["7,7"] = { id: "bomb" as CocTrapId, level: 1 };
  if (L >= 3) traps["12,12"] = { id: "airMine" as CocTrapId, level: 1 };

  const garrison: CocBase["garrison"] = {};
  if (L >= 3) { add("15,11", "clanCastle", 1); garrison.grunt = 6; }
  return { buildings, walls, traps, garrison };
}

/** Build a complete bot base (with lootable resources) at a world hex. */
export function makeBotBase(owner: string, location: string, tier: number, rnd: () => number): CocBase {
  const { buildings, walls, traps, garrison } = botLayout(tier);
  const gold = 600 * tier + Math.floor(rnd() * 1400 * tier);
  const elixir = Math.floor((600 * tier + Math.floor(rnd() * 1400 * tier)) * 0.85);
  return {
    owner, location, buildings, walls, traps,
    gold, elixir, jobs: [], army: {}, garrison, trainQueue: [],
    shieldUntil: 0, trophies: 90 * tier + Math.floor(rnd() * 90),
  };
}

function botCount(world: CocWorld): number {
  return Object.values(world.players).filter((p) => p.isBot).length;
}

/** Seed `n` AI villages onto spread-out unclaimed hexes. Deterministic for a given world. */
export function seedBots(world: CocWorld, n: number): CocWorld {
  if (n <= 0) return world;
  const rnd = mulberry32((world.seed >>> 0) ^ 0x9e3779b9 ^ botCount(world));
  // shuffle unclaimed hex keys deterministically, then take the first n
  const open = Object.keys(world.hexes).filter((k) => !world.claimedHexes[k]).sort();
  for (let i = open.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [open[i], open[j]] = [open[j], open[i]]; }
  const players = { ...world.players };
  const bases = { ...world.bases };
  const claimedHexes = { ...world.claimedHexes };
  let made = 0;
  let idx = botCount(world);
  for (const hex of open) {
    if (made >= n) break;
    const tier = 1 + Math.floor(rnd() * 3); // TH 1–3
    const owner = `bot${idx++}`;
    players[owner] = { id: owner, hexar: 0, joinedTick: world.tick, isBot: true };
    bases[owner] = makeBotBase(owner, hex, tier, rnd);
    claimedHexes[hex] = owner;
    made++;
  }
  return { ...world, players, bases, claimedHexes };
}

/** Top up to `target` AI villages (used at world creation and on server restore). */
export function ensureBots(world: CocWorld, target = BOT_TARGET): CocWorld {
  const have = botCount(world);
  return have >= target ? world : seedBots(world, target - have);
}
