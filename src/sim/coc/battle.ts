import { BUILDINGS, LOOT_PCT, TRAPS, UNITS, WALL, GRID_W, GRID_H } from "./config";
import { footprintTiles } from "./world";
import type { Army, CocBase, CocBuildingId, CocTrapId, CocUnitId, Deployment } from "./types";

// ---- battle tuning ----
const BATTLE_TICKS = 180;
const RETARGET_EVERY = 8;
const FRAME_EVERY = 2;
const SPLASH_R = 1.6;
const AGGRO_R = 3.5; // attacker troops break off to fight nearby garrison defenders
/** per-unit attack range (tiles, Chebyshev) and move speed (tiles/tick). */
const ATTACK_RANGE: Record<CocUnitId, number> = { grunt: 1, marksman: 4, breacher: 1, juggernaut: 1, gunship: 3 };
const MOVE_SPEED: Record<CocUnitId, number> = { grunt: 1.0, marksman: 0.9, breacher: 1.1, juggernaut: 0.7, gunship: 1.2 };

export interface BattleFrame {
  t: number;
  troops: { x: number; y: number; unit: CocUnitId; side: "atk" | "def"; alive: boolean }[];
  structures: { key: string; hp: number; max: number }[];
  walls: { key: string; hp: number }[];
  traps: { key: string; armed: boolean }[];
}

export interface BattleResult {
  stars: number; // 0..3
  destructionPct: number; // 0..1 (fraction of structures destroyed)
  loot: { gold: number; elixir: number };
  trophies: number; // attacker delta
  structuresTotal: number;
  structuresDestroyed: number;
  ccDestroyed: boolean;
  ticks: number;
  frames?: BattleFrame[];
}

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
  key: string; isCC: boolean; isClanCastle: boolean;
  hp: number; maxHp: number;
  tiles: [number, number][]; cx: number; cy: number; rank: number;
  dps: number; range: number; targetsAir: boolean; targetsGround: boolean; splash: boolean;
}
interface Wall { key: string; x: number; y: number; hp: number; }
interface Trap { key: string; x: number; y: number; target: "ground" | "air"; damage: number; radius: number; armed: boolean; }
interface Troop {
  unit: CocUnitId; side: "atk" | "def";
  x: number; y: number; hp: number; flying: boolean;
  range: number; speed: number; dps: number; wallDps: number;
  alive: boolean;
  target: { kind: "struct" | "wall"; idx: number } | null;
  path: [number, number][]; retargetAt: number;
}

const cheb = (ax: number, ay: number, bx: number, by: number) => Math.max(Math.abs(ax - bx), Math.abs(ay - by));
const eucl = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

function distToStruct(x: number, y: number, s: Struct): number {
  let best = Infinity;
  for (const [tx, ty] of s.tiles) best = Math.min(best, cheb(x, y, tx, ty));
  return best;
}

/**
 * Pure, deterministic positional raid resolution on the defender's grid. Ground troops path
 * around walls/buildings (BFS) and break walls when boxed in; flyers ignore both. Hidden traps
 * detonate on matching troops, and Clan Castle garrison troops spawn to defend. Reproducible for
 * a given (deploy, defender, seed).
 */
export function resolveRaid(deploy: Deployment[], defender: CocBase, seed: number, opts?: { frames?: boolean }): BattleResult {
  const rnd = mulberry32(seed);
  const wantFrames = !!opts?.frames;

  // ---- structures ----
  const structs: Struct[] = [];
  let clanCastle: Struct | null = null;
  for (const [key, b] of Object.entries(defender.buildings)) {
    const def = BUILDINGS[b.id];
    const stat = def.levels[Math.max(0, b.level - 1)];
    const fires = def.category === "defense" && b.level >= 1;
    const tiles = footprintTiles(key, b.id).map((t) => t.split(",").map(Number) as [number, number]);
    let cx = 0, cy = 0;
    for (const [tx, ty] of tiles) { cx += tx; cy += ty; }
    cx /= tiles.length; cy /= tiles.length;
    const s: Struct = {
      key, isCC: b.id === "commandCenter", isClanCastle: b.id === "clanCastle",
      hp: structureHp(b.id, Math.max(1, b.level)), maxHp: structureHp(b.id, Math.max(1, b.level)),
      tiles, cx, cy, rank: 0,
      dps: fires ? stat?.dps ?? 0 : 0,
      range: fires ? stat?.range ?? 0 : 0,
      targetsAir: fires ? stat?.targets === "air" || stat?.targets === "any" : false,
      targetsGround: fires ? stat?.targets === "ground" || stat?.targets === "any" : false,
      splash: fires ? !!stat?.splash : false,
    };
    structs.push(s);
    if (s.isClanCastle && b.level >= 1) clanCastle = s;
  }
  const totalStructures = structs.length;
  const order = structs.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  order.forEach((sIdx, rank) => { structs[sIdx].rank = rank; });

  const empty = (trophies: number): BattleResult => ({ stars: 0, destructionPct: 0, loot: { gold: 0, elixir: 0 }, trophies, structuresTotal: totalStructures, structuresDestroyed: 0, ccDestroyed: false, ticks: 0, frames: wantFrames ? [] : undefined });
  if (totalStructures === 0) return empty(0);

  // ---- walls + traps ----
  const walls: Wall[] = [];
  for (const [key, lvl] of Object.entries(defender.walls)) {
    const hp = WALL.levels[lvl - 1]?.hp ?? 0;
    if (hp <= 0) continue;
    const [x, y] = key.split(",").map(Number);
    walls.push({ key, x, y, hp });
  }
  const traps: Trap[] = [];
  for (const [key, tr] of Object.entries(defender.traps ?? {})) {
    const def = TRAPS[tr.id as CocTrapId];
    if (!def) continue;
    const [x, y] = key.split(",").map(Number);
    traps.push({ key, x, y, target: def.target, damage: def.damage, radius: def.radius, armed: true });
  }

  // ---- troops: attackers (deploy) + defenders (garrison) ----
  const troops: Troop[] = [];
  function mkTroop(unit: CocUnitId, side: "atk" | "def", x: number, y: number): Troop {
    const u = UNITS[unit];
    return {
      unit, side, x, y, hp: u.hp, flying: !!u.flying,
      range: ATTACK_RANGE[unit], speed: MOVE_SPEED[unit], dps: u.dps,
      wallDps: u.favoriteTarget === "wall" ? u.dps * (u.wallMultiplier ?? 1) : u.dps * 0.05,
      alive: true, target: null, path: [], retargetAt: 0,
    };
  }
  for (const d of deploy) { if (UNITS[d.unit]) troops.push(mkTroop(d.unit, "atk", d.x, d.y)); }
  const attackerCount = troops.length;
  if (attackerCount === 0) return empty(0);
  // defenders spawn around the clan castle (golden-angle ring), deterministic
  if (clanCastle) {
    let gi = 0;
    const garrison: Army = defender.garrison ?? {};
    for (const [unit, n] of Object.entries(garrison)) {
      for (let k = 0; k < (n ?? 0); k++, gi++) {
        const r = 1 + gi * 0.35;
        const ang = gi * 2.399963;
        const gx = Math.max(0, Math.min(GRID_W - 1, clanCastle.cx + r * Math.cos(ang)));
        const gy = Math.max(0, Math.min(GRID_H - 1, clanCastle.cy + r * Math.sin(ang)));
        troops.push(mkTroop(unit as CocUnitId, "def", gx, gy));
      }
    }
  }

  const attackers = () => troops.filter((t) => t.side === "atk" && t.alive);
  const defenders = () => troops.filter((t) => t.side === "def" && t.alive);
  const livingStructs = () => structs.filter((s) => s.hp > 0);

  function blockedSet(): Set<string> {
    const set = new Set<string>();
    for (const w of walls) if (w.hp > 0) set.add(w.key);
    for (const s of structs) if (s.hp > 0) for (const [tx, ty] of s.tiles) set.add(`${tx},${ty}`);
    return set;
  }

  function bfs(sx: number, sy: number, isGoal: (x: number, y: number) => boolean, blocked: Set<string>): [number, number][] | null {
    const start = `${sx},${sy}`;
    if (isGoal(sx, sy)) return [];
    const q: [number, number][] = [[sx, sy]];
    const prev = new Map<string, string>();
    const seen = new Set<string>([start]);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let head = 0;
    while (head < q.length) {
      const [cx, cy] = q[head++];
      for (const [dx, dy] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue;
        const k = `${nx},${ny}`;
        if (seen.has(k)) continue;
        const goal = isGoal(nx, ny);
        if (blocked.has(k) && !goal) continue;
        seen.add(k);
        prev.set(k, `${cx},${cy}`);
        if (goal) {
          const path: [number, number][] = [];
          let cur = k;
          while (cur !== start) { const [px, py] = cur.split(",").map(Number); path.push([px, py]); cur = prev.get(cur)!; }
          path.reverse();
          return path;
        }
        q.push([nx, ny]);
      }
    }
    return null;
  }

  function nearestStruct(t: Troop): number {
    let best = -1, bestD = Infinity, bestRank = Infinity;
    for (let i = 0; i < structs.length; i++) {
      const s = structs[i];
      if (s.hp <= 0) continue;
      const d = eucl(t.x, t.y, s.cx, s.cy);
      if (d < bestD - 1e-9 || (Math.abs(d - bestD) <= 1e-9 && s.rank < bestRank)) { best = i; bestD = d; bestRank = s.rank; }
    }
    return best;
  }
  function nearestWall(t: Troop): number {
    let best = -1, bestD = Infinity;
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      if (w.hp <= 0) continue;
      const d = eucl(t.x, t.y, w.x, w.y);
      if (d < bestD) { best = i; bestD = d; }
    }
    return best;
  }
  /** nearest alive enemy troop (by index for stable ties); within `maxR` if given. */
  function nearestEnemy(t: Troop, maxR = Infinity): Troop | null {
    let best: Troop | null = null, bestD = Infinity, bestI = Infinity;
    for (let i = 0; i < troops.length; i++) {
      const o = troops[i];
      if (!o.alive || o.side === t.side) continue;
      const d = eucl(t.x, t.y, o.x, o.y);
      if (d > maxR) continue;
      if (d < bestD - 1e-9 || (Math.abs(d - bestD) <= 1e-9 && i < bestI)) { best = o; bestD = d; bestI = i; }
    }
    return best;
  }

  function acquire(t: Troop, tick: number): void {
    t.retargetAt = tick + RETARGET_EVERY;
    const sIdx = nearestStruct(t);
    if (sIdx < 0) { t.target = null; t.path = []; return; }
    if (t.flying) { t.target = { kind: "struct", idx: sIdx }; t.path = []; return; }
    const blocked = blockedSet();
    const tx = Math.round(t.x), ty = Math.round(t.y);
    const s = structs[sIdx];
    const goalS = (x: number, y: number) => distToStruct(x, y, s) <= t.range && !blocked.has(`${x},${y}`);
    const path = bfs(tx, ty, goalS, blocked);
    if (path) { t.target = { kind: "struct", idx: sIdx }; t.path = path; return; }
    const wIdx = nearestWall(t);
    if (wIdx >= 0) {
      const w = walls[wIdx];
      const pw = bfs(tx, ty, (x, y) => cheb(x, y, w.x, w.y) <= t.range, blocked);
      t.target = { kind: "wall", idx: wIdx };
      t.path = pw ?? [];
      return;
    }
    t.target = { kind: "struct", idx: sIdx };
    t.path = [];
  }

  const frames: BattleFrame[] = [];
  function snapshot(t: number): void {
    frames.push({
      t,
      troops: troops.map((tr) => ({ x: Math.round(tr.x * 10) / 10, y: Math.round(tr.y * 10) / 10, unit: tr.unit, side: tr.side, alive: tr.alive })),
      structures: structs.map((s) => ({ key: s.key, hp: Math.max(0, Math.round(s.hp)), max: s.maxHp })),
      walls: walls.map((w) => ({ key: w.key, hp: Math.max(0, Math.round(w.hp)) })),
      traps: traps.map((tp) => ({ key: tp.key, armed: tp.armed })),
    });
  }

  let ticks = 0;
  for (; ticks < BATTLE_TICKS; ticks++) {
    if (wantFrames && ticks % FRAME_EVERY === 0) snapshot(ticks);
    if (livingStructs().length === 0 || attackers().length === 0) break;

    // ---- attacker troops act ----
    for (const t of attackers()) {
      const foe = nearestEnemy(t, AGGRO_R); // engage nearby garrison first
      if (foe) {
        if (eucl(t.x, t.y, foe.x, foe.y) <= t.range) foe.hp -= t.dps;
        else stepToward(t, foe.x, foe.y);
        continue;
      }
      const targetDead = !t.target
        || (t.target.kind === "struct" && structs[t.target.idx].hp <= 0)
        || (t.target.kind === "wall" && walls[t.target.idx].hp <= 0);
      if (targetDead || ticks >= t.retargetAt) acquire(t, ticks);
      if (!t.target) continue;
      if (t.target.kind === "struct") {
        const s = structs[t.target.idx];
        if (distToStruct(t.x, t.y, s) <= t.range) { s.hp -= t.dps; continue; }
        if (t.flying) { stepToward(t, s.cx, s.cy); continue; }
        followPath(t);
      } else {
        const w = walls[t.target.idx];
        if (cheb(t.x, t.y, w.x, w.y) <= t.range) { w.hp -= t.wallDps; continue; }
        followPath(t);
      }
    }

    // ---- defender garrison troops act (chase attackers, move straight) ----
    for (const d of defenders()) {
      const foe = nearestEnemy(d);
      if (!foe) continue;
      if (eucl(d.x, d.y, foe.x, foe.y) <= d.range) foe.hp -= d.dps;
      else stepToward(d, foe.x, foe.y);
    }

    // ---- defenses fire at attackers ----
    for (const s of structs) {
      if (s.hp <= 0 || s.dps <= 0) continue;
      let best: Troop | null = null, bestD = Infinity, bestIdx = Infinity;
      for (let i = 0; i < troops.length; i++) {
        const tr = troops[i];
        if (!tr.alive || tr.side !== "atk") continue;
        if (tr.flying && !s.targetsAir) continue;
        if (!tr.flying && !s.targetsGround) continue;
        const d = distToStruct(tr.x, tr.y, s);
        if (d > s.range) continue;
        if (d < bestD - 1e-9 || (Math.abs(d - bestD) <= 1e-9 && i < bestIdx)) { best = tr; bestD = d; bestIdx = i; }
      }
      if (!best) continue;
      best.hp -= s.dps;
      if (s.splash) {
        for (const tr of troops) {
          if (!tr.alive || tr.side !== "atk" || tr === best || tr.flying !== best.flying) continue;
          if (eucl(tr.x, tr.y, best.x, best.y) <= SPLASH_R) tr.hp -= s.dps * 0.5;
        }
      }
    }

    // ---- hidden traps detonate on matching attacker troops ----
    for (const tp of traps) {
      if (!tp.armed) continue;
      const triggers = troops.some((tr) => tr.alive && tr.side === "atk" && (tp.target === "air") === tr.flying && eucl(tr.x, tr.y, tp.x, tp.y) <= tp.radius);
      if (!triggers) continue;
      tp.armed = false;
      for (const tr of troops) {
        if (!tr.alive || tr.side !== "atk") continue;
        if ((tp.target === "air") !== tr.flying) continue;
        if (eucl(tr.x, tr.y, tp.x, tp.y) <= tp.radius) tr.hp -= tp.damage;
      }
    }

    for (const tr of troops) if (tr.alive && tr.hp <= 0) tr.alive = false;
  }
  if (wantFrames) snapshot(ticks);

  // ---- scoring (only buildings count; walls/traps/garrison do not) ----
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
  return { stars, destructionPct: pct, loot, trophies, structuresTotal: totalStructures, structuresDestroyed: destroyed, ccDestroyed, ticks, frames: wantFrames ? frames : undefined };

  function stepToward(t: Troop, gx: number, gy: number): void {
    const dx = gx - t.x, dy = gy - t.y;
    const d = Math.hypot(dx, dy);
    if (d <= t.speed) { t.x = gx; t.y = gy; return; }
    t.x += (dx / d) * t.speed;
    t.y += (dy / d) * t.speed;
  }
  function followPath(t: Troop): void {
    if (t.path.length === 0) { acquire(t, ticks); if (t.path.length === 0) return; }
    const [wx, wy] = t.path[0];
    stepToward(t, wx, wy);
    if (Math.abs(t.x - wx) < 1e-6 && Math.abs(t.y - wy) < 1e-6) t.path.shift();
  }
}
