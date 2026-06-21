import { hexKey } from "@/game/world";
import { builderCost, BUILDINGS, ccTier, claimableHexar, finishCost, levelDef, maxLevelOf, maxWallLevel, MAX_BUILDERS, nextObjective, SHIELD_MAX_SECS, SHIELD_SECS_PER_PCT, STARTING_ELIXIR, STARTING_GOLD, TRAPS, UNITS, WALL, HEXAR_RAID_REWARD_PER_STAR, HEXAR_SHIELD_PER_HOUR } from "./config";
import { builderCount, ccLevel, fitsInGrid, footprintTiles, freeBuilders, garrisonCap, garrisonUsed, hasBarracks, housingCap, housingUsed, inGrid, occupiedTiles, parseTile, storageCap } from "./world";
import { resolveRaid } from "./battle";
import type { Army, Clan, CocBase, CocBuildingId, CocCommand, CocResource, CocTrapId, CocUnitId, CocWorld, CommandResult, Deployment, ObjectiveKind, PlacedBuilding } from "./types";

const CLAN_MAX_MEMBERS = 10;
/** Starting village layout on the 20×20 grid: a centered Town Hall flanked by two Builder's Huts. */
const TH_ANCHOR = "8,8"; // 4×4 → tiles x8–11, y8–11
const HUT_ANCHORS = ["5,9", "14,9"]; // 2×2 each, clear of the Town Hall

function fail(state: CocWorld, error: string): CommandResult {
  return { state, error };
}

function countOf(base: CocBase, id: CocBuildingId): number {
  return Object.values(base.buildings).filter((b) => b.id === id).length;
}
function hasJobOn(base: CocBase, key: string): boolean {
  return base.jobs.some((j) => j.tileKey === key);
}
function canAfford(base: CocBase, cost: Partial<Record<CocResource, number>>): boolean {
  return base.gold >= (cost.gold ?? 0) && base.elixir >= (cost.elixir ?? 0);
}
function spend(base: CocBase, cost: Partial<Record<CocResource, number>>): { gold: number; elixir: number } {
  return { gold: base.gold - (cost.gold ?? 0), elixir: base.elixir - (cost.elixir ?? 0) };
}

// ---- sink-funded $HEXAR economy: every sink flows into the season pool; every reward is paid out of it ----
// (Sinks add to seasonPool inline at each call site; payouts come back through payFromPool.)
function payFromPool(state: CocWorld, playerId: string, want: number): { state: CocWorld; paid: number } {
  const pool = state.seasonPool ?? 0;
  const player = state.players[playerId];
  if (!player || want <= 0 || pool <= 0) return { state, paid: 0 };
  const paid = Math.min(pool, want);
  // Track pool earnings separately — only this is withdrawable on-chain (see claim()).
  return { state: { ...state, seasonPool: pool - paid, players: { ...state.players, [playerId]: { ...player, hexar: player.hexar + paid, earned: (player.earned ?? 0) + paid } } }, paid };
}
function bumpObjectives(state: CocWorld, playerId: string, kind: ObjectiveKind, amount: number): CocWorld {
  const player = state.players[playerId];
  if (!player?.objectives || amount <= 0) return state;
  let touched = false;
  const objectives = player.objectives.map((o) => {
    if (o.kind !== kind || o.claimed || o.progress >= o.target) return o;
    touched = true;
    return { ...o, progress: Math.min(o.target, o.progress + amount) };
  });
  return touched ? { ...state, players: { ...state.players, [playerId]: { ...player, objectives } } } : state;
}
/** Would a building of `id` anchored at `anchorKey` collide with anything (excluding `exclude`)? */
function collides(base: CocBase, anchorKey: string, id: CocBuildingId, exclude?: string): boolean {
  const occ = occupiedTiles(base, exclude);
  return footprintTiles(anchorKey, id).some((t) => occ.has(t));
}

function claimBase(state: CocWorld, playerId: string, q: number, r: number): CommandResult {
  if (!state.players[playerId]) return fail(state, "Unknown player.");
  if (state.bases[playerId]) return fail(state, "You already have a base.");
  const key = hexKey(q, r);
  if (!state.hexes[key]) return fail(state, "No such hex.");
  if (state.claimedHexes[key]) return fail(state, "That land is already claimed.");
  const buildings: Record<string, PlacedBuilding> = {
    [TH_ANCHOR]: { id: "commandCenter", level: 1 },
  };
  for (const h of HUT_ANCHORS) buildings[h] = { id: "builderHut", level: 1 };
  const base: CocBase = {
    owner: playerId,
    location: key,
    buildings,
    walls: {},
    traps: {},
    gold: STARTING_GOLD,
    elixir: STARTING_ELIXIR,
    jobs: [],
    army: {},
    garrison: {},
    trainQueue: [],
    shieldUntil: 0,
    trophies: 0,
  };
  return { state: { ...state, bases: { ...state.bases, [playerId]: base }, claimedHexes: { ...state.claimedHexes, [key]: playerId } } };
}

function placeBuilding(state: CocWorld, playerId: string, anchorKey: string, buildingId: CocBuildingId): CommandResult {
  const base = state.bases[playerId];
  if (!base) return fail(state, "You have no base.");
  if (buildingId === "commandCenter") return fail(state, "The Town Hall cannot be placed.");
  if (!fitsInGrid(anchorKey, buildingId)) return fail(state, "That doesn't fit in the village.");
  if (collides(base, anchorKey, buildingId)) return fail(state, "Those tiles are occupied.");

  // Builder's Hut: instant, paid in $HEXAR, no builder consumed, capped at MAX_BUILDERS.
  if (buildingId === "builderHut") {
    const player = state.players[playerId];
    if (!player) return fail(state, "Unknown player.");
    const count = builderCount(base);
    if (count >= MAX_BUILDERS) return fail(state, "You already have the maximum builders.");
    const cost = builderCost(count);
    // Defense-in-depth: a base always starts with 2 huts so cost is always ≥ HEXAR_BUILDER_BASE,
    // but never hand out a free/negative-cost builder if that invariant ever changes.
    if (cost <= 0) return fail(state, "Builder unavailable.");
    if (player.hexar < cost) return fail(state, `Not enough $HEXAR (need ${cost.toLocaleString()}).`);
    const newBase: CocBase = { ...base, buildings: { ...base.buildings, [anchorKey]: { id: "builderHut", level: 1 } } };
    return {
      state: {
        ...state,
        players: { ...state.players, [playerId]: { ...player, hexar: player.hexar - cost } },
        bases: { ...state.bases, [playerId]: newBase },
        seasonPool: (state.seasonPool ?? 0) + cost, // $HEXAR sink → treasury
      },
    };
  }

  const cap = ccTier(ccLevel(base)).caps[buildingId];
  if (!cap) return fail(state, "Locked at this Town Hall level.");
  if (countOf(base, buildingId) >= cap.maxCount) return fail(state, "Build limit reached for this Town Hall level.");
  if (freeBuilders(base) <= 0) return fail(state, "No builder is free.");
  const lv = levelDef(buildingId, 1)!;
  if (!canAfford(base, lv.cost)) {
    const need = lv.cost.gold ? "gold" : "elixir";
    return fail(state, `Not enough ${need}.`);
  }
  const { gold, elixir } = spend(base, lv.cost);
  const building: PlacedBuilding = { id: buildingId, level: 0, buffer: 0 };
  const newBase: CocBase = {
    ...base,
    gold,
    elixir,
    buildings: { ...base.buildings, [anchorKey]: building },
    jobs: [...base.jobs, { tileKey: anchorKey, buildingId, kind: "build", toLevel: 1, finishesAtTick: state.tick + lv.buildTimeSec }],
  };
  return { state: { ...state, bases: { ...state.bases, [playerId]: newBase } } };
}

function upgradeBuilding(state: CocWorld, playerId: string, key: string): CommandResult {
  const base = state.bases[playerId];
  if (!base) return fail(state, "You have no base.");
  const b = base.buildings[key];
  if (!b) return fail(state, "Nothing to upgrade there.");
  if (b.level < 1) return fail(state, "Still under construction.");
  if (hasJobOn(base, key)) return fail(state, "That building is busy.");
  const nextLevel = b.level + 1;
  if (nextLevel > maxLevelOf(b.id)) return fail(state, "Already at max level.");
  if (b.id !== "commandCenter") {
    const cap = ccTier(ccLevel(base)).caps[b.id];
    if (!cap || nextLevel > cap.maxLevel) return fail(state, "Upgrade the Town Hall to raise the level cap.");
  }
  if (freeBuilders(base) <= 0) return fail(state, "No builder is free.");
  const lv = levelDef(b.id, nextLevel)!; // cost/time of the target level
  if (!canAfford(base, lv.cost)) {
    const need = lv.cost.gold ? "gold" : "elixir";
    return fail(state, `Not enough ${need}.`);
  }
  const { gold, elixir } = spend(base, lv.cost);
  const newBase: CocBase = {
    ...base,
    gold,
    elixir,
    jobs: [...base.jobs, { tileKey: key, buildingId: b.id, kind: "upgrade", toLevel: nextLevel, finishesAtTick: state.tick + lv.buildTimeSec }],
  };
  return { state: { ...state, bases: { ...state.bases, [playerId]: newBase } } };
}

function moveBuilding(state: CocWorld, playerId: string, fromTile: string, toTile: string): CommandResult {
  const base = state.bases[playerId];
  if (!base) return fail(state, "You have no base.");
  const b = base.buildings[fromTile];
  if (!b) return fail(state, "Nothing to move there.");
  if (b.level < 1) return fail(state, "Still under construction.");
  if (hasJobOn(base, fromTile)) return fail(state, "That building is busy.");
  if (!fitsInGrid(toTile, b.id)) return fail(state, "That doesn't fit in the village.");
  if (collides(base, toTile, b.id, fromTile)) return fail(state, "Those tiles are occupied.");
  const buildings = { ...base.buildings };
  delete buildings[fromTile];
  buildings[toTile] = b;
  return { state: { ...state, bases: { ...state.bases, [playerId]: { ...base, buildings } } } };
}

function collect(state: CocWorld, playerId: string): CommandResult {
  const base = state.bases[playerId];
  if (!base) return fail(state, "You have no base.");
  let gold = base.gold;
  let elixir = base.elixir;
  const goldCap = storageCap(base, "gold");
  const elixirCap = storageCap(base, "elixir");
  const buildings: Record<string, PlacedBuilding> = {};
  for (const [k, b] of Object.entries(base.buildings)) {
    const def = BUILDINGS[b.id];
    if (def.category === "collector" && b.level >= 1 && (b.buffer ?? 0) > 0) {
      if (def.produces === "gold") {
        const room = Math.max(0, goldCap - gold);
        const moved = Math.min(room, b.buffer ?? 0);
        gold += moved;
        buildings[k] = { ...b, buffer: (b.buffer ?? 0) - moved };
      } else {
        const room = Math.max(0, elixirCap - elixir);
        const moved = Math.min(room, b.buffer ?? 0);
        elixir += moved;
        buildings[k] = { ...b, buffer: (b.buffer ?? 0) - moved };
      }
    } else {
      buildings[k] = b;
    }
  }
  const next: CocWorld = { ...state, bases: { ...state.bases, [playerId]: { ...base, gold, elixir, buildings } } };
  return { state: bumpObjectives(next, playerId, "collectGold", gold - base.gold) };
}

function placeWall(state: CocWorld, playerId: string, tileKey: string): CommandResult {
  const base = state.bases[playerId];
  if (!base) return fail(state, "You have no base.");
  const { x, y } = parseTile(tileKey);
  if (!inGrid(x, y)) return fail(state, "That tile is outside the village.");
  if (occupiedTiles(base).has(tileKey)) return fail(state, "That tile is occupied.");
  if (Object.keys(base.walls).length >= ccTier(ccLevel(base)).maxWalls) {
    return fail(state, "Wall limit reached — upgrade the Town Hall.");
  }
  const cost = WALL.levels[0].cost;
  if (!canAfford(base, cost)) return fail(state, "Not enough gold.");
  const { gold, elixir } = spend(base, cost);
  return { state: { ...state, bases: { ...state.bases, [playerId]: { ...base, gold, elixir, walls: { ...base.walls, [tileKey]: 1 } } } } };
}

function upgradeWall(state: CocWorld, playerId: string, tileKey: string): CommandResult {
  const base = state.bases[playerId];
  if (!base) return fail(state, "You have no base.");
  const level = base.walls[tileKey];
  if (!level) return fail(state, "No wall there.");
  const nextLevel = level + 1;
  if (nextLevel > maxWallLevel(ccLevel(base))) return fail(state, "Upgrade the Town Hall to raise the wall cap.");
  const cost = WALL.levels[nextLevel - 1].cost;
  if (!canAfford(base, cost)) return fail(state, "Not enough gold.");
  const { gold, elixir } = spend(base, cost);
  return { state: { ...state, bases: { ...state.bases, [playerId]: { ...base, gold, elixir, walls: { ...base.walls, [tileKey]: nextLevel } } } } };
}

function placeTrap(state: CocWorld, playerId: string, tileKey: string, trapId: CocTrapId): CommandResult {
  const base = state.bases[playerId];
  if (!base) return fail(state, "You have no base.");
  const def = TRAPS[trapId];
  if (!def) return fail(state, "Unknown trap.");
  const { x, y } = parseTile(tileKey);
  if (!inGrid(x, y)) return fail(state, "That tile is outside the village.");
  if (occupiedTiles(base).has(tileKey)) return fail(state, "That tile is occupied.");
  if (Object.keys(base.traps).length >= ccTier(ccLevel(base)).maxTraps) {
    return fail(state, "Trap limit reached — upgrade the Town Hall.");
  }
  if (base.gold < def.cost.gold) return fail(state, "Not enough gold.");
  return {
    state: {
      ...state,
      bases: { ...state.bases, [playerId]: { ...base, gold: base.gold - def.cost.gold, traps: { ...base.traps, [tileKey]: { id: trapId, level: 1 } } } },
    },
  };
}

function trainTroop(state: CocWorld, playerId: string, unit: CocUnitId): CommandResult {
  const base = state.bases[playerId];
  if (!base) return fail(state, "You have no base.");
  if (!hasBarracks(base)) return fail(state, "Build a Barracks first.");
  const def = UNITS[unit];
  if (base.elixir < def.cost.elixir) return fail(state, "Not enough elixir.");
  if (housingUsed(base) + def.housing > housingCap(base)) return fail(state, "Not enough army housing — build an Army Camp.");
  const newBase: CocBase = {
    ...base,
    elixir: base.elixir - def.cost.elixir,
    trainQueue: [...base.trainQueue, { unit, finishesAtTick: state.tick + def.trainTimeSec }],
  };
  const next: CocWorld = { ...state, bases: { ...state.bases, [playerId]: newBase } };
  return { state: bumpObjectives(next, playerId, "trainTroops", 1) };
}

function fnv1a(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function raid(state: CocWorld, playerId: string, targetOwner: string, deploy: Deployment[], entropy = 0): CommandResult {
  const attacker = state.bases[playerId];
  if (!attacker) return fail(state, "You have no base.");
  if (targetOwner === playerId) return fail(state, "You cannot raid your own base.");
  const defender = state.bases[targetOwner];
  if (!defender) return fail(state, "No such base.");
  if (defender.shieldUntil > state.tick) return fail(state, "That base is shielded.");
  if (!Array.isArray(deploy) || deploy.length === 0) return fail(state, "Select an army to deploy.");

  // tally per-unit counts and verify the attacker owns them
  const counts: Partial<Record<CocUnitId, number>> = {};
  for (const d of deploy) {
    if (!UNITS[d.unit]) return fail(state, "Unknown unit.");
    // Reject off-grid / non-finite coords: a malicious client could otherwise crash the
    // battle resolver or corrupt pathfinding with x:-9999 / NaN deployments.
    if (!Number.isFinite(d.x) || !Number.isFinite(d.y) || !inGrid(Math.floor(d.x), Math.floor(d.y)))
      return fail(state, "Deployment off the battlefield.");
    counts[d.unit] = (counts[d.unit] ?? 0) + 1;
  }
  for (const [u, n] of Object.entries(counts)) {
    if ((attacker.army[u as CocUnitId] ?? 0) < (n ?? 0)) return fail(state, "You don't have those troops.");
  }

  // Mix in server-supplied entropy so the outcome can't be precomputed offline before deploying
  // (the deterministic part alone is public: tick + player ids). entropy defaults to 0 → the sim
  // stays fully deterministic for tests, fuzzing, bot raids, and replay (the resolved seed is
  // stored in the report and reused verbatim).
  const seed = ((state.tick + 1) * 2654435761 + fnv1a(playerId) + fnv1a(targetOwner) + (entropy >>> 0)) >>> 0;
  const result = resolveRaid(deploy, defender, seed);

  const lootGold = Math.min(defender.gold, result.loot.gold);
  const lootElixir = Math.min(defender.elixir, result.loot.elixir);

  const newAttackerArmy: Army = { ...attacker.army };
  for (const [u, n] of Object.entries(counts)) {
    if (n) newAttackerArmy[u as CocUnitId] = (newAttackerArmy[u as CocUnitId] ?? 0) - n;
  }
  const newAttacker: CocBase = {
    ...attacker,
    army: newAttackerArmy,
    gold: attacker.gold + lootGold,
    elixir: attacker.elixir + lootElixir,
    trophies: Math.max(0, attacker.trophies + result.trophies),
  };

  const shieldSecs = Math.min(SHIELD_MAX_SECS, Math.round(result.destructionPct * 100 * SHIELD_SECS_PER_PCT));
  const newDefender: CocBase = {
    ...defender,
    gold: defender.gold - lootGold,
    elixir: defender.elixir - lootElixir,
    trophies: Math.max(0, defender.trophies - result.trophies),
    shieldUntil: result.destructionPct > 0 ? state.tick + shieldSecs : defender.shieldUntil,
  };

  // $HEXAR reward for the attacker, scaled by stars — PAID FROM THE SEASON POOL (never minted).
  let next: CocWorld = { ...state, bases: { ...state.bases, [playerId]: newAttacker, [targetOwner]: newDefender } };
  next = payFromPool(next, playerId, result.stars * HEXAR_RAID_REWARD_PER_STAR).state;
  if (result.stars > 0) next = bumpObjectives(next, playerId, "raidWins", 1);

  return {
    state: next,
    report: {
      attacker: playerId,
      defender: targetOwner,
      tick: state.tick,
      stars: result.stars,
      destructionPct: result.destructionPct,
      loot: { gold: lootGold, elixir: lootElixir },
      trophies: result.trophies,
      deploy,
      seed,
    },
  };
}

function finishNow(state: CocWorld, playerId: string, key: string): CommandResult {
  const base = state.bases[playerId];
  const player = state.players[playerId];
  if (!base || !player) return fail(state, "You have no base.");
  const job = base.jobs.find((j) => j.tileKey === key);
  if (!job) return fail(state, "Nothing is building there.");
  const cost = finishCost(Math.max(0, job.finishesAtTick - state.tick));
  if (player.hexar < cost) return fail(state, `Not enough $HEXAR (need ${cost.toLocaleString()}).`);
  const buildings = { ...base.buildings };
  if (buildings[key]) buildings[key] = { ...buildings[key], level: job.toLevel };
  const newBase: CocBase = { ...base, buildings, jobs: base.jobs.filter((j) => j !== job) };
  return {
    state: {
      ...state,
      players: { ...state.players, [playerId]: { ...player, hexar: player.hexar - cost } },
      bases: { ...state.bases, [playerId]: newBase },
      seasonPool: (state.seasonPool ?? 0) + cost, // $HEXAR sink → treasury
    },
  };
}

function extendShield(state: CocWorld, playerId: string, hours: number): CommandResult {
  const base = state.bases[playerId];
  const player = state.players[playerId];
  if (!base || !player) return fail(state, "You have no base.");
  if (hours <= 0 || hours > 24) return fail(state, "Pick 1–24 hours.");
  const cost = Math.round(hours * HEXAR_SHIELD_PER_HOUR);
  if (player.hexar < cost) return fail(state, `Not enough $HEXAR (need ${cost.toLocaleString()}).`);
  const from = Math.max(state.tick, base.shieldUntil);
  return {
    state: {
      ...state,
      players: { ...state.players, [playerId]: { ...player, hexar: player.hexar - cost } },
      bases: { ...state.bases, [playerId]: { ...base, shieldUntil: from + hours * 3600 } },
      seasonPool: (state.seasonPool ?? 0) + cost, // $HEXAR sink → treasury
    },
  };
}

function createClan(state: CocWorld, playerId: string, name: string): CommandResult {
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  if (player.clanId) return fail(state, "Leave your current clan first.");
  const clean = name.trim();
  if (clean.length < 3 || clean.length > 24) return fail(state, "Clan name must be 3–24 characters.");
  const id = `clan${state.nextClanId}`;
  const clan: Clan = { id, name: clean, founder: playerId, members: [playerId] };
  return {
    state: {
      ...state,
      clans: { ...state.clans, [id]: clan },
      nextClanId: state.nextClanId + 1,
      players: { ...state.players, [playerId]: { ...player, clanId: id } },
    },
  };
}

function joinClan(state: CocWorld, playerId: string, clanId: string): CommandResult {
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  if (player.clanId) return fail(state, "Leave your current clan first.");
  const clan = state.clans[clanId];
  if (!clan) return fail(state, "No such clan.");
  if (clan.members.length >= CLAN_MAX_MEMBERS) return fail(state, "That clan is full.");
  return {
    state: {
      ...state,
      clans: { ...state.clans, [clanId]: { ...clan, members: [...clan.members, playerId] } },
      players: { ...state.players, [playerId]: { ...player, clanId } },
    },
  };
}

function leaveClan(state: CocWorld, playerId: string): CommandResult {
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  const clanId = player.clanId;
  if (!clanId || !state.clans[clanId]) return fail(state, "You are not in a clan.");
  const clan = state.clans[clanId];
  const members = clan.members.filter((m) => m !== playerId);
  const clans = { ...state.clans };
  if (members.length === 0) delete clans[clanId];
  else clans[clanId] = { ...clan, members, founder: clan.founder === playerId ? members[0] : clan.founder };
  return {
    state: { ...state, clans, players: { ...state.players, [playerId]: { ...player, clanId: null } } },
  };
}

function donateTroops(state: CocWorld, playerId: string, toOwner: string, army: Army): CommandResult {
  const donor = state.bases[playerId];
  const dp = state.players[playerId];
  const recip = state.bases[toOwner];
  const rp = state.players[toOwner];
  if (!donor || !dp) return fail(state, "You have no base.");
  if (!recip || !rp) return fail(state, "No such ally.");
  if (toOwner === playerId) return fail(state, "Donate to a clanmate, not yourself.");
  if (!dp.clanId || dp.clanId !== rp.clanId) return fail(state, "You can only donate to clanmates.");
  let housing = 0, total = 0;
  for (const [u, n] of Object.entries(army)) {
    if (!n) continue;
    if (n < 0) return fail(state, "Invalid donation.");
    if ((donor.army[u as CocUnitId] ?? 0) < n) return fail(state, "You don't have those troops.");
    housing += UNITS[u as CocUnitId].housing * n;
    total += n;
  }
  if (total <= 0) return fail(state, "Select troops to donate.");
  if (garrisonCap(recip) <= 0) return fail(state, "Your clanmate needs a Clan Castle.");
  if (garrisonUsed(recip) + housing > garrisonCap(recip)) return fail(state, "Your clanmate's Clan Castle is full.");
  const donorArmy: Army = { ...donor.army };
  const recipGarrison: Army = { ...recip.garrison };
  for (const [u, n] of Object.entries(army)) {
    if (!n) continue;
    donorArmy[u as CocUnitId] = (donorArmy[u as CocUnitId] ?? 0) - n;
    recipGarrison[u as CocUnitId] = (recipGarrison[u as CocUnitId] ?? 0) + n;
  }
  return {
    state: {
      ...state,
      bases: {
        ...state.bases,
        [playerId]: { ...donor, army: donorArmy },
        [toOwner]: { ...recip, garrison: recipGarrison },
      },
    },
  };
}

function claimObjective(state: CocWorld, playerId: string, id: string): CommandResult {
  const player = state.players[playerId];
  if (!player?.objectives) return fail(state, "No objectives.");
  const obj = player.objectives.find((o) => o.id === id);
  if (!obj) return fail(state, "No such objective.");
  if (obj.progress < obj.target) return fail(state, "Objective not complete.");
  if (obj.claimed) return fail(state, "Already claimed.");
  // pay the reward from the season pool, then rotate the slot to a fresh objective
  let next = payFromPool(state, playerId, obj.reward).state;
  const p2 = next.players[playerId];
  const objectives = p2.objectives!.map((o) => (o.id === id ? nextObjective(o) : o));
  next = { ...next, players: { ...next.players, [playerId]: { ...p2, objectives } } };
  return { state: next };
}

/** Withdraw in-game $HEXAR for on-chain payout. The real Solana transfer is treasury-side
 *  (see docs/runbooks/onchain-hexar-payout.md); here we only record the claimed amount. */
function claim(state: CocWorld, playerId: string, amount: number): CommandResult {
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  // Only $HEXAR earned from the season pool is withdrawable, capped at HEXAR_CLAIM_CAP per player.
  const amt = Math.min(claimableHexar(player), Math.max(0, Math.floor(amount)));
  if (amt <= 0) return fail(state, "Nothing to withdraw — only $HEXAR earned from raids and objectives can be claimed on-chain, up to the cap.");
  return { state: { ...state, players: { ...state.players, [playerId]: { ...player, hexar: player.hexar - amt, claimed: (player.claimed ?? 0) + amt } } } };
}

export function applyCommand(state: CocWorld, playerId: string, cmd: CocCommand, entropy = 0): CommandResult {
  switch (cmd.type) {
    case "claimBase":
      return claimBase(state, playerId, cmd.q, cmd.r);
    case "placeBuilding":
      return placeBuilding(state, playerId, cmd.tileKey, cmd.buildingId);
    case "upgradeBuilding":
      return upgradeBuilding(state, playerId, cmd.tileKey);
    case "moveBuilding":
      return moveBuilding(state, playerId, cmd.fromTile, cmd.toTile);
    case "collect":
      return collect(state, playerId);
    case "placeWall":
      return placeWall(state, playerId, cmd.tileKey);
    case "upgradeWall":
      return upgradeWall(state, playerId, cmd.tileKey);
    case "placeTrap":
      return placeTrap(state, playerId, cmd.tileKey, cmd.trapId);
    case "trainTroop":
      return trainTroop(state, playerId, cmd.unit);
    case "raid":
      return raid(state, playerId, cmd.targetOwner, cmd.deploy, entropy);
    case "finishNow":
      return finishNow(state, playerId, cmd.tileKey);
    case "extendShield":
      return extendShield(state, playerId, cmd.hours);
    case "createClan":
      return createClan(state, playerId, cmd.name);
    case "joinClan":
      return joinClan(state, playerId, cmd.clanId);
    case "leaveClan":
      return leaveClan(state, playerId);
    case "donateTroops":
      return donateTroops(state, playerId, cmd.toOwner, cmd.army);
    case "claimObjective":
      return claimObjective(state, playerId, cmd.id);
    case "claim":
      return claim(state, playerId, cmd.amount);
    default:
      return fail(state, "Unknown command.");
  }
}
