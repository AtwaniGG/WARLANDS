// Battle resolution — mirrors GDD §8.6 (rounds), §9 (controlled RNG), §18.4-18.6.
// Deterministic given a seed: reproducible/auditable battle logs.

import {
  UNITS, UNIT_IDS, COUNTER, type Army,
  armyPower, armySize, counterFactor,
} from "./units";
import { winProbability, lootEfficiency, damageRoll, TUNING } from "./formulas";
import type { ResourceBag, ResourceId } from "./resources";

// --- tiny seeded PRNG (mulberry32) so battles are reproducible ---
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type BattleIntent = "raid" | "siege" | "scout";

export interface BattleInput {
  seed: number;
  intent: BattleIntent;
  attacker: Army;
  defender: Army;
  /** defender terrain multiplier (TerrainFactor band 0.85..1.25) */
  terrainFactor: number;
  /** scouting edge (0.95..1.15) */
  scoutFactor?: number;
  commanderFactor?: number;
  /** defender's lootable stockpile */
  defenderStock?: ResourceBag;
  /** defender plot defense health 0..1 */
  defensePct?: number;
}

export interface RoundLog {
  round: number;
  note: string;
  attackerSize: number;
  defenderSize: number;
}

export interface BattleResult {
  attackerWins: boolean;
  winChance: number;
  rounds: RoundLog[];
  attackerLosses: Army;
  defenderLosses: Army;
  attackerSurvivors: Army;
  defenderSurvivors: Army;
  loot: ResourceBag;
  summary: string;
}

function cloneArmy(a: Army): Army {
  const c: Army = {};
  for (const id of UNIT_IDS) if (a[id]) c[id] = a[id];
  return c;
}

/** Apply `dmg` total HP damage to an army, removing whole units; returns units lost. */
function applyDamage(army: Army, dmg: number): Army {
  const lost: Army = {};
  // distribute damage proportionally to each type's share of the HP pool
  let pool = 0;
  for (const id of UNIT_IDS) pool += (army[id] ?? 0) * UNITS[id].hp;
  if (pool <= 0) return lost;
  for (const id of UNIT_IDS) {
    const n = army[id] ?? 0;
    if (!n) continue;
    const share = (n * UNITS[id].hp) / pool;
    const hpDmg = dmg * share;
    const unitsLost = Math.min(n, Math.floor(hpDmg / UNITS[id].hp));
    if (unitsLost > 0) {
      army[id] = n - unitsLost;
      lost[id] = (lost[id] ?? 0) + unitsLost;
    }
  }
  return lost;
}

function mergeArmy(into: Army, add: Army) {
  for (const id of UNIT_IDS) if (add[id]) into[id] = (into[id] ?? 0) + (add[id] ?? 0);
}

/** Effective per-side damage output for one round, including counters + RNG. */
function roundDamage(att: Army, def: Army, rng: () => number, terrainMult = 1): number {
  let total = 0;
  const defTotal = armySize(def);
  for (const a of UNIT_IDS) {
    const n = att[a] ?? 0;
    if (!n) continue;
    // average counter mult vs current defender composition
    let cm = 1;
    if (defTotal > 0) {
      cm = 0;
      for (const d of UNIT_IDS) {
        const dn = def[d] ?? 0;
        if (dn) cm += COUNTER[a][d] * (dn / defTotal);
      }
    }
    const base = n * UNITS[a].attack * cm * terrainMult;
    total += damageRoll(base, rng());
  }
  return total;
}

export function resolveBattle(input: BattleInput): BattleResult {
  const {
    seed, intent, terrainFactor, scoutFactor = 1, commanderFactor = 1,
    defenderStock = {}, defensePct = 1,
  } = input;
  const rng = makeRng(seed);

  const attacker = cloneArmy(input.attacker);
  const defender = cloneArmy(input.defender);
  const attStart = cloneArmy(attacker);
  const defStart = cloneArmy(defender);

  // §18.5 pre-battle win chance estimate (for display & morale)
  const cf = counterFactor(attacker, defender);
  const winChance = winProbability({
    selfPower: armyPower(attacker, "attack"),
    enemyPower: armyPower(defender, "defense") * (1 + 0.3 * defensePct),
    counterFactor: cf,
    terrainFactor,
    scoutFactor,
    commanderFactor,
  });

  const rounds: RoundLog[] = [];
  const attLossTotal: Army = {};
  const defLossTotal: Army = {};

  const maxRounds = intent === "siege" ? 8 : 5; // sieges run longer -> skill dominates (§9.5)
  // defender benefits from terrain on their damage too
  const defenderTerrain = 1 + (terrainFactor - 1) * 0.5;

  for (let r = 1; r <= maxRounds; r++) {
    if (armySize(attacker) === 0 || armySize(defender) === 0) break;

    const attDmg = roundDamage(attacker, defender, rng);
    const defDmg = roundDamage(defender, attacker, rng, defenderTerrain) * (0.7 + 0.6 * defensePct);

    const defLost = applyDamage(defender, attDmg);
    const attLost = applyDamage(attacker, defDmg);
    mergeArmy(defLossTotal, defLost);
    mergeArmy(attLossTotal, attLost);

    rounds.push({
      round: r,
      note: `Atk dealt ${Math.round(attDmg)} dmg, Def dealt ${Math.round(defDmg)} dmg`,
      attackerSize: armySize(attacker),
      defenderSize: armySize(defender),
    });
  }

  const attackerWins = armySize(defender) === 0 && armySize(attacker) > 0;

  // §18.6 loot — only on a successful raid/siege, scaled by loot efficiency
  const loot: ResourceBag = {};
  if (attackerWins && (intent === "raid" || intent === "siege")) {
    const eff = lootEfficiency(
      armyPower(attStart, "attack"),
      Math.max(1, armyPower(defStart, "defense")),
    );
    const cap = armySize(attStart) * 60; // carry capacity
    let carried = 0;
    for (const k of Object.keys(defenderStock) as ResourceId[]) {
      if (carried >= cap) break;
      const protectedShare = 0.25; // vault protects 25%
      const available = (defenderStock[k] ?? 0) * (1 - protectedShare) * eff;
      const take = Math.min(available, cap - carried);
      if (take > 1) {
        loot[k] = Math.floor(take);
        carried += take;
      }
    }
  }

  const summary = attackerWins
    ? `Victory! Attacker overran the defenses${Object.keys(loot).length ? " and looted resources." : "."}`
    : armySize(attacker) === 0
      ? "Defeat. The attacking force was annihilated."
      : "Repelled. Defenders held the line; attacker withdrew.";

  return {
    attackerWins,
    winChance,
    rounds,
    attackerLosses: attLossTotal,
    defenderLosses: defLossTotal,
    attackerSurvivors: attacker,
    defenderSurvivors: defender,
    loot,
    summary,
  };
}

export { TUNING };
