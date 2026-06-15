# WARLANDS CoC SP0 — Buildable Base + Economy (no combat) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On `/world`, a player claims a 7-hex cluster on the shared live map, builds & upgrades a Command Center + Gold/Elixir collectors + storages using limited builders on real-time timers, with Gold/Elixir flowing — all server-authoritative and Postgres-persisted.

**Architecture:** Build a NEW, self-contained CoC sim ruleset under `src/sim/coc/*` that reuses the existing content-agnostic frame (immutable `applyCommand(state,playerId,cmd)` + `applyTick(state)` pattern, the `ws` server transport, and the Postgres JSONB snapshot layer). Repoint `server/index.ts` and the `/world` client at the new ruleset. The old `src/sim/*` modules and their tests stay intact and green for reference. No combat/troops/defenses/shields/WAR-sinks/clans in SP0.

**Tech Stack:** TypeScript, Next.js 16 (App Router, Turbopack) + React 19 client, Node + `ws` server (separate `server/` package, ESM, tsx), Postgres (`pg`), Vitest (colocated `*.test.ts`). Hex math in `src/game/world.ts`. 1 tick = 1 second (`tickMs: 1000`).

---

## File Structure

**Create (new CoC ruleset — pure, framework-agnostic):**
- `src/sim/coc/types.ts` — `CocWorld`, `CocBase`, `CocPlayer`, `PlacedBuilding`, `BuildJob`, `CocCommand`, `CommandResult`, `CocResource`, `CocBuildingId`.
- `src/sim/coc/config.ts` — economy constants, `BUILDINGS` catalog (per-level cost/time/output), `CC_PROGRESSION` table, helpers (`levelDef`, `maxLevelOf`, `ccTier`).
- `src/sim/coc/world.ts` — `createWorld`, `addPlayer`, `ccLevel`, `storageCap`, `freeBuilders`, `normalizeWorld`.
- `src/sim/coc/tick.ts` — `applyTick` (collector buffers fill, jobs complete → builders free).
- `src/sim/coc/commands.ts` — `applyCommand` dispatch: `claimBase`, `placeBuilding`, `upgradeBuilding`, `collect`, `expandCluster`.
- `src/sim/coc/index.ts` — barrel re-export.
- `src/lib/useBaseSocket.ts` — client ws hook for the CoC ruleset.
- Tests: `src/game/world.test.ts` (add), `src/sim/coc/config.test.ts`, `src/sim/coc/world.test.ts`, `src/sim/coc/tick.test.ts`, `src/sim/coc/commands.test.ts`.

**Modify:**
- `src/game/world.ts` — add `hexNeighbors(q,r)`.
- `server/index.ts` — repoint imports to `@/sim/coc`; state type `CocWorld`; drop SP0-irrelevant `report` handling.
- `server/index.test.ts` — rewrite the two cases to the CoC claim flow.
- `src/app/world/page.tsx` — rewrite as the functional base-builder UI (claim → build/upgrade with timers → collect → expand), reusing `axialToPixel`. (Polished art comes later from the design pass; SP0 ships a clean functional UI.)

**Untouched (kept green):** `src/sim/*` (old), `src/game/{resources,buildings,units,...}.ts`, `src/lib/useWorldSocket.ts`, `server/db.ts`, `src/web3/*`.

---

## Task 1: Hex neighbors helper

**Files:**
- Modify: `src/game/world.ts`
- Test: `src/game/world.test.ts` (create)

- [ ] **Step 1: Write the failing test** — create `src/game/world.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { hexNeighbors, hexKey } from "./world";

describe("hexNeighbors", () => {
  it("returns the 6 axial neighbors", () => {
    const got = hexNeighbors(0, 0).map(({ q, r }) => hexKey(q, r)).sort();
    expect(got).toEqual(["-1,0", "-1,1", "0,-1", "0,1", "1,-1", "1,0"].sort());
  });
  it("is offset correctly from a non-origin hex", () => {
    const got = hexNeighbors(2, -1).map(({ q, r }) => hexKey(q, r));
    expect(got).toContain("3,-1");
    expect(got).toContain("2,0");
  });
});
```

- [ ] **Step 2: Run it, verify it fails** — `npx vitest run src/game/world.test.ts` → FAIL (`hexNeighbors is not a function`).

- [ ] **Step 3: Implement** — append to `src/game/world.ts` (before the final `export { PLOT_TYPES };`):

```ts
/** The 6 axial neighbor directions (pointy-top). */
export const AXIAL_DIRS: ReadonlyArray<[number, number]> = [
  [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1],
];

/** Coordinates of the 6 hexes adjacent to (q,r) in axial space. */
export function hexNeighbors(q: number, r: number): { q: number; r: number }[] {
  return AXIAL_DIRS.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
}
```

- [ ] **Step 4: Run it, verify it passes** — `npx vitest run src/game/world.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/world.ts src/game/world.test.ts
git commit -m "feat(coc): hex neighbors helper for base clusters"
```

---

## Task 2: CoC types + config

**Files:**
- Create: `src/sim/coc/types.ts`, `src/sim/coc/config.ts`
- Test: `src/sim/coc/config.test.ts`

- [ ] **Step 1: Create `src/sim/coc/types.ts`** (types only — no test needed):

```ts
import type { Hex } from "@/game/world";

export type CocResource = "gold" | "elixir";
export type CocBuildingId =
  | "commandCenter"
  | "goldCollector"
  | "elixirCollector"
  | "goldStorage"
  | "elixirStorage";

/** A building placed on a hex. level 0 = under construction (not yet operational). */
export interface PlacedBuilding {
  id: CocBuildingId;
  level: number;
  /** collector accumulation awaiting collection */
  buffer?: number;
}

export interface BuildJob {
  hexKey: string;
  buildingId: CocBuildingId;
  kind: "build" | "upgrade";
  toLevel: number;
  finishesAtTick: number;
}

export interface CocBase {
  owner: string;
  centerKey: string;
  ownedHexes: string[];
  buildings: Record<string, PlacedBuilding>; // hexKey -> building
  gold: number;
  elixir: number;
  builders: number;
  jobs: BuildJob[];
}

export interface CocPlayer {
  id: string;
  war: number;
  joinedTick: number;
}

export interface CocWorld {
  seed: number;
  radius: number;
  tick: number;
  hexes: Record<string, Hex>;
  bases: Record<string, CocBase>; // keyed by owner playerId
  claimedHexes: Record<string, string>; // hexKey -> owner
  players: Record<string, CocPlayer>;
}

export type CocCommand =
  | { type: "claimBase"; q: number; r: number }
  | { type: "placeBuilding"; hexKey: string; buildingId: CocBuildingId }
  | { type: "upgradeBuilding"; hexKey: string }
  | { type: "collect" }
  | { type: "expandCluster"; q: number; r: number };

export interface CommandResult {
  state: CocWorld;
  error?: string;
}
```

- [ ] **Step 2: Write the failing test** — create `src/sim/coc/config.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { BUILDINGS, levelDef, maxLevelOf, ccTier } from "./config";

describe("coc config", () => {
  it("command center has 5 levels", () => {
    expect(maxLevelOf("commandCenter")).toBe(5);
  });
  it("collector output scales with level", () => {
    expect(levelDef("goldCollector", 1)?.producePerTick).toBe(2);
    expect(levelDef("goldCollector", 2)?.producePerTick).toBe(4);
  });
  it("CC1 allows exactly one gold collector at level 1", () => {
    expect(ccTier(1).caps.goldCollector).toEqual({ maxCount: 1, maxLevel: 1 });
  });
  it("CC level clamps above the table length", () => {
    expect(ccTier(99)).toBe(ccTier(5));
  });
  it("every building level has a non-negative build time and a cost object", () => {
    for (const def of Object.values(BUILDINGS)) {
      for (const lv of def.levels) {
        expect(lv.buildTimeSec).toBeGreaterThanOrEqual(0);
        expect(typeof lv.cost).toBe("object");
      }
    }
  });
});
```

- [ ] **Step 3: Run it, verify it fails** — `npx vitest run src/sim/coc/config.test.ts` → FAIL (cannot find `./config`).

- [ ] **Step 4: Implement `src/sim/coc/config.ts`:**

```ts
import type { CocBuildingId, CocResource } from "./types";

export const STARTING_WAR = 200_000;
export const STARTING_GOLD = 500;
export const STARTING_ELIXIR = 500;
export const STARTING_BUILDERS = 2;
export const BASE_STORAGE_CAP = 1000;

export interface BuildingLevel {
  cost: Partial<Record<CocResource, number>>;
  buildTimeSec: number;
  producePerTick?: number; // collectors
  bufferCap?: number; // collectors
  storageCap?: number; // storages
}

export interface BuildingDef {
  id: CocBuildingId;
  name: string;
  category: "hq" | "collector" | "storage";
  produces?: CocResource;
  stores?: CocResource;
  levels: BuildingLevel[]; // index 0 => level 1
}

export const BUILDINGS: Record<CocBuildingId, BuildingDef> = {
  commandCenter: {
    id: "commandCenter",
    name: "Command Center",
    category: "hq",
    levels: [
      { cost: {}, buildTimeSec: 0 },
      { cost: { gold: 1000 }, buildTimeSec: 60 },
      { cost: { gold: 4000 }, buildTimeSec: 300 },
      { cost: { gold: 12000 }, buildTimeSec: 1800 },
      { cost: { gold: 40000 }, buildTimeSec: 7200 },
    ],
  },
  goldCollector: {
    id: "goldCollector",
    name: "Gold Collector",
    category: "collector",
    produces: "gold",
    levels: [
      { cost: { elixir: 150 }, buildTimeSec: 30, producePerTick: 2, bufferCap: 500 },
      { cost: { elixir: 600 }, buildTimeSec: 120, producePerTick: 4, bufferCap: 1000 },
      { cost: { elixir: 2000 }, buildTimeSec: 600, producePerTick: 8, bufferCap: 2000 },
    ],
  },
  elixirCollector: {
    id: "elixirCollector",
    name: "Elixir Collector",
    category: "collector",
    produces: "elixir",
    levels: [
      { cost: { gold: 150 }, buildTimeSec: 30, producePerTick: 2, bufferCap: 500 },
      { cost: { gold: 600 }, buildTimeSec: 120, producePerTick: 4, bufferCap: 1000 },
      { cost: { gold: 2000 }, buildTimeSec: 600, producePerTick: 8, bufferCap: 2000 },
    ],
  },
  goldStorage: {
    id: "goldStorage",
    name: "Gold Storage",
    category: "storage",
    stores: "gold",
    levels: [
      { cost: { elixir: 300 }, buildTimeSec: 60, storageCap: 2000 },
      { cost: { elixir: 1200 }, buildTimeSec: 300, storageCap: 5000 },
      { cost: { elixir: 4000 }, buildTimeSec: 1200, storageCap: 12000 },
    ],
  },
  elixirStorage: {
    id: "elixirStorage",
    name: "Elixir Storage",
    category: "storage",
    stores: "elixir",
    levels: [
      { cost: { gold: 300 }, buildTimeSec: 60, storageCap: 2000 },
      { cost: { gold: 1200 }, buildTimeSec: 300, storageCap: 5000 },
      { cost: { gold: 4000 }, buildTimeSec: 1200, storageCap: 12000 },
    ],
  },
};

export interface CcCap {
  maxCount: number;
  maxLevel: number;
}
export interface CcTier {
  maxHexes: number;
  caps: Partial<Record<CocBuildingId, CcCap>>;
}

/** index 0 => Command Center level 1. */
export const CC_PROGRESSION: CcTier[] = [
  {
    maxHexes: 7,
    caps: {
      goldCollector: { maxCount: 1, maxLevel: 1 },
      elixirCollector: { maxCount: 1, maxLevel: 1 },
      goldStorage: { maxCount: 1, maxLevel: 1 },
      elixirStorage: { maxCount: 1, maxLevel: 1 },
    },
  },
  {
    maxHexes: 9,
    caps: {
      goldCollector: { maxCount: 2, maxLevel: 2 },
      elixirCollector: { maxCount: 2, maxLevel: 2 },
      goldStorage: { maxCount: 1, maxLevel: 2 },
      elixirStorage: { maxCount: 1, maxLevel: 2 },
    },
  },
  {
    maxHexes: 11,
    caps: {
      goldCollector: { maxCount: 2, maxLevel: 3 },
      elixirCollector: { maxCount: 2, maxLevel: 3 },
      goldStorage: { maxCount: 2, maxLevel: 3 },
      elixirStorage: { maxCount: 2, maxLevel: 3 },
    },
  },
  {
    maxHexes: 13,
    caps: {
      goldCollector: { maxCount: 3, maxLevel: 3 },
      elixirCollector: { maxCount: 3, maxLevel: 3 },
      goldStorage: { maxCount: 2, maxLevel: 3 },
      elixirStorage: { maxCount: 2, maxLevel: 3 },
    },
  },
  {
    maxHexes: 19,
    caps: {
      goldCollector: { maxCount: 4, maxLevel: 3 },
      elixirCollector: { maxCount: 4, maxLevel: 3 },
      goldStorage: { maxCount: 3, maxLevel: 3 },
      elixirStorage: { maxCount: 3, maxLevel: 3 },
    },
  },
];

export function levelDef(id: CocBuildingId, level: number): BuildingLevel | undefined {
  return BUILDINGS[id].levels[level - 1];
}
export function maxLevelOf(id: CocBuildingId): number {
  return BUILDINGS[id].levels.length;
}
export function ccTier(level: number): CcTier {
  const idx = Math.min(Math.max(level, 1), CC_PROGRESSION.length) - 1;
  return CC_PROGRESSION[idx];
}
```

- [ ] **Step 5: Run it, verify it passes** — `npx vitest run src/sim/coc/config.test.ts` → PASS.

- [ ] **Step 6: Commit**

```bash
git add src/sim/coc/types.ts src/sim/coc/config.ts src/sim/coc/config.test.ts
git commit -m "feat(coc): SP0 types + economy/progression config"
```

---

## Task 3: World creation + base helpers

**Files:**
- Create: `src/sim/coc/world.ts`
- Test: `src/sim/coc/world.test.ts`

- [ ] **Step 1: Write the failing test** — create `src/sim/coc/world.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createWorld, addPlayer, storageCap, ccLevel, freeBuilders, normalizeWorld } from "./world";
import { BASE_STORAGE_CAP, STARTING_BUILDERS, STARTING_WAR } from "./config";
import type { CocBase } from "./types";

const base = (over: Partial<CocBase> = {}): CocBase => ({
  owner: "p1",
  centerKey: "0,0",
  ownedHexes: ["0,0"],
  buildings: { "0,0": { id: "commandCenter", level: 1 } },
  gold: 0,
  elixir: 0,
  builders: STARTING_BUILDERS,
  jobs: [],
  ...over,
});

describe("createWorld", () => {
  it("has a radius-9 hex map and no bases", () => {
    const w = createWorld(1);
    expect(w.radius).toBe(9);
    expect(Object.keys(w.hexes).length).toBe(271);
    expect(Object.keys(w.bases).length).toBe(0);
    expect(w.tick).toBe(0);
  });
  it("is deterministic for the same seed", () => {
    expect(createWorld(7)).toEqual(createWorld(7));
  });
});

describe("addPlayer", () => {
  it("adds a player with the starting WAR balance", () => {
    const w = addPlayer(createWorld(1), "p1");
    expect(w.players.p1.war).toBe(STARTING_WAR);
  });
  it("is idempotent", () => {
    let w = addPlayer(createWorld(1), "p1");
    w = { ...w, players: { ...w.players, p1: { ...w.players.p1, war: 5 } } };
    w = addPlayer(w, "p1");
    expect(w.players.p1.war).toBe(5);
  });
});

describe("storageCap", () => {
  it("is the base cap with no storage", () => {
    expect(storageCap(base(), "gold")).toBe(BASE_STORAGE_CAP);
  });
  it("adds storage capacity for the matching resource only", () => {
    const b = base({
      ownedHexes: ["0,0", "1,0"],
      buildings: {
        "0,0": { id: "commandCenter", level: 1 },
        "1,0": { id: "goldStorage", level: 1 },
      },
    });
    expect(storageCap(b, "gold")).toBe(BASE_STORAGE_CAP + 2000);
    expect(storageCap(b, "elixir")).toBe(BASE_STORAGE_CAP);
  });
  it("ignores storages still under construction (level 0)", () => {
    const b = base({
      buildings: {
        "0,0": { id: "commandCenter", level: 1 },
        "1,0": { id: "goldStorage", level: 0 },
      },
    });
    expect(storageCap(b, "gold")).toBe(BASE_STORAGE_CAP);
  });
});

describe("ccLevel + freeBuilders", () => {
  it("reads CC level from the center building", () => {
    expect(ccLevel(base())).toBe(1);
    expect(ccLevel(base({ buildings: { "0,0": { id: "commandCenter", level: 3 } } }))).toBe(3);
  });
  it("free builders = builders minus active jobs", () => {
    expect(freeBuilders(base())).toBe(2);
    expect(
      freeBuilders(
        base({ jobs: [{ hexKey: "1,0", buildingId: "goldCollector", kind: "build", toLevel: 1, finishesAtTick: 30 }] }),
      ),
    ).toBe(1);
  });
});

describe("normalizeWorld", () => {
  it("fills missing collections on a restored snapshot", () => {
    const restored = { seed: 1, radius: 9, tick: 5, hexes: {} } as never;
    const w = normalizeWorld(restored);
    expect(w.bases).toEqual({});
    expect(w.claimedHexes).toEqual({});
    expect(w.players).toEqual({});
  });
});
```

- [ ] **Step 2: Run it, verify it fails** — `npx vitest run src/sim/coc/world.test.ts` → FAIL (cannot find `./world`).

- [ ] **Step 3: Implement `src/sim/coc/world.ts`:**

```ts
import { generateWorld, hexKey } from "@/game/world";
import { BASE_STORAGE_CAP, BUILDINGS, STARTING_WAR } from "./config";
import type { CocBase, CocPlayer, CocResource, CocWorld } from "./types";

export const WORLD_RADIUS = 9;

export function createWorld(seed: number): CocWorld {
  const { radius, hexes } = generateWorld(WORLD_RADIUS);
  const hexRecord: CocWorld["hexes"] = {};
  for (const [k, h] of hexes) hexRecord[k] = h;
  return { seed, radius, tick: 0, hexes: hexRecord, bases: {}, claimedHexes: {}, players: {} };
}

export function addPlayer(state: CocWorld, id: string): CocWorld {
  if (state.players[id]) return state;
  const player: CocPlayer = { id, war: STARTING_WAR, joinedTick: state.tick };
  return { ...state, players: { ...state.players, [id]: player } };
}

export function ccLevel(base: CocBase): number {
  return base.buildings[base.centerKey]?.level ?? 1;
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

export function freeBuilders(base: CocBase): number {
  return base.builders - base.jobs.length;
}

/** Make a restored snapshot resilient to schema evolution. */
export function normalizeWorld(state: CocWorld): CocWorld {
  const bases: CocWorld["bases"] = {};
  for (const [k, b] of Object.entries(state.bases ?? {})) {
    bases[k] = {
      ...b,
      ownedHexes: b.ownedHexes ?? [],
      buildings: b.buildings ?? {},
      jobs: b.jobs ?? [],
      gold: b.gold ?? 0,
      elixir: b.elixir ?? 0,
      builders: b.builders ?? 2,
    };
  }
  return {
    ...state,
    bases,
    claimedHexes: state.claimedHexes ?? {},
    players: state.players ?? {},
  };
}

export { hexKey };
```

- [ ] **Step 4: Run it, verify it passes** — `npx vitest run src/sim/coc/world.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/coc/world.ts src/sim/coc/world.test.ts
git commit -m "feat(coc): world creation + base helpers (storage cap, CC level, builders)"
```

---

## Task 4: Tick — collectors fill, jobs complete

**Files:**
- Create: `src/sim/coc/tick.ts`
- Test: `src/sim/coc/tick.test.ts`

- [ ] **Step 1: Write the failing test** — create `src/sim/coc/tick.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { applyTick } from "./tick";
import { createWorld } from "./world";
import type { CocBase, CocWorld } from "./types";

const baseWith = (over: Partial<CocBase>): CocBase => ({
  owner: "p1",
  centerKey: "0,0",
  ownedHexes: ["0,0", "1,0"],
  buildings: { "0,0": { id: "commandCenter", level: 1 } },
  gold: 0,
  elixir: 0,
  builders: 2,
  jobs: [],
  ...over,
});

function worldWith(b: CocBase): CocWorld {
  const w = createWorld(1);
  return {
    ...w,
    players: { p1: { id: "p1", war: 0, joinedTick: 0 } },
    bases: { p1: b },
    claimedHexes: Object.fromEntries(b.ownedHexes.map((h) => [h, "p1"])),
  };
}

describe("applyTick", () => {
  it("increments the tick", () => {
    expect(applyTick(createWorld(1)).tick).toBe(1);
  });
  it("fills an operational collector's buffer by producePerTick", () => {
    const w = worldWith(baseWith({ buildings: { "0,0": { id: "commandCenter", level: 1 }, "1,0": { id: "goldCollector", level: 1, buffer: 0 } } }));
    expect(applyTick(w).bases.p1.buildings["1,0"].buffer).toBe(2);
  });
  it("caps the buffer at bufferCap", () => {
    const w = worldWith(baseWith({ buildings: { "0,0": { id: "commandCenter", level: 1 }, "1,0": { id: "goldCollector", level: 1, buffer: 499 } } }));
    expect(applyTick(w).bases.p1.buildings["1,0"].buffer).toBe(500);
  });
  it("does not fill a collector under construction (level 0)", () => {
    const w = worldWith(baseWith({ buildings: { "0,0": { id: "commandCenter", level: 1 }, "1,0": { id: "goldCollector", level: 0, buffer: 0 } } }));
    expect(applyTick(w).bases.p1.buildings["1,0"].buffer ?? 0).toBe(0);
  });
  it("completes a build job at finishesAtTick and frees the builder", () => {
    const w = worldWith(baseWith({
      buildings: { "0,0": { id: "commandCenter", level: 1 }, "1,0": { id: "goldCollector", level: 0 } },
      jobs: [{ hexKey: "1,0", buildingId: "goldCollector", kind: "build", toLevel: 1, finishesAtTick: 1 }],
    }));
    const after = applyTick(w);
    expect(after.bases.p1.buildings["1,0"].level).toBe(1);
    expect(after.bases.p1.jobs.length).toBe(0);
  });
  it("leaves a job that has not yet finished", () => {
    const w = worldWith(baseWith({
      buildings: { "0,0": { id: "commandCenter", level: 1 }, "1,0": { id: "goldCollector", level: 0 } },
      jobs: [{ hexKey: "1,0", buildingId: "goldCollector", kind: "build", toLevel: 1, finishesAtTick: 5 }],
    }));
    expect(applyTick(w).bases.p1.jobs.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run it, verify it fails** — `npx vitest run src/sim/coc/tick.test.ts` → FAIL (cannot find `./tick`).

- [ ] **Step 3: Implement `src/sim/coc/tick.ts`:**

```ts
import { BUILDINGS } from "./config";
import type { BuildJob, CocBase, CocWorld, PlacedBuilding } from "./types";

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
      const b = buildings[job.hexKey];
      if (b) b.level = job.toLevel;
    } else {
      jobs.push(job);
    }
  }

  return { ...base, buildings, jobs };
}

export function applyTick(state: CocWorld): CocWorld {
  const nextTick = state.tick + 1;
  const bases: CocWorld["bases"] = {};
  for (const [owner, base] of Object.entries(state.bases)) {
    bases[owner] = tickBase(base, nextTick);
  }
  return { ...state, tick: nextTick, bases };
}
```

- [ ] **Step 4: Run it, verify it passes** — `npx vitest run src/sim/coc/tick.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/coc/tick.ts src/sim/coc/tick.test.ts
git commit -m "feat(coc): tick — collectors fill buffers, jobs complete & free builders"
```

---

## Task 5: Commands — claim / build / upgrade / collect / expand

**Files:**
- Create: `src/sim/coc/commands.ts`
- Test: `src/sim/coc/commands.test.ts`

- [ ] **Step 1: Write the failing test** — create `src/sim/coc/commands.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { applyCommand } from "./commands";
import { createWorld, addPlayer } from "./world";
import type { CocWorld } from "./types";

const fresh = (): CocWorld => addPlayer(createWorld(1), "p1");
const claimed = (): CocWorld => applyCommand(fresh(), "p1", { type: "claimBase", q: 0, r: 0 }).state;
function give(s: CocWorld, gold: number, elixir: number, builders = 2): CocWorld {
  return { ...s, bases: { ...s.bases, p1: { ...s.bases.p1, gold, elixir, builders } } };
}

describe("claimBase", () => {
  it("claims a 7-hex cluster with a level-1 command center", () => {
    const r = applyCommand(fresh(), "p1", { type: "claimBase", q: 0, r: 0 });
    expect(r.error).toBeUndefined();
    const b = r.state.bases.p1;
    expect(b.ownedHexes.length).toBe(7);
    expect(b.buildings["0,0"]).toEqual({ id: "commandCenter", level: 1 });
    expect(r.state.claimedHexes["1,0"]).toBe("p1");
  });
  it("rejects a second base for the same player", () => {
    const r = applyCommand(claimed(), "p1", { type: "claimBase", q: 5, r: 0 });
    expect(r.error).toMatch(/already/i);
  });
  it("rejects an out-of-bounds center", () => {
    const r = applyCommand(fresh(), "p1", { type: "claimBase", q: 999, r: 999 });
    expect(r.error).toMatch(/hex/i);
  });
  it("rejects overlapping another player's cluster", () => {
    const s = addPlayer(claimed(), "p2");
    const r = applyCommand(s, "p2", { type: "claimBase", q: 1, r: 0 });
    expect(r.error).toMatch(/claimed/i);
  });
});

describe("placeBuilding", () => {
  it("places a gold collector under construction and occupies a builder + spends elixir", () => {
    const r = applyCommand(give(claimed(), 0, 1000), "p1", { type: "placeBuilding", hexKey: "1,0", buildingId: "goldCollector" });
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.buildings["1,0"]).toEqual({ id: "goldCollector", level: 0, buffer: 0 });
    expect(r.state.bases.p1.jobs.length).toBe(1);
    expect(r.state.bases.p1.elixir).toBe(850);
  });
  it("rejects when the resource is insufficient", () => {
    const r = applyCommand(give(claimed(), 0, 0), "p1", { type: "placeBuilding", hexKey: "1,0", buildingId: "goldCollector" });
    expect(r.error).toMatch(/elixir/i);
  });
  it("rejects building on an occupied hex", () => {
    const r = applyCommand(give(claimed(), 0, 1000), "p1", { type: "placeBuilding", hexKey: "0,0", buildingId: "goldCollector" });
    expect(r.error).toMatch(/occupied|empty/i);
  });
  it("rejects a hex outside the cluster", () => {
    const r = applyCommand(give(claimed(), 0, 1000), "p1", { type: "placeBuilding", hexKey: "5,5", buildingId: "goldCollector" });
    expect(r.error).toMatch(/your base|cluster|owned/i);
  });
  it("rejects exceeding the CC1 building cap", () => {
    let s = give(claimed(), 0, 1000, 5);
    s = { ...s, bases: { p1: { ...s.bases.p1, buildings: { ...s.bases.p1.buildings, "1,0": { id: "goldCollector", level: 1 } } } } };
    const r = applyCommand(s, "p1", { type: "placeBuilding", hexKey: "1,-1", buildingId: "goldCollector" });
    expect(r.error).toMatch(/limit/i);
  });
  it("rejects when no builder is free", () => {
    const s = give(claimed(), 0, 1000, 0);
    const r = applyCommand(s, "p1", { type: "placeBuilding", hexKey: "1,0", buildingId: "goldCollector" });
    expect(r.error).toMatch(/builder/i);
  });
});

describe("upgradeBuilding", () => {
  it("upgrades the command center: spends gold, queues a job, keeps the current level until done", () => {
    const r = applyCommand(give(claimed(), 2000, 0), "p1", { type: "upgradeBuilding", hexKey: "0,0" });
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.gold).toBe(1000);
    expect(r.state.bases.p1.jobs[0]).toMatchObject({ hexKey: "0,0", kind: "upgrade", toLevel: 2 });
    expect(r.state.bases.p1.buildings["0,0"].level).toBe(1);
  });
  it("rejects upgrading a building already at its CC-capped level", () => {
    let s = give(claimed(), 0, 1000, 5);
    s = { ...s, bases: { p1: { ...s.bases.p1, buildings: { ...s.bases.p1.buildings, "1,0": { id: "goldCollector", level: 1 } } } } };
    const r = applyCommand(s, "p1", { type: "upgradeBuilding", hexKey: "1,0" });
    expect(r.error).toMatch(/command center|max|level/i);
  });
  it("rejects upgrading a building that is under construction", () => {
    let s = give(claimed(), 0, 1000, 5);
    s = { ...s, bases: { p1: { ...s.bases.p1, buildings: { ...s.bases.p1.buildings, "1,0": { id: "goldCollector", level: 0 } } } } };
    const r = applyCommand(s, "p1", { type: "upgradeBuilding", hexKey: "1,0" });
    expect(r.error).toMatch(/construction|busy/i);
  });
});

describe("collect", () => {
  it("drains collector buffers into storage up to the cap", () => {
    let s = give(claimed(), 0, 0);
    s = { ...s, bases: { p1: { ...s.bases.p1, buildings: { ...s.bases.p1.buildings, "1,0": { id: "goldCollector", level: 1, buffer: 300 } } } } };
    const r = applyCommand(s, "p1", { type: "collect" });
    expect(r.state.bases.p1.gold).toBe(300);
    expect(r.state.bases.p1.buildings["1,0"].buffer).toBe(0);
  });
  it("respects storage cap and leaves the overflow in the buffer", () => {
    let s = give(claimed(), 900, 0); // base cap 1000 => room for 100
    s = { ...s, bases: { p1: { ...s.bases.p1, buildings: { ...s.bases.p1.buildings, "1,0": { id: "goldCollector", level: 1, buffer: 300 } } } } };
    const r = applyCommand(s, "p1", { type: "collect" });
    expect(r.state.bases.p1.gold).toBe(1000);
    expect(r.state.bases.p1.buildings["1,0"].buffer).toBe(200);
  });
});

describe("expandCluster", () => {
  it("rejects expanding past the CC level max hexes", () => {
    const r = applyCommand(claimed(), "p1", { type: "expandCluster", q: 2, r: 0 });
    expect(r.error).toMatch(/command center|expand|max/i);
  });
  it("annexes an adjacent unclaimed hex once CC level allows", () => {
    let s = claimed();
    // bump CC to level 2 (maxHexes 9) so expansion is allowed
    s = { ...s, bases: { p1: { ...s.bases.p1, buildings: { ...s.bases.p1.buildings, "0,0": { id: "commandCenter", level: 2 } } } } };
    const r = applyCommand(s, "p1", { type: "expandCluster", q: 2, r: 0 }); // (2,0) is adjacent to owned (1,0)
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.ownedHexes).toContain("2,0");
    expect(r.state.claimedHexes["2,0"]).toBe("p1");
  });
});
```

- [ ] **Step 2: Run it, verify it fails** — `npx vitest run src/sim/coc/commands.test.ts` → FAIL (cannot find `./commands`).

- [ ] **Step 3: Implement `src/sim/coc/commands.ts`:**

```ts
import { hexKey, hexNeighbors } from "@/game/world";
import { BUILDINGS, ccTier, levelDef, maxLevelOf, STARTING_BUILDERS, STARTING_ELIXIR, STARTING_GOLD } from "./config";
import { ccLevel, freeBuilders, storageCap } from "./world";
import type { CocBase, CocBuildingId, CocCommand, CocResource, CocWorld, CommandResult, PlacedBuilding } from "./types";

function fail(state: CocWorld, error: string): CommandResult {
  return { state, error };
}

function countOf(base: CocBase, id: CocBuildingId): number {
  return Object.values(base.buildings).filter((b) => b.id === id).length;
}
function hasJobOn(base: CocBase, key: string): boolean {
  return base.jobs.some((j) => j.hexKey === key);
}
function canAfford(base: CocBase, cost: Partial<Record<CocResource, number>>): boolean {
  return (base.gold >= (cost.gold ?? 0)) && (base.elixir >= (cost.elixir ?? 0));
}
function spend(base: CocBase, cost: Partial<Record<CocResource, number>>): { gold: number; elixir: number } {
  return { gold: base.gold - (cost.gold ?? 0), elixir: base.elixir - (cost.elixir ?? 0) };
}

function claimBase(state: CocWorld, playerId: string, q: number, r: number): CommandResult {
  if (!state.players[playerId]) return fail(state, "Unknown player.");
  if (state.bases[playerId]) return fail(state, "You already have a base.");
  const centerKey = hexKey(q, r);
  if (!state.hexes[centerKey]) return fail(state, "No such hex.");
  const cluster = [centerKey, ...hexNeighbors(q, r).map((n) => hexKey(n.q, n.r))];
  for (const k of cluster) {
    if (!state.hexes[k]) return fail(state, "Base must be fully inside the map.");
    if (state.claimedHexes[k]) return fail(state, "That land is already claimed.");
  }
  const base: CocBase = {
    owner: playerId,
    centerKey,
    ownedHexes: cluster,
    buildings: { [centerKey]: { id: "commandCenter", level: 1 } },
    gold: STARTING_GOLD,
    elixir: STARTING_ELIXIR,
    builders: STARTING_BUILDERS,
    jobs: [],
  };
  const claimedHexes = { ...state.claimedHexes };
  for (const k of cluster) claimedHexes[k] = playerId;
  return { state: { ...state, bases: { ...state.bases, [playerId]: base }, claimedHexes } };
}

function placeBuilding(state: CocWorld, playerId: string, key: string, buildingId: CocBuildingId): CommandResult {
  const base = state.bases[playerId];
  if (!base) return fail(state, "You have no base.");
  if (buildingId === "commandCenter") return fail(state, "The Command Center cannot be placed.");
  if (!base.ownedHexes.includes(key)) return fail(state, "That hex is not in your base.");
  if (base.buildings[key]) return fail(state, "That hex is already occupied.");
  const cap = ccTier(ccLevel(base)).caps[buildingId];
  if (!cap) return fail(state, "Locked at this Command Center level.");
  if (countOf(base, buildingId) >= cap.maxCount) return fail(state, "Build limit reached for this Command Center level.");
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
    buildings: { ...base.buildings, [key]: building },
    jobs: [...base.jobs, { hexKey: key, buildingId, kind: "build", toLevel: 1, finishesAtTick: state.tick + lv.buildTimeSec }],
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
    if (!cap || nextLevel > cap.maxLevel) return fail(state, "Upgrade the Command Center to raise the level cap.");
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
    jobs: [...base.jobs, { hexKey: key, buildingId: b.id, kind: "upgrade", toLevel: nextLevel, finishesAtTick: state.tick + lv.buildTimeSec }],
  };
  return { state: { ...state, bases: { ...state.bases, [playerId]: newBase } } };
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
  return { state: { ...state, bases: { ...state.bases, [playerId]: { ...base, gold, elixir, buildings } } } };
}

function expandCluster(state: CocWorld, playerId: string, q: number, r: number): CommandResult {
  const base = state.bases[playerId];
  if (!base) return fail(state, "You have no base.");
  const key = hexKey(q, r);
  if (!state.hexes[key]) return fail(state, "No such hex.");
  if (state.claimedHexes[key]) return fail(state, "That land is already claimed.");
  if (base.ownedHexes.length >= ccTier(ccLevel(base)).maxHexes) {
    return fail(state, "Upgrade the Command Center to expand your territory.");
  }
  const adjacent = hexNeighbors(q, r).some((n) => base.ownedHexes.includes(hexKey(n.q, n.r)));
  if (!adjacent) return fail(state, "You can only expand onto land next to your base.");
  const newBase: CocBase = { ...base, ownedHexes: [...base.ownedHexes, key] };
  return { state: { ...state, bases: { ...state.bases, [playerId]: newBase }, claimedHexes: { ...state.claimedHexes, [key]: playerId } } };
}

export function applyCommand(state: CocWorld, playerId: string, cmd: CocCommand): CommandResult {
  switch (cmd.type) {
    case "claimBase": return claimBase(state, playerId, cmd.q, cmd.r);
    case "placeBuilding": return placeBuilding(state, playerId, cmd.hexKey, cmd.buildingId);
    case "upgradeBuilding": return upgradeBuilding(state, playerId, cmd.hexKey);
    case "collect": return collect(state, playerId);
    case "expandCluster": return expandCluster(state, playerId, cmd.q, cmd.r);
    default: return fail(state, "Unknown command.");
  }
}
```

- [ ] **Step 4: Run it, verify it passes** — `npx vitest run src/sim/coc/commands.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/coc/commands.ts src/sim/coc/commands.test.ts
git commit -m "feat(coc): commands — claim, build, upgrade, collect, expand"
```

---

## Task 6: Barrel export + full sim suite

**Files:**
- Create: `src/sim/coc/index.ts`

- [ ] **Step 1: Create `src/sim/coc/index.ts`:**

```ts
export * from "./types";
export * from "./config";
export * from "./world";
export * from "./tick";
export * from "./commands";
```

- [ ] **Step 2: Run the whole sim suite** — `npx vitest run` → all PASS (new CoC tests + untouched old `src/sim/*` tests + `src/game/world.test.ts`).

- [ ] **Step 3: Typecheck** — `npx tsc --noEmit` → no errors.

- [ ] **Step 4: Commit**

```bash
git add src/sim/coc/index.ts
git commit -m "feat(coc): barrel export for the SP0 ruleset"
```

---

## Task 7: Repoint the server at the CoC ruleset

**Files:**
- Modify: `server/index.ts`
- Modify: `server/index.test.ts`

- [ ] **Step 1: Rewrite the server test** — replace the body of `server/index.test.ts`'s `describe("server", ...)` (keep the imports, `srv`, `connect`, `waitFor` helpers) with:

```ts
describe("server", () => {
  it("welcomes a client and broadcasts a base claim to both clients", async () => {
    const a = await connect();
    const b = await connect();
    expect(a.first.type).toBe("welcome");
    expect(typeof a.first.playerId).toBe("string");

    const want = waitFor(b.ws, (m) => m.type === "state" && m.state.bases[a.first.playerId]?.ownedHexes.length === 7);
    a.ws.send(JSON.stringify({ type: "command", cmd: { type: "claimBase", q: 0, r: 0 } }));
    const got = await want;

    expect(got.state.bases[a.first.playerId].ownedHexes.length).toBe(7);
    a.ws.close();
    b.ws.close();
  });

  it("rejects an invalid claim with an error to the issuer", async () => {
    const a = await connect();
    const errMsg = waitFor(a.ws, (m) => m.type === "error");
    a.ws.send(JSON.stringify({ type: "command", cmd: { type: "claimBase", q: 999, r: 999 } }));
    const err = await errMsg;
    expect(err.message).toMatch(/hex/i);
    a.ws.close();
  });
});
```

- [ ] **Step 2: Run it, verify it fails** — `cd server && npx vitest run index.test.ts` → FAIL (server still runs the old ruleset; `bases` is undefined).

- [ ] **Step 3: Repoint `server/index.ts`** — change the sim imports (lines 3-6) and the two type annotations:

Replace:
```ts
import { createWorld, addPlayer, normalizeWorld } from "@/sim/world";
import { applyCommand } from "@/sim/commands";
import { applyTick } from "@/sim/tick";
import type { WorldState, Command } from "@/sim/types";
```
with:
```ts
import { createWorld, addPlayer, normalizeWorld, applyCommand, applyTick } from "@/sim/coc";
import type { CocWorld, CocCommand } from "@/sim/coc";
```

Replace `let state: WorldState =` with `let state: CocWorld =`.

Replace the message handler block:
```ts
      if (parsed.type !== "command" || !parsed.cmd) return;
      const result = applyCommand(state, playerId, parsed.cmd);
      if (result.error) {
        ws.send(JSON.stringify({ type: "error", message: result.error }));
        return;
      }
      state = result.state;
      if (result.report) ws.send(JSON.stringify({ type: "report", report: result.report }));
      broadcast();
```
with:
```ts
      if (parsed.type !== "command" || !parsed.cmd) return;
      const result = applyCommand(state, playerId, parsed.cmd);
      if (result.error) {
        ws.send(JSON.stringify({ type: "error", message: result.error }));
        return;
      }
      state = result.state;
      broadcast();
```

And change the `parsed` type:
```ts
      let parsed: { type?: string; cmd?: CocCommand };
```

- [ ] **Step 4: Run it, verify it passes** — `cd server && npx vitest run index.test.ts` → PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add server/index.ts server/index.test.ts
git commit -m "feat(coc): run the authoritative server on the CoC ruleset"
```

---

## Task 8: Client ws hook for the CoC ruleset

**Files:**
- Create: `src/lib/useBaseSocket.ts`

- [ ] **Step 1: Create `src/lib/useBaseSocket.ts`:**

```ts
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { CocCommand, CocWorld } from "@/sim/coc";

export interface BaseSocket {
  state: CocWorld | null;
  playerId: string | null;
  connected: boolean;
  error: string | null;
  send: (cmd: CocCommand) => void;
}

export function useBaseSocket(url: string): BaseSocket {
  const [state, setState] = useState<CocWorld | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    ref.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "welcome") {
        setPlayerId(msg.playerId);
        setState(msg.state);
      } else if (msg.type === "state") {
        setState(msg.state);
      } else if (msg.type === "error") {
        setError(msg.message);
        setTimeout(() => setError(null), 4000);
      }
    };
    return () => ws.close();
  }, [url]);

  const send = useCallback((cmd: CocCommand) => {
    ref.current?.send(JSON.stringify({ type: "command", cmd }));
  }, []);

  return { state, playerId, connected, error, send };
}
```

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` → no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/useBaseSocket.ts
git commit -m "feat(coc): client ws hook for the base-builder ruleset"
```

---

## Task 9: Rewrite `/world` as the functional base-builder UI

**Files:**
- Modify (full rewrite): `src/app/world/page.tsx`

> Functional UI only — the polished art comes from the separate "claude design" pass. Verified manually (no component-test harness in this repo).

- [ ] **Step 1: Replace `src/app/world/page.tsx` entirely with:**

```tsx
"use client";
import { useState } from "react";
import { useBaseSocket } from "@/lib/useBaseSocket";
import { axialToPixel } from "@/game/world";
import {
  BUILDINGS, ccTier, levelDef, maxLevelOf,
  type CocBase, type CocBuildingId, type CocResource, type CocWorld,
} from "@/sim/coc";

const SERVER_URL = process.env.NEXT_PUBLIC_GAME_SERVER_URL ?? "ws://localhost:8080";
const SIZE = 16;
const ICON: Record<CocBuildingId, string> = {
  commandCenter: "🏛️", goldCollector: "⛏️", elixirCollector: "🛢️", goldStorage: "🏦", elixirStorage: "🛍️",
};

function ccLevelOf(base: CocBase): number {
  return base.buildings[base.centerKey]?.level ?? 1;
}
function storageCapOf(base: CocBase, res: CocResource): number {
  let cap = 1000;
  for (const b of Object.values(base.buildings)) {
    const def = BUILDINGS[b.id];
    if (def.stores === res && b.level >= 1) cap += def.levels[b.level - 1]?.storageCap ?? 0;
  }
  return cap;
}

export default function WorldPage() {
  const { state, playerId, connected, error, send } = useBaseSocket(SERVER_URL);
  const [sel, setSel] = useState<string | null>(null);

  if (!state) return <main style={page}>{connected ? "Loading world…" : `Connecting to ${SERVER_URL}…`}</main>;

  const myBase: CocBase | null = playerId ? state.bases[playerId] ?? null : null;
  const tier = myBase ? ccTier(ccLevelOf(myBase)) : null;
  const freeBuilders = myBase ? myBase.builders - myBase.jobs.length : 0;
  const jobByHex = new Map(myBase?.jobs.map((j) => [j.hexKey, j]) ?? []);
  const selBuilding = myBase && sel ? myBase.buildings[sel] : null;

  function onHexClick(key: string, q: number, r: number) {
    if (!myBase) {
      send({ type: "claimBase", q, r });
      return;
    }
    if (myBase.ownedHexes.includes(key)) setSel(key);
  }

  const buildable: CocBuildingId[] = tier
    ? (Object.keys(tier.caps) as CocBuildingId[])
    : [];

  return (
    <main style={page}>
      <h1 style={{ margin: "0 0 6px", fontSize: 20 }}>WARLANDS · Live World</h1>
      <div style={{ fontSize: 13, opacity: 0.85 }}>
        {connected ? "🟢" : "🔴"} tick {state.tick} · players {Object.keys(state.players).length}
      </div>
      {error && <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 4 }}>⚠ {error}</div>}

      {/* HUD */}
      {myBase && (
        <div style={hud}>
          <span>🪙 {Math.floor(myBase.gold)} / {storageCapOf(myBase, "gold")}</span>
          <span>🧪 {Math.floor(myBase.elixir)} / {storageCapOf(myBase, "elixir")}</span>
          <span>🏛️ CC {ccLevelOf(myBase)}</span>
          <span>🔨 {freeBuilders}/{myBase.builders} free</span>
          <button style={btn} onClick={() => send({ type: "collect" })}>Collect</button>
        </div>
      )}

      {!myBase && (
        <div style={{ ...hud, color: "#9fe" }}>👉 Tap an empty hex (with all 6 neighbors free) to claim your base.</div>
      )}

      {/* Map */}
      <div style={mapWrap}>
        <svg viewBox="-200 -200 400 400" style={{ width: "100%", height: "100%", display: "block" }}>
          {Object.values(state.hexes).map((h) => {
            const key = `${h.q},${h.r}`;
            const { x, y } = axialToPixel(h.q, h.r, SIZE);
            const owner = state.claimedHexes[key];
            const mine = owner && owner === playerId;
            const b = mine ? myBase!.buildings[key] : undefined;
            const job = mine ? jobByHex.get(key) : undefined;
            const fill = mine ? (sel === key ? "#1d4ed8" : "#13335f") : owner ? "#3a1d1d" : "#11141b";
            return (
              <g key={key} transform={`translate(${x},${y})`} onClick={() => onHexClick(key, h.q, h.r)} style={{ cursor: "pointer" }}>
                <polygon points={hexPoints(SIZE)} fill={fill} stroke={mine ? "#5b8def" : "#222"} strokeWidth={0.6} />
                {b && <text textAnchor="middle" dy="3" fontSize="11">{ICON[b.id]}</text>}
                {b && b.level >= 1 && <text textAnchor="middle" dy="13" fontSize="6" fill="#bcd">L{b.level}</text>}
                {job && <text textAnchor="middle" dy="-7" fontSize="6" fill="#fb3">⏳{Math.max(0, job.finishesAtTick - state.tick)}s</text>}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected-hex panel */}
      {myBase && sel && (
        <div style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{sel}</strong>
            <button style={btnGhost} onClick={() => setSel(null)}>✕</button>
          </div>
          {selBuilding ? (
            <BuildingInfo base={myBase} building={selBuilding} hexKey={sel} busy={jobByHex.has(sel)} freeBuilders={freeBuilders}
              onUpgrade={() => send({ type: "upgradeBuilding", hexKey: sel })} />
          ) : (
            <div>
              <div style={{ opacity: 0.8, fontSize: 12, margin: "6px 0" }}>Empty hex — build:</div>
              {buildable.map((id) => {
                const cost = levelDef(id, 1)!.cost;
                const time = levelDef(id, 1)!.buildTimeSec;
                const count = Object.values(myBase.buildings).filter((x) => x.id === id).length;
                const cap = tier!.caps[id]!;
                const atCap = count >= cap.maxCount;
                const afford = (myBase.gold >= (cost.gold ?? 0)) && (myBase.elixir >= (cost.elixir ?? 0));
                const ok = !atCap && afford && freeBuilders > 0;
                return (
                  <button key={id} style={{ ...rowBtn, opacity: ok ? 1 : 0.45 }} disabled={!ok}
                    onClick={() => send({ type: "placeBuilding", hexKey: sel, buildingId: id })}>
                    {ICON[id]} {BUILDINGS[id].name} · {costStr(cost)} · ⏳{time}s {atCap ? "· (limit)" : ""}
                  </button>
                );
              })}
              <ExpandRow base={myBase} state={state} hexKey={sel} onExpand={(q, r) => send({ type: "expandCluster", q, r })} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function BuildingInfo({ base, building, busy, freeBuilders, onUpgrade }: {
  base: CocBase; building: { id: CocBuildingId; level: number; buffer?: number }; hexKey: string; busy: boolean; freeBuilders: number; onUpgrade: () => void;
}) {
  const next = building.level + 1;
  const maxed = next > maxLevelOf(building.id);
  const cap = ccTier(base.buildings[base.centerKey]?.level ?? 1).caps[building.id];
  const ccBlocked = building.id !== "commandCenter" && (!cap || next > cap.maxLevel);
  const cost = !maxed ? levelDef(building.id, next)?.cost ?? {} : {};
  const afford = (base.gold >= (cost.gold ?? 0)) && (base.elixir >= (cost.elixir ?? 0));
  const ok = building.level >= 1 && !busy && !maxed && !ccBlocked && afford && freeBuilders > 0;
  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ margin: "6px 0" }}>{ICON[building.id]} {BUILDINGS[building.id].name} {building.level >= 1 ? `· L${building.level}` : "· building…"}</div>
      {building.buffer != null && <div style={{ opacity: 0.8 }}>buffer: {Math.floor(building.buffer)}</div>}
      {maxed ? <div style={{ opacity: 0.7 }}>Max level.</div> :
        <button style={{ ...rowBtn, opacity: ok ? 1 : 0.45 }} disabled={!ok} onClick={onUpgrade}>
          ⬆ Upgrade → L{next} · {costStr(cost)} · ⏳{levelDef(building.id, next)?.buildTimeSec}s
          {ccBlocked ? " · (raise CC)" : busy ? " · (busy)" : ""}
        </button>}
    </div>
  );
}

function ExpandRow({ base, state, onExpand }: { base: CocBase; state: CocWorld; hexKey: string; onExpand: (q: number, r: number) => void }) {
  const tier = ccTier(base.buildings[base.centerKey]?.level ?? 1);
  if (base.ownedHexes.length >= tier.maxHexes) return null;
  // find an adjacent unclaimed hex to offer
  const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  for (const owned of base.ownedHexes) {
    const [oq, or] = owned.split(",").map(Number);
    for (const [dq, dr] of dirs) {
      const q = oq + dq, r = or + dr, k = `${q},${r}`;
      if (state.hexes[k] && !state.claimedHexes[k]) {
        return <button style={{ ...rowBtn, marginTop: 8 }} onClick={() => onExpand(q, r)}>➕ Annex {k} (free, CC{tier === ccTier(1) ? "" : ""} allows {tier.maxHexes})</button>;
      }
    }
  }
  return null;
}

function hexPoints(size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${(size * Math.cos(a)).toFixed(2)},${(size * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}
function costStr(cost: Partial<Record<CocResource, number>>): string {
  const parts: string[] = [];
  if (cost.gold) parts.push(`🪙${cost.gold}`);
  if (cost.elixir) parts.push(`🧪${cost.elixir}`);
  return parts.join(" ") || "free";
}

const page: React.CSSProperties = { minHeight: "100dvh", background: "#0b0d12", color: "#e6eaec", padding: 16, fontFamily: "var(--font-geist-sans), system-ui" };
const hud: React.CSSProperties = { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 10, fontSize: 13, background: "#11141b", padding: "8px 12px", borderRadius: 8 };
const mapWrap: React.CSSProperties = { position: "relative", marginTop: 12, width: "100%", maxWidth: 560, aspectRatio: "1 / 1", background: "#0a0c0d", borderRadius: 8, overflow: "hidden", touchAction: "none" };
const panel: React.CSSProperties = { marginTop: 12, maxWidth: 560, background: "#11141b", borderRadius: 8, padding: 12 };
const btn: React.CSSProperties = { background: "#1d4ed8", color: "#fff", border: 0, borderRadius: 6, padding: "4px 10px", cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "transparent", color: "#9aa4ab", border: 0, cursor: "pointer" };
const rowBtn: React.CSSProperties = { display: "block", width: "100%", textAlign: "left", background: "#182030", color: "#e6eaec", border: "1px solid #2a3036", borderRadius: 6, padding: "8px 10px", margin: "4px 0", cursor: "pointer", fontSize: 12 };
```

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` → no errors. Fix any type mismatch against the names defined in Tasks 2-6.

- [ ] **Step 3: Manual verification (local end-to-end):**

```bash
# terminal A — server (no DB needed; persistence is a no-op without DATABASE_URL)
cd server && npm install >/dev/null 2>&1; PORT=8080 npm run dev
# terminal B — client
pkill -f "next dev" 2>/dev/null; rm -rf .next; NEXT_PUBLIC_GAME_SERVER_URL=ws://localhost:8080 npm run dev
```
Open http://localhost:3000/world. Verify: tap a central empty hex → a 7-hex cluster appears (CC at center). Tap an empty owned hex → build an Elixir Collector (you start with 500 gold) → see the ⏳ timer count down → after it completes, the buffer fills each second → tap **Collect** → elixir rises (capped at 1000 until a storage exists). Upgrade the Command Center (needs 1000 gold; build/collect gold first) and confirm CC level rises and the build limits/expand option open up.

- [ ] **Step 4: Commit**

```bash
git add src/app/world/page.tsx
git commit -m "feat(coc): /world functional base-builder UI (claim, build, upgrade, collect, expand)"
```

---

## Task 10: Final verification + branch finish

- [ ] **Step 1: Full test sweep**

```bash
npx vitest run                 # root: src/**/*.test.ts (old sim + new coc + game)
cd server && npx vitest run    # server ws integration on the CoC ruleset
```
Expected: all green.

- [ ] **Step 2: Typecheck + production build**

```bash
npx tsc --noEmit
pkill -f "next dev" 2>/dev/null; rm -rf .next; npm run build
```
Expected: typecheck clean; `next build` completes (the new `/world` imports no `@solana/wallet-adapter-react-ui`, so the known build hang does not apply).

- [ ] **Step 3: Push the branch and open a PR**

```bash
git push -u origin feat/coc-pivot-sp0
gh pr create --title "WARLANDS CoC pivot — SP0: buildable base + economy" \
  --body "Implements SP0 of the CoC pivot (spec: docs/superpowers/specs/2026-06-16-warlands-coc-pivot-design.md): a new src/sim/coc ruleset (claim 7-hex cluster, Gold/Elixir collectors+storages, builders+real-time timers, Command-Center progression+expansion), the authoritative server repointed to it, and a functional /world base-builder UI. No combat/troops/defenses/shields/WAR-sinks/clans (later sub-projects).

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 4 (deploy parity — optional, only when ready to ship):** Railway `railway up --ci -s warlands-app` then Vercel `vercel --prod --yes`; probe the live ws ticking and claim a base in production.

---

## Self-Review (done while writing)

- **Spec coverage:** SP0 scope items 1-5 all mapped — (1) new ruleset modules + commands + tick + CC progression → Tasks 2-6; (2) server reuse + repoint + extend state → Task 7; (3) client `/world` base-editor + HUD → Tasks 8-9; (4) tutorial → the inline coachmark in Task 9 (minimal, replaces the Zustand-coupled `TutorialOverlay`); (5) tests → Tasks 1-7. Out-of-scope items (combat/troops/defenses/shields/WAR-sinks/clans) intentionally omitted.
- **Type consistency:** `CocWorld`, `CocBase`, `CocPlayer`, `CocCommand`, `CocBuildingId`, `CocResource`, `PlacedBuilding`, `BuildJob`, `CommandResult` are defined once in `types.ts` and used verbatim in `config.ts`, `world.ts`, `tick.ts`, `commands.ts`, the server, the hook, and the page. Functions `createWorld/addPlayer/ccLevel/storageCap/freeBuilders/normalizeWorld/applyTick/applyCommand` and config helpers `levelDef/maxLevelOf/ccTier` are referenced consistently.
- **No placeholders:** every code step contains complete, runnable code; CC1-5 and all building levels are fully enumerated (data, not TODOs).
- **Determinism / immutability:** all sim functions return new objects (spread), matching the existing frame; 1 tick = 1 s so `finishesAtTick = tick + buildTimeSec`.
