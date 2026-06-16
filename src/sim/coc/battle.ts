import { BUILDINGS, LOOT_PCT, UNITS, WALL } from "./config";
import type { Army, CocBase, CocBuildingId, CocUnitId } from "./types";

export interface BattleResult {
  stars: number; // 0..3
  destructionPct: number; // 0..1 (fraction of structures destroyed)
  loot: { gold: number; elixir: number };
  trophies: number; // attacker delta
  structuresTotal: number;
  structuresDestroyed: number;
  ccDestroyed: boolean;
  ticks: number;
}

const BATTLE_TICK_CAP = 150;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function structureHp(id: CocBuildingId, level: number): number {
  const lv = BUILDINGS[id].levels[Math.max(0, level - 1)];
  if (lv?.hp) return lv.hp;
  if (id === "commandCenter") return 500 + level * 250;
  return 200 + level * 120; // collectors / storages
}

interface Struct {
  hp: number;
  isCC: boolean;
  dps: number;
  targetsAir: boolean;
  targetsGround: boolean;
}
interface Group {
  hpEach: number;
  dpsEach: number;
  flying: boolean;
  wallDpsEach: number;
  poolHp: number;
  count: number;
}

/** Focus damage onto groups in order; a group's count is its remaining pool hp / hp-each. */
function damageGroups(groups: Group[], dps: number): void {
  let d = dps;
  for (const g of groups) {
    if (d <= 0) break;
    if (g.count <= 0) continue;
    const applied = Math.min(g.poolHp, d);
    g.poolHp -= applied;
    d -= applied;
    g.count = Math.max(0, Math.ceil(g.poolHp / g.hpEach));
  }
}

/**
 * Pure, deterministic raid resolution. Ground troops are gated by walls (breachers
 * tear them down fast); flying troops ignore walls and are only hit by air defense.
 * Reproducible for a given (army, defender, seed).
 */
export function resolveRaid(army: Army, defender: CocBase, seed: number): BattleResult {
  const rnd = mulberry32(seed);

  const structs: Struct[] = [];
  for (const b of Object.values(defender.buildings)) {
    const def = BUILDINGS[b.id];
    const stat = def.levels[Math.max(0, b.level - 1)];
    const fires = def.category === "defense" && b.level >= 1;
    structs.push({
      hp: structureHp(b.id, Math.max(1, b.level)),
      isCC: b.id === "commandCenter",
      dps: fires ? stat?.dps ?? 0 : 0,
      targetsAir: fires ? stat?.targets === "air" || stat?.targets === "any" : false,
      targetsGround: fires ? stat?.targets === "ground" || stat?.targets === "any" : false,
    });
  }
  const totalStructures = structs.length;
  const empty = (): BattleResult => ({ stars: 0, destructionPct: 0, loot: { gold: 0, elixir: 0 }, trophies: -4, structuresTotal: totalStructures, structuresDestroyed: 0, ccDestroyed: false, ticks: 0 });
  if (totalStructures === 0) return { ...empty(), trophies: 0 };

  // deterministic focus order (seeded Fisher–Yates)
  const order = structs.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  let wallHp = 0;
  for (const lvl of Object.values(defender.walls)) wallHp += WALL.levels[lvl - 1]?.hp ?? 0;

  const groups: Group[] = [];
  for (const [u, n] of Object.entries(army)) {
    if (!n || n <= 0) continue;
    const d = UNITS[u as CocUnitId];
    groups.push({
      hpEach: d.hp,
      dpsEach: d.dps,
      flying: !!d.flying,
      wallDpsEach: d.favoriteTarget === "wall" ? d.dps * (d.wallMultiplier ?? 1) : 0,
      poolHp: d.hp * n,
      count: n,
    });
  }
  if (groups.length === 0) return empty();

  const aliveGroups = () => groups.filter((g) => g.count > 0);

  let ticks = 0;
  for (; ticks < BATTLE_TICK_CAP; ticks++) {
    const ag = aliveGroups();
    const aliveStructs = order.filter((i) => structs[i].hp > 0);
    if (ag.length === 0 || aliveStructs.length === 0) break;

    // defender fires
    let groundDps = 0, airDps = 0;
    for (const i of aliveStructs) {
      const s = structs[i];
      if (s.dps <= 0) continue;
      if (s.targetsGround) groundDps += s.dps;
      if (s.targetsAir) airDps += s.dps;
    }
    // ground defenses only hit ground troops; air defenses only hit flyers
    damageGroups(ag.filter((g) => !g.flying), groundDps);
    damageGroups(ag.filter((g) => g.flying), airDps);

    // attacker attacks
    const ag2 = aliveGroups();
    if (wallHp > 0) {
      let wd = 0;
      for (const g of ag2) wd += g.wallDpsEach * g.count;
      wallHp = Math.max(0, wallHp - wd);
    }
    const groundPenalty = wallHp > 0 ? 0.4 : 1;
    let bDps = 0;
    for (const g of ag2) bDps += g.dpsEach * g.count * (g.flying ? 1 : groundPenalty);
    let dmg = bDps;
    for (const i of order) {
      if (dmg <= 0) break;
      const s = structs[i];
      if (s.hp <= 0) continue;
      const applied = Math.min(s.hp, dmg);
      s.hp -= applied;
      dmg -= applied;
    }
  }

  const destroyed = structs.filter((s) => s.hp <= 0).length;
  const ccDestroyed = structs.some((s) => s.isCC && s.hp <= 0);
  const pct = destroyed / totalStructures;
  let stars = 0;
  if (pct >= 0.5) stars++;
  if (ccDestroyed) stars++;
  if (destroyed >= totalStructures) stars++;
  const lootFactor = LOOT_PCT * pct;
  const loot = { gold: Math.floor(defender.gold * lootFactor), elixir: Math.floor(defender.elixir * lootFactor) };
  const trophies = stars > 0 ? stars * 8 : -4;
  return { stars, destructionPct: pct, loot, trophies, structuresTotal: totalStructures, structuresDestroyed: destroyed, ccDestroyed, ticks };
}
