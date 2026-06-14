// Balancing formulas — directly implements GDD §18.
// All constants are the "tuning seeds" from the GDD.

export const TUNING = {
  // §16.1 diminishing returns on the n-th plot
  DR_ALPHA: 0.12,
  // §16.2 super-linear upkeep growth per additional plot
  UPKEEP_BETA: 0.15,
  // §18.1 building level production growth
  LEVEL_GROWTH: 0.1,
  // upgrade cost growth per level
  UPGRADE_COST_GROWTH: 1.6,
  // §18.7 decay rates per day (we apply per-tick fractions)
  DECAY_PRODUCTION_RHO: 0.2,
  DECAY_DEFENSE_SIGMA: 0.3,
  // §9 bounded damage variance
  DAMAGE_VARIANCE: 0.15,
  // §9.4 / §18.5 win curve steepness + floor/ceiling
  WIN_K: 4,
  WIN_FLOOR: 0.05,
  WIN_CEIL: 0.95,
  // §16.5 loot efficiency falloff vs weaker targets
  LOOT_GAMMA: 0.25,
  LOOT_MIN: 0.2,
  // §18.12 specialization
  SPEC_MAX: 0.35,
  SPEC_Q: 1.2,
  // base upkeep (food+water) per building per tick
  BASE_UPKEEP: 0.4,
} as const;

/** §16.1 / §18.11 — diminishing returns for the n-th plot (1-indexed). */
export function diminishingReturns(plotIndex: number): number {
  return 1 / (1 + TUNING.DR_ALPHA * (plotIndex - 1));
}

/** §18.1 — building level production multiplier. */
export function levelMult(level: number): number {
  return 1 + TUNING.LEVEL_GROWTH * (level - 1);
}

/** Upgrade cost for taking a building from `level` to `level+1`, given its base cost. */
export function upgradeCost(baseCost: number, level: number): number {
  return Math.round(baseCost * Math.pow(TUNING.UPGRADE_COST_GROWTH, level - 1));
}

/**
 * §18.1 — Production per tick for an extractor.
 * Output = Base × Terrain × LevelMult × Workforce × (1 − congestion) × DR(plotIndex)
 */
export function productionPerTick(args: {
  base: number;
  terrainMult: number;
  level: number;
  workforceMult: number;
  plotIndex: number;
  congestion?: number;
}): number {
  const { base, terrainMult, level, workforceMult, plotIndex, congestion = 0 } = args;
  return (
    base *
    terrainMult *
    levelMult(level) *
    workforceMult *
    (1 - congestion) *
    diminishingReturns(plotIndex)
  );
}

/** §16.2 — total upkeep across n plots grows super-linearly. */
export function plotUpkeep(plotIndex: number, baseUpkeep = TUNING.BASE_UPKEEP): number {
  return baseUpkeep * (1 + TUNING.UPKEEP_BETA * (plotIndex - 1));
}

/** §18.12 — specialization bonus from focusing output on one product line. */
export function specializationBonus(focusRatio: number): number {
  return TUNING.SPEC_MAX * Math.pow(Math.min(Math.max(focusRatio, 0), 1), TUNING.SPEC_Q);
}

/** §9.4 / §18.5 — underdog-aware win probability. */
export function winProbability(args: {
  selfPower: number;
  enemyPower: number;
  counterFactor?: number; // [0.8, 1.4]
  terrainFactor?: number; // [0.85, 1.25]
  scoutFactor?: number; // [0.95, 1.15]
  commanderFactor?: number; // [0.9, 1.2]
}): number {
  const {
    selfPower,
    enemyPower,
    counterFactor = 1,
    terrainFactor = 1,
    scoutFactor = 1,
    commanderFactor = 1,
  } = args;
  const r = selfPower / Math.max(enemyPower, 1e-6);
  const rEff = r * counterFactor * terrainFactor * scoutFactor * commanderFactor;
  const p = 1 / (1 + Math.exp(-TUNING.WIN_K * (rEff - 1)));
  return Math.min(Math.max(p, TUNING.WIN_FLOOR), TUNING.WIN_CEIL);
}

/** §16.5 / §18.6 — loot efficiency falls off when smashing much weaker targets. */
export function lootEfficiency(attackerPower: number, defenderPower: number): number {
  const ratio = attackerPower / Math.max(defenderPower, 1e-6);
  return Math.min(Math.max(1 - TUNING.LOOT_GAMMA * (ratio - 1), TUNING.LOOT_MIN), 1);
}

/** §9.2 — bounded damage roll (deterministic if you pass a seeded rng in 0..1). */
export function damageRoll(base: number, rng: number): number {
  const v = TUNING.DAMAGE_VARIANCE;
  return base * (1 + (rng * 2 - 1) * v);
}
