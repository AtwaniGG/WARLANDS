import { PLOT_TYPES } from "@/game/plotTypes";
import { BUILDINGS, isBuildingAllowedOnTerrain } from "@/game/buildings";
import { hexKey } from "@/game/world";
import { upgradeCost } from "@/game/formulas";
import { UNITS, UNIT_IDS, armySize, type Army } from "@/game/units";
import { resolveBattle, type BattleIntent } from "@/game/combat";
import { MARKET_FEE, LISTING_FEE, round2 } from "@/game/market";
import { ALLEGIANCE_BUILDINGS, type AllegianceBuildingId } from "@/game/allegiance";
import { storageCap } from "./world";
import { allegianceBuffs, CREATE_ALLEGIANCE_COST } from "./allegiance";
import type { ResourceBag, ResourceId } from "@/game/resources";
import type { Allegiance, Command, CommandResult, MarketOrder, PlacedBuilding, SimPlayer, SimPlot, WorldState } from "./types";

function hasResources(bag: ResourceBag, cost: Partial<Record<ResourceId, number>>): boolean {
  return Object.entries(cost).every(([k, v]) => (bag[k as ResourceId] ?? 0) >= (v ?? 0));
}
function spendResources(bag: ResourceBag, cost: Partial<Record<ResourceId, number>>): void {
  for (const [k, v] of Object.entries(cost)) bag[k as ResourceId] = (bag[k as ResourceId] ?? 0) - (v ?? 0);
}
function fail(state: WorldState, error: string): CommandResult {
  return { state, error };
}

function stake(state: WorldState, playerId: string, q: number, r: number): CommandResult {
  const key = hexKey(q, r);
  if (state.plots[key]) return fail(state, "Hex already claimed.");
  const hex = state.hexes[key];
  if (!hex) return fail(state, "No such hex.");
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  const def = PLOT_TYPES[hex.terrain];
  if (player.war < def.stake) return fail(state, `Not enough $WAR (need ${def.stake.toLocaleString()}).`);
  const claimIndex = Object.values(state.plots).filter((p) => p.owner === playerId).length + 1;
  const plot: SimPlot = {
    q,
    r,
    terrain: hex.terrain,
    owner: playerId,
    claimIndex,
    stakeLocked: def.stake,
    buildings: [{ id: "camp", level: 1 }],
    resources: { food: 100, water: 100, wood: 100, stone: 100 },
    army: {},
    trainQueue: [],
    defensePct: 1,
  };
  return {
    state: {
      ...state,
      plots: { ...state.plots, [key]: plot },
      players: { ...state.players, [playerId]: { ...player, war: player.war - def.stake } },
    },
  };
}

function build(state: WorldState, playerId: string, key: string, buildingId: PlacedBuilding["id"]): CommandResult {
  const plot = state.plots[key];
  if (!plot) return fail(state, "No plot there.");
  if (plot.owner !== playerId) return fail(state, "Not your plot.");
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  const def = BUILDINGS[buildingId];
  if (!isBuildingAllowedOnTerrain(def, PLOT_TYPES[plot.terrain].produces)) {
    return fail(state, `Can't build ${def.name} on ${plot.terrain}.`);
  }
  const camp = plot.buildings.find((b) => b.id === "camp");
  const slotCap = 3 + (camp?.level ?? 1) * 2;
  if (plot.buildings.filter((b) => b.id !== "camp").length >= slotCap) return fail(state, "No free building slots.");
  if (player.war < def.baseCost) return fail(state, `Need ${def.baseCost.toLocaleString()} $WAR.`);
  if (!hasResources(plot.resources, def.baseResourceCost)) return fail(state, `Missing resources for ${def.name}.`);
  const resources = { ...plot.resources };
  spendResources(resources, def.baseResourceCost);
  const placed: PlacedBuilding = {
    id: buildingId,
    level: 1,
    activeProduct: def.kind === "factory" ? def.makes?.[0] : undefined,
  };
  const updated: SimPlot = { ...plot, resources, buildings: [...plot.buildings, placed] };
  return {
    state: {
      ...state,
      plots: { ...state.plots, [key]: updated },
      players: { ...state.players, [playerId]: { ...player, war: player.war - def.baseCost } },
    },
  };
}

function ownedPlot(state: WorldState, playerId: string, key: string): { plot: SimPlot } | { fail: CommandResult } {
  const plot = state.plots[key];
  if (!plot) return { fail: fail(state, "No plot there.") };
  if (plot.owner !== playerId) return { fail: fail(state, "Not your plot.") };
  return { plot };
}

function upgrade(state: WorldState, playerId: string, key: string, index: number): CommandResult {
  const got = ownedPlot(state, playerId, key);
  if ("fail" in got) return got.fail;
  const plot = got.plot;
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  const b = plot.buildings[index];
  if (!b) return fail(state, "No building at that slot.");
  const def = BUILDINGS[b.id];
  if (b.level >= def.maxLevel) return fail(state, `${def.name} is already max level.`);
  const cost = upgradeCost(def.baseCost || 200, b.level + 1);
  if (player.war < cost) return fail(state, `Need ${cost.toLocaleString()} $WAR to upgrade ${def.name}.`);
  const buildings = plot.buildings.map((x, i) => (i === index ? { ...x, level: x.level + 1 } : x));
  return {
    state: {
      ...state,
      plots: { ...state.plots, [key]: { ...plot, buildings } },
      players: { ...state.players, [playerId]: { ...player, war: player.war - cost } },
    },
  };
}

function setProduct(state: WorldState, playerId: string, key: string, index: number, product: ResourceId): CommandResult {
  const got = ownedPlot(state, playerId, key);
  if ("fail" in got) return got.fail;
  const plot = got.plot;
  const b = plot.buildings[index];
  if (!b) return fail(state, "No building at that slot.");
  const def = BUILDINGS[b.id];
  if (def.kind !== "factory") return fail(state, `${def.name} is not a factory.`);
  if (!def.makes?.includes(product)) return fail(state, `${def.name} can't make that.`);
  const buildings = plot.buildings.map((x, i) => (i === index ? { ...x, activeProduct: product } : x));
  return { state: { ...state, plots: { ...state.plots, [key]: { ...plot, buildings } } } };
}

function unstake(state: WorldState, playerId: string, key: string): CommandResult {
  const got = ownedPlot(state, playerId, key);
  if ("fail" in got) return got.fail;
  const plot = got.plot;
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  const fee = Math.round(plot.stakeLocked * 0.03); // §4.1 early-unstake sink
  const plots = { ...state.plots };
  delete plots[key];
  return {
    state: {
      ...state,
      plots,
      players: { ...state.players, [playerId]: { ...player, war: player.war + plot.stakeLocked - fee } },
      burned: (state.burned ?? 0) + fee,
    },
  };
}

function train(state: WorldState, playerId: string, key: string, unit: keyof typeof UNITS): CommandResult {
  const got = ownedPlot(state, playerId, key);
  if ("fail" in got) return got.fail;
  const plot = got.plot;
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  const u = UNITS[unit];
  if (player.war < u.costWar) return fail(state, `Need ${u.costWar} $WAR to train ${u.name}.`);
  if (!hasResources(plot.resources, u.cost)) return fail(state, `Missing resources to train ${u.name}.`);
  const resources = { ...plot.resources };
  spendResources(resources, u.cost);
  const trainQueue = [...plot.trainQueue, { unit, ticksLeft: u.trainTicks }];
  return {
    state: {
      ...state,
      plots: { ...state.plots, [key]: { ...plot, resources, trainQueue } },
      players: { ...state.players, [playerId]: { ...player, war: player.war - u.costWar } },
      burned: (state.burned ?? 0) + Math.round(u.costWar * 0.5), // §13 #7 training fee sink
    },
  };
}

function raid(state: WorldState, playerId: string, fromKey: string, targetKey: string, army: Army, intent: BattleIntent): CommandResult {
  const fromGot = ownedPlot(state, playerId, fromKey);
  if ("fail" in fromGot) return fromGot.fail;
  const from = fromGot.plot;
  const target = state.plots[targetKey];
  if (!target) return fail(state, "No target plot there.");
  if (target.owner === playerId) return fail(state, "Can't raid your own plot.");
  if (armySize(army) === 0) return fail(state, "Select units to send.");
  for (const id of UNIT_IDS) {
    if ((army[id] ?? 0) > (from.army[id] ?? 0)) return fail(state, "You don't have those units.");
  }

  const terrain = PLOT_TYPES[target.terrain];
  const result = resolveBattle({
    seed: (state.tick + 1) * 2654435761 + target.q * 40503 + target.r,
    intent,
    attacker: army,
    defender: target.army,
    terrainFactor: terrain.defenseMult,
    scoutFactor: 1,
    commanderFactor: 1,
    defenderStock: target.resources,
    defensePct: target.defensePct ?? 1,
  });

  // attacker plot: remove sent units, return survivors, add loot
  const fromArmy: Army = { ...from.army };
  for (const id of UNIT_IDS) {
    fromArmy[id] = (fromArmy[id] ?? 0) - (army[id] ?? 0) + (result.attackerSurvivors[id] ?? 0);
    if (!fromArmy[id]) delete fromArmy[id];
  }
  const fromResources = { ...from.resources };
  const cap = storageCap(from);
  for (const [k, v] of Object.entries(result.loot)) addRes(fromResources, k as ResourceId, v as number, cap);

  // defender plot: surviving army, looted resources removed, defense damaged on a win
  const targetResources = { ...target.resources };
  for (const [k, v] of Object.entries(result.loot)) {
    targetResources[k as ResourceId] = Math.max(0, (targetResources[k as ResourceId] ?? 0) - (v as number));
  }
  const targetDefense = result.attackerWins ? Math.max(0.3, (target.defensePct ?? 1) - 0.4) : (target.defensePct ?? 1);

  const plots = {
    ...state.plots,
    [fromKey]: { ...from, army: fromArmy, resources: fromResources },
    [targetKey]: { ...target, army: result.defenderSurvivors, resources: targetResources, defensePct: targetDefense },
  };

  return {
    state: { ...state, plots },
    report: { result, attackerKey: fromKey, targetKey, tick: state.tick },
  };
}

function addRes(bag: ResourceBag, id: ResourceId, amount: number, cap: number): void {
  bag[id] = Math.min(cap, (bag[id] ?? 0) + amount);
}

// ---------- Marketplace (GDD §7) — shared player order book ----------

function list(state: WorldState, playerId: string, key: string, item: ResourceId, qty: number, price: number): CommandResult {
  const got = ownedPlot(state, playerId, key);
  if ("fail" in got) return got.fail;
  const plot = got.plot;
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  if (qty <= 0 || price <= 0) return fail(state, "Invalid listing.");
  if ((plot.resources[item] ?? 0) < qty) return fail(state, `Not enough ${item} to list ${qty}.`);
  if (player.war < LISTING_FEE) return fail(state, `Need ${LISTING_FEE} $WAR listing fee.`);

  const resources = { ...plot.resources, [item]: (plot.resources[item] ?? 0) - qty }; // escrow into order
  const order: MarketOrder = { id: `m-${state.market.nextOrderId}`, item, qty, price: round2(price), owner: playerId };
  return {
    state: {
      ...state,
      plots: { ...state.plots, [key]: { ...plot, resources } },
      players: { ...state.players, [playerId]: { ...player, war: player.war - LISTING_FEE } },
      burned: (state.burned ?? 0) + LISTING_FEE, // §13 #10 listing fee sink
      market: { ...state.market, book: [...state.market.book, order], nextOrderId: state.market.nextOrderId + 1 },
    },
  };
}

function buy(state: WorldState, playerId: string, item: ResourceId, qty: number, toKey: string): CommandResult {
  const got = ownedPlot(state, playerId, toKey);
  if ("fail" in got) return got.fail;
  const dest = got.plot;
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  if (qty <= 0) return fail(state, "Invalid quantity.");

  // cap fill to the destination plot's free capacity for this item
  const space = Math.floor(storageCap(dest) - (dest.resources[item] ?? 0));
  let remaining = Math.min(qty, space);
  if (remaining <= 0) return fail(state, "No storage space for that item.");

  // sweep cheapest sell orders that aren't your own
  const sells = state.market.book
    .filter((o) => o.item === item && o.owner !== playerId)
    .sort((a, b) => a.price - b.price);

  let cost = 0;
  const proceeds: Record<string, number> = {};
  const filledIds = new Map<string, number>(); // orderId -> qty taken
  for (const o of sells) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, o.qty);
    cost += take * o.price;
    proceeds[o.owner] = (proceeds[o.owner] ?? 0) + take * o.price;
    filledIds.set(o.id, take);
    remaining -= take;
  }
  const filled = Math.min(qty, space) - remaining;
  if (filled <= 0) return fail(state, "No sell liquidity for that item.");

  const feeDiscount = allegianceBuffs(state, playerId).marketFee; // tradeHub buff
  const fee = Math.ceil(cost * MARKET_FEE * (1 - feeDiscount));
  const total = Math.ceil(cost) + fee;
  if (player.war < total) return fail(state, `Need ${total.toLocaleString()} $WAR (incl. ${fee} fee).`);

  // pay sellers, deduct buyer, deposit goods, burn fee, shrink book
  const players: Record<string, SimPlayer> = { ...state.players, [playerId]: { ...player, war: player.war - total } };
  for (const [seller, amt] of Object.entries(proceeds)) {
    const sp = players[seller];
    if (sp) players[seller] = { ...sp, war: sp.war + Math.floor(amt) };
  }
  const resources = { ...dest.resources };
  addRes(resources, item, filled, storageCap(dest));
  const book = state.market.book
    .map((o) => (filledIds.has(o.id) ? { ...o, qty: o.qty - filledIds.get(o.id)! } : o))
    .filter((o) => o.qty > 0);

  return {
    state: {
      ...state,
      plots: { ...state.plots, [toKey]: { ...dest, resources } },
      players,
      burned: (state.burned ?? 0) + fee,
      market: { ...state.market, book },
    },
  };
}

function cancel(state: WorldState, playerId: string, orderId: string, toKey: string): CommandResult {
  const order = state.market.book.find((o) => o.id === orderId);
  if (!order) return fail(state, "No such order.");
  if (order.owner !== playerId) return fail(state, "Not your order.");
  const got = ownedPlot(state, playerId, toKey);
  if ("fail" in got) return got.fail;
  const dest = got.plot;
  const resources = { ...dest.resources };
  addRes(resources, order.item, order.qty, storageCap(dest)); // return escrowed goods
  return {
    state: {
      ...state,
      plots: { ...state.plots, [toKey]: { ...dest, resources } },
      market: { ...state.market, book: state.market.book.filter((o) => o.id !== orderId) },
    },
  };
}

// ---------- Allegiances (GDD §10-11) ----------

function found(state: WorldState, playerId: string, name: string): CommandResult {
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  if (player.allegianceId) return fail(state, "Leave your current allegiance first.");
  const clean = name.trim().slice(0, 32);
  if (!clean) return fail(state, "Name required.");
  if (player.war < CREATE_ALLEGIANCE_COST) return fail(state, `Need ${CREATE_ALLEGIANCE_COST.toLocaleString()} $WAR to found an allegiance.`);
  const id = `a-${state.nextAllegianceId}`;
  const seed = Math.floor(CREATE_ALLEGIANCE_COST / 2); // half seeds the treasury, half is a sink
  const ally: Allegiance = {
    id,
    name: clean,
    founder: playerId,
    members: [playerId],
    treasuryWar: seed,
    contributions: { [playerId]: seed },
    buildings: ["hq"],
  };
  return {
    state: {
      ...state,
      players: { ...state.players, [playerId]: { ...player, war: player.war - CREATE_ALLEGIANCE_COST, allegianceId: id } },
      allegiances: { ...state.allegiances, [id]: ally },
      nextAllegianceId: state.nextAllegianceId + 1,
      burned: (state.burned ?? 0) + (CREATE_ALLEGIANCE_COST - seed),
    },
  };
}

function joinAllegiance(state: WorldState, playerId: string, id: string): CommandResult {
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  if (player.allegianceId) return fail(state, "Leave your current allegiance first.");
  const ally = state.allegiances[id];
  if (!ally) return fail(state, "No such allegiance.");
  const updated: Allegiance = { ...ally, members: [...ally.members, playerId], contributions: { ...ally.contributions, [playerId]: 0 } };
  return {
    state: {
      ...state,
      players: { ...state.players, [playerId]: { ...player, allegianceId: id } },
      allegiances: { ...state.allegiances, [id]: updated },
    },
  };
}

function leaveAllegiance(state: WorldState, playerId: string): CommandResult {
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  const id = player.allegianceId;
  if (!id || !state.allegiances[id]) return fail(state, "You're not in an allegiance.");
  const ally = state.allegiances[id];
  const members = ally.members.filter((m) => m !== playerId);
  const contributions = { ...ally.contributions };
  delete contributions[playerId];
  const allegiances = { ...state.allegiances };
  if (members.length === 0) {
    delete allegiances[id]; // last one out disbands it
  } else {
    allegiances[id] = { ...ally, members, contributions, founder: ally.founder === playerId ? members[0] : ally.founder };
  }
  return {
    state: {
      ...state,
      players: { ...state.players, [playerId]: { ...player, allegianceId: null } },
      allegiances,
    },
  };
}

function contribute(state: WorldState, playerId: string, amount: number): CommandResult {
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  const id = player.allegianceId;
  if (!id || !state.allegiances[id]) return fail(state, "You're not in an allegiance.");
  if (amount <= 0) return fail(state, "Invalid amount.");
  if (player.war < amount) return fail(state, "Not enough $WAR.");
  const ally = state.allegiances[id];
  const updated: Allegiance = {
    ...ally,
    treasuryWar: ally.treasuryWar + amount,
    contributions: { ...ally.contributions, [playerId]: (ally.contributions[playerId] ?? 0) + amount },
  };
  return {
    state: {
      ...state,
      players: { ...state.players, [playerId]: { ...player, war: player.war - amount } },
      allegiances: { ...state.allegiances, [id]: updated },
    },
  };
}

function allegianceBuild(state: WorldState, playerId: string, buildingId: AllegianceBuildingId): CommandResult {
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  const id = player.allegianceId;
  if (!id || !state.allegiances[id]) return fail(state, "You're not in an allegiance.");
  const ally = state.allegiances[id];
  if (ally.founder !== playerId) return fail(state, "Only the founder can build (for now).");
  const def = ALLEGIANCE_BUILDINGS[buildingId];
  if (!def) return fail(state, "No such building.");
  if (ally.buildings.includes(buildingId)) return fail(state, `${def.name} already built.`);
  if (ally.treasuryWar < def.cost) return fail(state, `Treasury needs ${def.cost.toLocaleString()} $WAR for ${def.name}.`);
  const updated: Allegiance = { ...ally, treasuryWar: ally.treasuryWar - def.cost, buildings: [...ally.buildings, buildingId] };
  return {
    state: {
      ...state,
      allegiances: { ...state.allegiances, [id]: updated },
      burned: (state.burned ?? 0) + def.cost, // treasury spend leaves circulation
    },
  };
}

export function applyCommand(state: WorldState, playerId: string, cmd: Command): CommandResult {
  switch (cmd.type) {
    case "stake":
      return stake(state, playerId, cmd.q, cmd.r);
    case "build":
      return build(state, playerId, cmd.key, cmd.buildingId);
    case "upgrade":
      return upgrade(state, playerId, cmd.key, cmd.index);
    case "setProduct":
      return setProduct(state, playerId, cmd.key, cmd.index, cmd.product);
    case "unstake":
      return unstake(state, playerId, cmd.key);
    case "train":
      return train(state, playerId, cmd.key, cmd.unit);
    case "raid":
      return raid(state, playerId, cmd.fromKey, cmd.targetKey, cmd.army, cmd.intent);
    case "list":
      return list(state, playerId, cmd.key, cmd.item, cmd.qty, cmd.price);
    case "buy":
      return buy(state, playerId, cmd.item, cmd.qty, cmd.toKey);
    case "cancel":
      return cancel(state, playerId, cmd.orderId, cmd.toKey);
    case "found":
      return found(state, playerId, cmd.name);
    case "joinAllegiance":
      return joinAllegiance(state, playerId, cmd.id);
    case "leaveAllegiance":
      return leaveAllegiance(state, playerId);
    case "contribute":
      return contribute(state, playerId, cmd.amount);
    case "allegianceBuild":
      return allegianceBuild(state, playerId, cmd.buildingId);
    default:
      return fail(state, "Unknown command.");
  }
}
