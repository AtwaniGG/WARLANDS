import { BUILDINGS, SEASON_LENGTH, SEASON_TROPHY_KEEP, SHIELD_MAX_SECS, SHIELD_SECS_PER_PCT } from "./config";
import { resolveRaid } from "./battle";
import { settleReferrals } from "./commands";
import type { Army, BattleReport, BuildJob, CocBase, CocWorld, Deployment, PlacedBuilding, TrainOrder } from "./types";

/** How often (ticks) the AI mounts a wave of raids on undefended live players. */
const RAID_INTERVAL = 200;
/** How often (ticks) we settle referral payouts for referees who crossed the conversion milestone. */
const REFERRAL_INTERVAL = 60;
const MAX_PENDING_REPORTS = 5;

function mulberry32(a: number): () => number {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function fnv1a(s: string): number { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function tickBase(base: CocBase, nextTick: number): CocBase {
  const buildings: Record<string, PlacedBuilding> = {};
  for (const [key, b] of Object.entries(base.buildings)) buildings[key] = { ...b };

  // Collectors accumulate into their buffer up to bufferCap.
  for (const b of Object.values(buildings)) {
    const def = BUILDINGS[b.id];
    if (def.category === "collector" && b.level >= 1) {
      const lv = def.levels[b.level - 1];
      const cap = lv?.bufferCap ?? 0;
      const rate = lv?.producePerTick ?? 0;
      b.buffer = Math.min(cap, (b.buffer ?? 0) + rate);
    }
  }

  // Jobs whose timer elapsed complete (set level) and free their builder.
  const jobs: BuildJob[] = [];
  for (const job of base.jobs) {
    if (nextTick >= job.finishesAtTick) {
      const b = buildings[job.tileKey];
      if (b) b.level = job.toLevel;
    } else {
      jobs.push(job);
    }
  }

  // Training queue: finished orders join the army.
  const army: Army = { ...base.army };
  const trainQueue: TrainOrder[] = [];
  for (const order of base.trainQueue) {
    if (nextTick >= order.finishesAtTick) army[order.unit] = (army[order.unit] ?? 0) + 1;
    else trainQueue.push(order);
  }

  return { ...base, buildings, jobs, army, trainQueue };
}

/**
 * Deterministic AI raid wave: every RAID_INTERVAL ticks, some bots raid out-of-shield live
 * players (real stakes — they lose stored loot, gain a shield, drop trophies) and a defense
 * report is queued for the victim. No-op when there are no bots (e.g. the test/fuzz worlds).
 */
function botRaidWave(state: CocWorld, bases: CocWorld["bases"], nextTick: number): { bases: CocWorld["bases"]; pendingReports: CocWorld["pendingReports"] } {
  const botIds = Object.keys(state.players).filter((id) => state.players[id]?.isBot);
  if (botIds.length === 0) return { bases, pendingReports: state.pendingReports };
  const rnd = mulberry32(((state.seed >>> 0) ^ (nextTick * 2654435761)) >>> 0);
  let outBases = bases;
  const pending: Record<string, BattleReport[]> = { ...(state.pendingReports ?? {}) };
  let changed = false;
  for (const [owner, base] of Object.entries(bases)) {
    if (state.players[owner]?.isBot) continue;        // only raid real players
    if (base.shieldUntil > nextTick) continue;          // shielded
    if (base.gold + base.elixir < 300) continue;        // nothing worth taking
    if (rnd() > 0.5) continue;                           // ~half of eligible victims per wave
    const atkId = botIds[Math.floor(rnd() * botIds.length)];
    const n = 12 + Math.floor((base.trophies ?? 0) / 15) + Math.floor(rnd() * 8);
    const deploy: Deployment[] = [];
    for (let i = 0; i < n; i++) deploy.push({ unit: i % 6 === 0 ? "gunship" : "grunt", x: i % 5, y: Math.floor(i / 5) });
    const seed = ((nextTick + 1) * 2654435761 + fnv1a(atkId) + fnv1a(owner)) >>> 0;
    const res = resolveRaid(deploy, base, seed);
    if (res.destructionPct <= 0) continue;
    const lootGold = Math.min(base.gold, res.loot.gold);
    const lootElixir = Math.min(base.elixir, res.loot.elixir);
    const shieldSecs = Math.min(SHIELD_MAX_SECS, Math.round(res.destructionPct * 100 * SHIELD_SECS_PER_PCT));
    const dropped = res.stars * 5;
    outBases = { ...outBases, [owner]: { ...base, gold: base.gold - lootGold, elixir: base.elixir - lootElixir, trophies: Math.max(0, (base.trophies ?? 0) - dropped), shieldUntil: nextTick + shieldSecs } };
    const report: BattleReport = { attacker: atkId, defender: owner, tick: nextTick, stars: res.stars, destructionPct: res.destructionPct, loot: { gold: lootGold, elixir: lootElixir }, trophies: -dropped, deploy, seed };
    pending[owner] = [...(pending[owner] ?? []), report].slice(-MAX_PENDING_REPORTS);
    changed = true;
  }
  return changed ? { bases: outBases, pendingReports: pending } : { bases, pendingReports: state.pendingReports };
}

export function applyTick(state: CocWorld): CocWorld {
  const nextTick = state.tick + 1;
  const bases: CocWorld["bases"] = {};
  for (const [owner, base] of Object.entries(state.bases)) {
    bases[owner] = tickBase(base, nextTick);
  }
  let next: CocWorld = { ...state, tick: nextTick, bases };
  if (nextTick % RAID_INTERVAL === 0) {
    const wave = botRaidWave(state, bases, nextTick);
    next = { ...next, bases: wave.bases, pendingReports: wave.pendingReports };
  }
  // Pay out referral rewards for any referee who has crossed the conversion milestone.
  if (nextTick % REFERRAL_INTERVAL === 0) next = settleReferrals(next);
  // season rollover: soft-reset trophies + start the next season
  if (next.season && nextTick >= next.season.endsAtTick) {
    const rolled: CocWorld["bases"] = {};
    for (const [owner, b] of Object.entries(next.bases)) rolled[owner] = { ...b, trophies: Math.floor((b.trophies ?? 0) * SEASON_TROPHY_KEEP) };
    next = { ...next, bases: rolled, season: { id: next.season.id + 1, endsAtTick: next.season.endsAtTick + SEASON_LENGTH } };
  }
  return next;
}
