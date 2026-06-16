import { BUILDINGS, LOOT_PCT, UNITS, WALL, GRID_W, GRID_H } from "./config";
import { footprintTiles } from "./world";
import type { CocBase, CocBuildingId, CocUnitId, Deployment } from "./types";

// ---- battle tuning ----
const BATTLE_TICKS = 180;
const RETARGET_EVERY = 8;
const FRAME_EVERY = 2;
const SPLASH_R = 1.6;
/** per-unit attack range (tiles, Chebyshev) and move speed (tiles/tick). */
const ATTACK_RANGE: Record<CocUnitId, number> = { grunt: 1, marksman: 4, breacher: 1, juggernaut: 1, gunship: 3 };
const MOVE_SPEED: Record<CocUnitId, number> = { grunt: 1.0, marksman: 0.9, breacher: 1.1, juggernaut: 0.7, gunship: 1.2 };

export interface BattleFrame {
  t: number;
  troops: { x: number; y: number; unit: CocUnitId; alive: boolean }[];
  structures: { key: string; hp: number; max: number }[];
  walls: { key: string; hp: number }[];
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
  key: string;
  isCC: boolean;
  hp: number;
  maxHp: number;
  tiles: [number, number][];
  cx: number;
  cy: number;
  rank: number;
  dps: number;
  range: number;
  targetsAir: boolean;
  targetsGround: boolean;
  splash: boolean;
}
interface Wall {
  key: string;
  x: number;
  y: number;
  hp: number;
}
interface Troop {
  unit: CocUnitId;
  x: number;
  y: number;
  hp: number;
  flying: boolean;
  range: number;
  speed: number;
  dps: number;
  wallDps: number; // breacher bonus vs walls
  alive: boolean;
  target: { kind: "struct" | "wall"; idx: number } | null;
  path: [number, number][];
  retargetAt: number;
}

const cheb = (ax: number, ay: number, bx: number, by: number) => Math.max(Math.abs(ax - bx), Math.abs(ay - by));
const eucl = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

/** Chebyshev distance from a point to the nearest footprint tile of a structure. */
function distToStruct(x: number, y: number, s: Struct): number {
  let best = Infinity;
  for (const [tx, ty] of s.tiles) best = Math.min(best, cheb(x, y, tx, ty));
  return best;
}

/**
 * Pure, deterministic positional raid resolution on the defender's grid. Ground troops path
 * around walls/buildings (BFS) and break walls when boxed in; flyers ignore both and are only hit
 * by air defense. Reproducible for a given (deploy, defender, seed).
 */
export function resolveRaid(deploy: Deployment[], defender: CocBase, seed: number, opts?: { frames?: boolean }): BattleResult {
  const rnd = mulberry32(seed);
  const wantFrames = !!opts?.frames;

  // ---- structures ----
  const structs: Struct[] = [];
  for (const [key, b] of Object.entries(defender.buildings)) {
    const def = BUILDINGS[b.id];
    const stat = def.levels[Math.max(0, b.level - 1)];
    const fires = def.category === "defense" && b.level >= 1;
    const tiles = footprintTiles(key, b.id).map((t) => t.split(",").map(Number) as [number, number]);
    let cx = 0, cy = 0;
    for (const [tx, ty] of tiles) { cx += tx; cy += ty; }
    cx /= tiles.length; cy /= tiles.length;
    structs.push({
      key, isCC: b.id === "commandCenter",
      hp: structureHp(b.id, Math.max(1, b.level)), maxHp: structureHp(b.id, Math.max(1, b.level)),
      tiles, cx, cy, rank: 0,
      dps: fires ? stat?.dps ?? 0 : 0,
      range: fires ? stat?.range ?? 0 : 0,
      targetsAir: fires ? stat?.targets === "air" || stat?.targets === "any" : false,
      targetsGround: fires ? stat?.targets === "ground" || stat?.targets === "any" : false,
      splash: fires ? !!stat?.splash : false,
    });
  }
  const totalStructures = structs.length;
  // seeded focus order → stable tie-break for "nearest" target selection
  const order = structs.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  order.forEach((sIdx, rank) => { structs[sIdx].rank = rank; });

  const empty = (trophies: number): BattleResult => ({ stars: 0, destructionPct: 0, loot: { gold: 0, elixir: 0 }, trophies, structuresTotal: totalStructures, structuresDestroyed: 0, ccDestroyed: false, ticks: 0, frames: wantFrames ? [] : undefined });
  if (totalStructures === 0) return empty(0);

  // ---- walls ----
  const walls: Wall[] = [];
  for (const [key, lvl] of Object.entries(defender.walls)) {
    const hp = WALL.levels[lvl - 1]?.hp ?? 0;
    if (hp <= 0) continue;
    const [x, y] = key.split(",").map(Number);
    walls.push({ key, x, y, hp });
  }
  const wallAt = new Map<string, Wall>();
  for (const w of walls) wallAt.set(w.key, w);

  // ---- troops ----
  const troops: Troop[] = [];
  for (const d of deploy) {
    const u = UNITS[d.unit];
    if (!u) continue;
    troops.push({
      unit: d.unit, x: d.x, y: d.y, hp: u.hp,
      flying: !!u.flying, range: ATTACK_RANGE[d.unit], speed: MOVE_SPEED[d.unit],
      dps: u.dps, wallDps: u.favoriteTarget === "wall" ? u.dps * (u.wallMultiplier ?? 1) : u.dps * 0.05,
      alive: true, target: null, path: [], retargetAt: 0,
    });
  }
  if (troops.length === 0) return empty(0);

  const livingStructs = () => structs.filter((s) => s.hp > 0);
  const aliveTroops = () => troops.filter((t) => t.alive);

  // blocked tiles for ground BFS = living walls + living building footprints
  function blockedSet(): Set<string> {
    const set = new Set<string>();
    for (const w of walls) if (w.hp > 0) set.add(w.key);
    for (const s of structs) if (s.hp > 0) for (const [tx, ty] of s.tiles) set.add(`${tx},${ty}`);
    return set;
  }

  // BFS from (sx,sy) to the nearest tile satisfying isGoal, avoiding `blocked` (start always allowed).
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
        if (blocked.has(k) && !goal) continue; // may step onto a goal tile even if "blocked"
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

  function acquire(t: Troop, tick: number): void {
    t.retargetAt = tick + RETARGET_EVERY;
    const sIdx = nearestStruct(t);
    if (sIdx < 0) { t.target = null; t.path = []; return; }
    if (t.flying) { t.target = { kind: "struct", idx: sIdx }; t.path = []; return; }
    // ground: try to path to within range of the structure
    const blocked = blockedSet();
    const tx = Math.round(t.x), ty = Math.round(t.y);
    const s = structs[sIdx];
    const goalS = (x: number, y: number) => distToStruct(x, y, s) <= t.range && !blocked.has(`${x},${y}`);
    let path = bfs(tx, ty, goalS, blocked);
    if (path) { t.target = { kind: "struct", idx: sIdx }; t.path = path; return; }
    // boxed in → break the nearest wall
    const wIdx = nearestWall(t);
    if (wIdx >= 0) {
      const w = walls[wIdx];
      const goalW = (x: number, y: number) => cheb(x, y, w.x, w.y) <= t.range;
      const pw = bfs(tx, ty, goalW, blocked);
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
      troops: troops.map((tr) => ({ x: Math.round(tr.x * 10) / 10, y: Math.round(tr.y * 10) / 10, unit: tr.unit, alive: tr.alive })),
      structures: structs.map((s) => ({ key: s.key, hp: Math.max(0, Math.round(s.hp)), max: s.maxHp })),
      walls: walls.map((w) => ({ key: w.key, hp: Math.max(0, Math.round(w.hp)) })),
    });
  }

  let ticks = 0;
  for (; ticks < BATTLE_TICKS; ticks++) {
    if (wantFrames && ticks % FRAME_EVERY === 0) snapshot(ticks);
    const living = livingStructs();
    const alive = aliveTroops();
    if (living.length === 0 || alive.length === 0) break;

    // ---- troops act ----
    for (const t of alive) {
      // (re)acquire target
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

    // ---- defenses fire ----
    for (const s of structs) {
      if (s.hp <= 0 || s.dps <= 0) continue;
      let best: Troop | null = null, bestD = Infinity, bestIdx = Infinity;
      for (let i = 0; i < troops.length; i++) {
        const tr = troops[i];
        if (!tr.alive) continue;
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
          if (!tr.alive || tr === best || tr.flying !== best.flying) continue;
          if (eucl(tr.x, tr.y, best.x, best.y) <= SPLASH_R) tr.hp -= s.dps * 0.5;
        }
      }
    }
    for (const tr of troops) if (tr.alive && tr.hp <= 0) tr.alive = false;
  }
  if (wantFrames) snapshot(ticks);

  // ---- scoring (walls don't count) ----
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
