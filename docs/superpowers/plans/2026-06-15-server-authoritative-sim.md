# Server-Authoritative Simulation (Slice 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a server-authoritative multiplayer slice where multiple clients share one map, an authoritative 1 Hz tick runs on a Node server, and `stake`/`build` commands flow client → validate → apply → broadcast → persist (Postgres), deployed on Railway + Vercel.

**Architecture:** A pure isomorphic `src/sim` core (no IO) holds the world model + rules. A `server/` Node + `ws` service owns authoritative state in memory, ticks it, applies validated commands, broadcasts JSON snapshots, and snapshots to Postgres. A `/world` Next route renders server state and sends commands. The single-player `/play` is untouched.

**Tech Stack:** TypeScript · Node + `ws` · `pg` (Railway Postgres) · `tsx` (run TS on server) · Vitest (tests) · Next 16 / React 19 (client).

---

## File structure

- `src/sim/types.ts` — `WorldState`, `SimPlot`, `SimPlayer`, `PlacedBuilding`, `Command`, `CommandResult`
- `src/sim/world.ts` — `createWorld(seed)`, `addPlayer(state, id)`, `storageCap(plot)`
- `src/sim/tick.ts` — `applyTick(state)`
- `src/sim/commands.ts` — `applyCommand(state, playerId, cmd)`
- `src/sim/index.ts` — barrel
- `src/sim/*.test.ts` — Vitest unit tests
- `server/package.json`, `server/tsconfig.json`, `server/.env.example`
- `server/db.ts` — snapshot load/save (Postgres, graceful when no `DATABASE_URL`)
- `server/index.ts` — ws server, tick loop, command routing, broadcast
- `server/index.test.ts` — two-client integration test
- `src/lib/useWorldSocket.ts` — client ws hook
- `src/app/world/page.tsx` — minimal `/world` renderer

Constants reused from `src/game`: `WORLD_RADIUS=9`, `STORAGE_BASE_CAP=1500`. New: `STARTING_WAR=200_000` (per-player starting balance).

---

### Task 0: Test tooling

**Files:** Modify `package.json`

- [ ] **Step 1: Add Vitest + scripts**

Add to devDependencies: `"vitest": "^2.1.8"`. Add scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 2: Install**

Run: `npm install`
Expected: vitest added, no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "test: add vitest"
```

---

### Task 1: `src/sim/types.ts`

**Files:** Create `src/sim/types.ts`

- [ ] **Step 1: Write the types** (no test — pure declarations)

```ts
import type { TerrainId } from "@/game/plotTypes";
import type { BuildingId } from "@/game/buildings";
import type { ResourceBag } from "@/game/resources";
import type { Hex } from "@/game/world";

export interface PlacedBuilding {
  id: BuildingId;
  level: number;
}

export interface SimPlayer {
  id: string;
  war: number;
  joinedTick: number;
}

export interface SimPlot {
  q: number;
  r: number;
  terrain: TerrainId;
  owner: string;          // SimPlayer.id
  claimIndex: number;     // per-player claim order -> diminishing returns
  stakeLocked: number;
  buildings: PlacedBuilding[];
  resources: ResourceBag;
}

export interface WorldState {
  seed: number;
  radius: number;
  tick: number;
  hexes: Record<string, Hex>;        // serializable (was Map)
  plots: Record<string, SimPlot>;    // keyed by "q,r"
  players: Record<string, SimPlayer>;
}

export type Command =
  | { type: "stake"; q: number; r: number }
  | { type: "build"; key: string; buildingId: BuildingId };

export interface CommandResult {
  state: WorldState;
  error?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/sim/types.ts
git commit -m "feat(sim): world model types"
```

---

### Task 2: `src/sim/world.ts` — createWorld, addPlayer, storageCap

**Files:** Create `src/sim/world.ts`, Test `src/sim/world.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { createWorld, addPlayer, storageCap } from "./world";

describe("createWorld", () => {
  it("creates a radius-9 world with the expected hex count and tick 0", () => {
    const w = createWorld(123);
    expect(w.radius).toBe(9);
    expect(w.tick).toBe(0);
    // axial hexes within distance 9 => 1 + 3*9*(9+1) = 271
    expect(Object.keys(w.hexes).length).toBe(271);
    expect(Object.keys(w.plots).length).toBe(0);
  });
  it("is deterministic for the same seed", () => {
    expect(createWorld(7)).toEqual(createWorld(7));
  });
});

describe("addPlayer", () => {
  it("adds a player with the starting balance", () => {
    const w = addPlayer(createWorld(1), "p1");
    expect(w.players.p1.war).toBe(200_000);
    expect(w.players.p1.joinedTick).toBe(0);
  });
  it("is idempotent (re-adding keeps existing balance)", () => {
    let w = addPlayer(createWorld(1), "p1");
    w = { ...w, players: { ...w.players, p1: { ...w.players.p1, war: 5 } } };
    w = addPlayer(w, "p1");
    expect(w.players.p1.war).toBe(5);
  });
});

describe("storageCap", () => {
  it("is the base cap with no warehouse", () => {
    const w = createWorld(1);
    expect(
      storageCap({ q: 0, r: 0, terrain: "plains", owner: "p1", claimIndex: 1, stakeLocked: 0, buildings: [{ id: "camp", level: 1 }], resources: {} }),
    ).toBe(1500);
  });
  it("adds 2000 per warehouse level", () => {
    expect(
      storageCap({ q: 0, r: 0, terrain: "plains", owner: "p1", claimIndex: 1, stakeLocked: 0, buildings: [{ id: "camp", level: 1 }, { id: "warehouse", level: 2 }], resources: {} }),
    ).toBe(1500 + 2000 * 2);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/sim/world.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
import { generateWorld, hexKey } from "@/game/world";
import { BUILDINGS } from "@/game/buildings";
import type { SimPlot, SimPlayer, WorldState } from "./types";

export const WORLD_RADIUS = 9;
export const STORAGE_BASE_CAP = 1500;
export const STARTING_WAR = 200_000;

export function createWorld(seed: number): WorldState {
  const { radius, hexes } = generateWorld(WORLD_RADIUS);
  const hexRecord: WorldState["hexes"] = {};
  for (const [k, h] of hexes) hexRecord[k] = h;
  return { seed, radius, tick: 0, hexes: hexRecord, plots: {}, players: {} };
}

export function addPlayer(state: WorldState, id: string): WorldState {
  if (state.players[id]) return state;
  const player: SimPlayer = { id, war: STARTING_WAR, joinedTick: state.tick };
  return { ...state, players: { ...state.players, [id]: player } };
}

export function storageCap(plot: SimPlot): number {
  let cap = STORAGE_BASE_CAP;
  for (const b of plot.buildings) {
    const def = BUILDINGS[b.id];
    if (def.kind === "storage" && def.capacity) cap += def.capacity * b.level;
  }
  return cap;
}

export { hexKey };
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/sim/world.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/world.ts src/sim/world.test.ts
git commit -m "feat(sim): world creation, players, storage cap"
```

---

### Task 3: `src/sim/tick.ts` — applyTick (extractor production + upkeep)

**Files:** Create `src/sim/tick.ts`, Test `src/sim/tick.test.ts`

Faithful port of the extractor branch of the store tick (`store.ts:1148-1204`): for each extractor, `productionPerTick({ base, terrainMult, level, workforceMult: 1, plotIndex })`, capped at `storageCap`; then upkeep removes `plotUpkeep(claimIndex) * buildings.length` food & water. Factories/training are out of this slice. Deterministic (no RNG).

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { applyTick } from "./tick";
import { createWorld, addPlayer } from "./world";
import type { SimPlot, WorldState } from "./types";

function worldWithFarm(): WorldState {
  let w = addPlayer(createWorld(1), "p1");
  const plot: SimPlot = {
    q: 0, r: 0, terrain: "plains", owner: "p1", claimIndex: 1, stakeLocked: 10000,
    buildings: [{ id: "camp", level: 1 }, { id: "farm", level: 1 }],
    resources: { food: 100, water: 100 },
  };
  w = { ...w, plots: { "0,0": plot } };
  return w;
}

describe("applyTick", () => {
  it("advances the tick counter", () => {
    expect(applyTick(createWorld(1)).tick).toBe(1);
  });
  it("produces food from a farm on plains (net of upkeep)", () => {
    const after = applyTick(worldWithFarm());
    // farm baseOutput 6, terrainMult 1, level 1, workforce 1, DR(1)=1 => +6; upkeep small
    expect(after.plots["0,0"].resources.food).toBeGreaterThan(100);
  });
  it("is deterministic", () => {
    const w = worldWithFarm();
    expect(applyTick(w)).toEqual(applyTick(w));
  });
  it("does not exceed storage cap", () => {
    let w = worldWithFarm();
    w = { ...w, plots: { "0,0": { ...w.plots["0,0"], resources: { food: 1500, water: 1500 } } } };
    expect(applyTick(w).plots["0,0"].resources.food!).toBeLessThanOrEqual(1500);
  });
});
```

- [ ] **Step 2: Run, verify fail.** Run: `npm test -- src/sim/tick.test.ts` → FAIL.

- [ ] **Step 3: Implement**

```ts
import { BUILDINGS } from "@/game/buildings";
import { PLOT_TYPES } from "@/game/plotTypes";
import { productionPerTick, plotUpkeep } from "@/game/formulas";
import type { ResourceId } from "@/game/resources";
import type { SimPlot, WorldState } from "./types";
import { storageCap } from "./world";

function addRes(bag: SimPlot["resources"], id: ResourceId, amount: number, cap: number): void {
  bag[id] = Math.min(cap, (bag[id] ?? 0) + amount);
}

function tickPlot(plot: SimPlot): SimPlot {
  const terrain = PLOT_TYPES[plot.terrain];
  const cap = storageCap(plot);
  const resources = { ...plot.resources };
  for (const b of plot.buildings) {
    const def = BUILDINGS[b.id];
    if (def.kind === "extractor" && def.extracts && def.baseOutput) {
      const out = productionPerTick({
        base: def.baseOutput,
        terrainMult: terrain.yields[def.extracts] ?? 1,
        level: b.level,
        workforceMult: 1,
        plotIndex: plot.claimIndex,
      });
      addRes(resources, def.extracts, out, cap);
    }
  }
  const upkeep = plotUpkeep(plot.claimIndex) * plot.buildings.length;
  resources.food = Math.max(0, (resources.food ?? 0) - upkeep);
  resources.water = Math.max(0, (resources.water ?? 0) - upkeep);
  return { ...plot, resources };
}

export function applyTick(state: WorldState): WorldState {
  const plots: WorldState["plots"] = {};
  for (const [key, plot] of Object.entries(state.plots)) plots[key] = tickPlot(plot);
  return { ...state, tick: state.tick + 1, plots };
}
```

- [ ] **Step 4: Run, verify pass.** Run: `npm test -- src/sim/tick.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/tick.ts src/sim/tick.test.ts
git commit -m "feat(sim): authoritative tick (extractor production + upkeep)"
```

---

### Task 4: `src/sim/commands.ts` — applyCommand (stake, build)

**Files:** Create `src/sim/commands.ts`, Test `src/sim/commands.test.ts`

Faithful port of `claimPlot` (`store.ts:423`) and `build` (`store.ts:459`), but ownership- and balance-scoped to `playerId`, and `claimIndex` is the count of that player's existing plots + 1.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { applyCommand } from "./commands";
import { createWorld, addPlayer } from "./world";
import { PLOT_TYPES } from "@/game/plotTypes";
import type { WorldState } from "./types";

// find a plains hex for predictable stake cost
function plainsKey(w: WorldState): string {
  return Object.keys(w.hexes).find((k) => w.hexes[k].terrain === "plains")!;
}

describe("stake", () => {
  it("claims a plot and locks stake from the player's balance", () => {
    const w = addPlayer(createWorld(1), "p1");
    const key = plainsKey(w);
    const [q, r] = key.split(",").map(Number);
    const { state, error } = applyCommand(w, "p1", { type: "stake", q, r });
    expect(error).toBeUndefined();
    expect(state.plots[key].owner).toBe("p1");
    expect(state.players.p1.war).toBe(200_000 - PLOT_TYPES.plains.stake);
    expect(state.plots[key].claimIndex).toBe(1);
  });
  it("rejects an already-owned hex", () => {
    const w = addPlayer(createWorld(1), "p1");
    const key = plainsKey(w);
    const [q, r] = key.split(",").map(Number);
    const once = applyCommand(w, "p1", { type: "stake", q, r }).state;
    const { error } = applyCommand(once, "p2", { type: "stake", q, r });
    expect(error).toMatch(/already/i);
  });
  it("rejects when the player cannot afford the stake", () => {
    let w = addPlayer(createWorld(1), "poor");
    w = { ...w, players: { ...w.players, poor: { ...w.players.poor, war: 0 } } };
    const key = plainsKey(w);
    const [q, r] = key.split(",").map(Number);
    const { error } = applyCommand(w, "poor", { type: "stake", q, r });
    expect(error).toMatch(/\$WAR/);
  });
});

describe("build", () => {
  it("builds a farm on an owned plains plot, spending $WAR + resources", () => {
    const w0 = addPlayer(createWorld(1), "p1");
    const key = plainsKey(w0);
    const [q, r] = key.split(",").map(Number);
    const w1 = applyCommand(w0, "p1", { type: "stake", q, r }).state;
    const warBefore = w1.players.p1.war;
    const { state, error } = applyCommand(w1, "p1", { type: "build", key, buildingId: "farm" });
    expect(error).toBeUndefined();
    expect(state.plots[key].buildings.some((b) => b.id === "farm")).toBe(true);
    expect(state.players.p1.war).toBe(warBefore - 200); // farm baseCost
  });
  it("rejects building on a plot you don't own", () => {
    const w0 = addPlayer(addPlayer(createWorld(1), "p1"), "p2");
    const key = plainsKey(w0);
    const [q, r] = key.split(",").map(Number);
    const w1 = applyCommand(w0, "p1", { type: "stake", q, r }).state;
    const { error } = applyCommand(w1, "p2", { type: "build", key, buildingId: "farm" });
    expect(error).toMatch(/not your plot/i);
  });
});
```

- [ ] **Step 2: Run, verify fail.** Run: `npm test -- src/sim/commands.test.ts` → FAIL.

- [ ] **Step 3: Implement**

```ts
import { PLOT_TYPES } from "@/game/plotTypes";
import { BUILDINGS, isBuildingAllowedOnTerrain } from "@/game/buildings";
import { hexKey } from "@/game/world";
import type { ResourceBag, ResourceId } from "@/game/resources";
import type { Command, CommandResult, PlacedBuilding, SimPlot, WorldState } from "./types";

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
    q, r, terrain: hex.terrain, owner: playerId, claimIndex, stakeLocked: def.stake,
    buildings: [{ id: "camp", level: 1 }],
    resources: { food: 100, water: 100, wood: 100, stone: 100 },
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
  if (!isBuildingAllowedOnTerrain(def, PLOT_TYPES[plot.terrain].produces)) return fail(state, `Can't build ${def.name} on ${plot.terrain}.`);
  const camp = plot.buildings.find((b) => b.id === "camp");
  const slotCap = 3 + (camp?.level ?? 1) * 2;
  if (plot.buildings.filter((b) => b.id !== "camp").length >= slotCap) return fail(state, "No free building slots.");
  if (player.war < def.baseCost) return fail(state, `Need ${def.baseCost.toLocaleString()} $WAR.`);
  if (!hasResources(plot.resources, def.baseResourceCost)) return fail(state, `Missing resources for ${def.name}.`);
  const resources = { ...plot.resources };
  spendResources(resources, def.baseResourceCost);
  const updated: SimPlot = { ...plot, resources, buildings: [...plot.buildings, { id: buildingId, level: 1 }] };
  return {
    state: {
      ...state,
      plots: { ...state.plots, [key]: updated },
      players: { ...state.players, [playerId]: { ...player, war: player.war - def.baseCost } },
    },
  };
}

export function applyCommand(state: WorldState, playerId: string, cmd: Command): CommandResult {
  switch (cmd.type) {
    case "stake": return stake(state, playerId, cmd.q, cmd.r);
    case "build": return build(state, playerId, cmd.key, cmd.buildingId);
    default: return fail(state, "Unknown command.");
  }
}
```

- [ ] **Step 4: Run, verify pass.** Run: `npm test -- src/sim/commands.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/commands.ts src/sim/commands.test.ts
git commit -m "feat(sim): stake + build commands with validation"
```

---

### Task 5: `src/sim/index.ts` — barrel

**Files:** Create `src/sim/index.ts`

- [ ] **Step 1: Implement**

```ts
export * from "./types";
export * from "./world";
export * from "./tick";
export * from "./commands";
```

- [ ] **Step 2: Run full sim suite.** Run: `npm test -- src/sim` → all PASS.

- [ ] **Step 3: Commit**

```bash
git add src/sim/index.ts
git commit -m "feat(sim): barrel export"
```

---

### Task 6: `server/` scaffold + Postgres snapshot persistence

**Files:** Create `server/package.json`, `server/tsconfig.json`, `server/.env.example`, `server/db.ts`

- [ ] **Step 1: server/package.json**

```json
{
  "name": "warlands-server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch index.ts",
    "start": "tsx index.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "pg": "^8.13.1",
    "tsx": "^4.19.2",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "@types/pg": "^8.11.10",
    "@types/ws": "^8.5.13",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: server/tsconfig.json** (resolves `@/` to ../src so it can import the sim)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": { "@/*": ["../src/*"] }
  },
  "include": ["**/*.ts", "../src/sim/**/*.ts", "../src/game/**/*.ts"]
}
```

- [ ] **Step 3: server/.env.example**

```
PORT=8080
DATABASE_URL=
WORLD_SEED=1
```

- [ ] **Step 4: server/db.ts** — load/save JSONB snapshot; no-op when `DATABASE_URL` unset

```ts
import pg from "pg";
import type { WorldState } from "@/sim";

const url = process.env.DATABASE_URL;
const pool = url ? new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } }) : null;

export async function initDb(): Promise<void> {
  if (!pool) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS world_snapshots (
    id SERIAL PRIMARY KEY,
    tick INTEGER NOT NULL,
    state JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
}

export async function loadLatest(): Promise<WorldState | null> {
  if (!pool) return null;
  const { rows } = await pool.query("SELECT state FROM world_snapshots ORDER BY id DESC LIMIT 1");
  return rows[0]?.state ?? null;
}

export async function saveSnapshot(state: WorldState): Promise<void> {
  if (!pool) return;
  await pool.query("INSERT INTO world_snapshots (tick, state) VALUES ($1, $2)", [state.tick, state]);
}
```

- [ ] **Step 5: Install server deps.** Run: `cd server && npm install` → ok.

- [ ] **Step 6: Commit**

```bash
git add server/package.json server/package-lock.json server/tsconfig.json server/.env.example server/db.ts
git commit -m "feat(server): scaffold + postgres snapshot persistence"
```

---

### Task 7: `server/index.ts` — ws server, tick loop, command routing, broadcast

**Files:** Create `server/index.ts`, Test `server/index.test.ts`

Protocol (JSON, both directions):
- Server → client on connect: `{ type: "welcome", playerId, state }`
- Server → all on change/tick: `{ type: "state", state }`
- Server → issuer on rejected command: `{ type: "error", message }`
- Client → server: `{ type: "command", cmd: Command }`

- [ ] **Step 1: Write failing integration test**

```ts
import { describe, it, expect, afterAll } from "vitest";
import { WebSocket } from "ws";
import { startServer } from "./index";

const srv = startServer({ port: 0, seed: 1, tickMs: 0, persistEvery: 0 });
const port = srv.port;
afterAll(() => srv.close());

function connect(): Promise<{ ws: WebSocket; first: any }> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    ws.once("message", (d) => resolve({ ws, first: JSON.parse(d.toString()) }));
  });
}
function next(ws: WebSocket): Promise<any> {
  return new Promise((resolve) => ws.once("message", (d) => resolve(JSON.parse(d.toString()))));
}

describe("server", () => {
  it("welcomes a client and broadcasts a stake to both clients", async () => {
    const a = await connect();
    const b = await connect();
    expect(a.first.type).toBe("welcome");
    expect(typeof a.first.playerId).toBe("string");
    const key = Object.keys(a.first.state.hexes).find((k) => a.first.state.hexes[k].terrain === "plains")!;
    const [q, r] = key.split(",").map(Number);
    const bMsg = next(b.ws);
    a.ws.send(JSON.stringify({ type: "command", cmd: { type: "stake", q, r } }));
    const got = await bMsg;
    expect(got.type).toBe("state");
    expect(got.state.plots[key].owner).toBe(a.first.playerId);
    a.ws.close(); b.ws.close();
  });
});
```

- [ ] **Step 2: Run, verify fail.** Run: `cd server && npm test` → FAIL (no startServer).

- [ ] **Step 3: Implement server/index.ts**

```ts
import { randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import { createWorld, addPlayer, applyCommand, applyTick, type WorldState, type Command } from "@/sim";
import { initDb, loadLatest, saveSnapshot } from "./db";

interface Options { port?: number; seed?: number; tickMs?: number; persistEvery?: number; }

export function startServer(opts: Options = {}) {
  const tickMs = opts.tickMs ?? 1000;
  const persistEvery = opts.persistEvery ?? 10;
  let state: WorldState = createWorld(opts.seed ?? Number(process.env.WORLD_SEED ?? 1));
  const sockets = new Map<WebSocket, string>();

  const wss = new WebSocketServer({ port: opts.port ?? Number(process.env.PORT ?? 8080) });

  function broadcast() {
    const msg = JSON.stringify({ type: "state", state });
    for (const ws of sockets.keys()) if (ws.readyState === ws.OPEN) ws.send(msg);
  }

  wss.on("connection", (ws) => {
    const playerId = randomUUID();
    state = addPlayer(state, playerId);
    sockets.set(ws, playerId);
    ws.send(JSON.stringify({ type: "welcome", playerId, state }));
    broadcast();

    ws.on("message", (raw) => {
      let parsed: { type?: string; cmd?: Command };
      try { parsed = JSON.parse(raw.toString()); } catch { return; }
      if (parsed.type !== "command" || !parsed.cmd) return;
      const result = applyCommand(state, playerId, parsed.cmd);
      if (result.error) { ws.send(JSON.stringify({ type: "error", message: result.error })); return; }
      state = result.state;
      broadcast();
    });

    ws.on("close", () => sockets.delete(ws));
  });

  let ticks = 0;
  const timer = tickMs > 0 ? setInterval(async () => {
    state = applyTick(state);
    broadcast();
    if (persistEvery > 0 && ++ticks % persistEvery === 0) await saveSnapshot(state).catch(() => {});
  }, tickMs) : null;

  const address = wss.address();
  const port = typeof address === "object" && address ? address.port : (opts.port ?? 0);

  return {
    port,
    close() { if (timer) clearInterval(timer); wss.close(); },
  };
}

// Boot when run directly (not under vitest).
if (process.env.VITEST !== "true") {
  (async () => {
    await initDb().catch(() => {});
    const restored = await loadLatest().catch(() => null);
    const srv = startServer();
    if (restored) console.log(`Restored world @ tick ${restored.tick}`);
    console.log(`WARLANDS server on :${srv.port}`);
  })();
}
```

> Note: `loadLatest` restore is wired through `startServer` in Step 4 (the boot block logs it; full restore handled by passing initial state). Keep this task's server functional first; restore-on-boot is finalized next.

- [ ] **Step 4: Finalize restore-on-boot** — change `startServer` to accept an optional `initial?: WorldState` and use it instead of `createWorld` when provided; pass `restored` from the boot block.

In `Options` add `initial?: WorldState;`. Change the state init line to:

```ts
let state: WorldState = opts.initial ?? createWorld(opts.seed ?? Number(process.env.WORLD_SEED ?? 1));
```

And in the boot block: `const srv = startServer(restored ? { initial: restored } : {});`

- [ ] **Step 5: Run, verify pass.** Run: `cd server && VITEST=true npm test` → PASS.

- [ ] **Step 6: Commit**

```bash
git add server/index.ts server/index.test.ts
git commit -m "feat(server): ws tick server with command routing + restore"
```

---

### Task 8: `src/lib/useWorldSocket.ts` — client hook

**Files:** Create `src/lib/useWorldSocket.ts`

- [ ] **Step 1: Implement**

```ts
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Command, WorldState } from "@/sim";

export interface WorldSocket {
  state: WorldState | null;
  playerId: string | null;
  connected: boolean;
  error: string | null;
  send: (cmd: Command) => void;
}

export function useWorldSocket(url: string): WorldSocket {
  const [state, setState] = useState<WorldState | null>(null);
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
      if (msg.type === "welcome") { setPlayerId(msg.playerId); setState(msg.state); }
      else if (msg.type === "state") setState(msg.state);
      else if (msg.type === "error") setError(msg.message);
    };
    return () => ws.close();
  }, [url]);

  const send = useCallback((cmd: Command) => {
    ref.current?.send(JSON.stringify({ type: "command", cmd }));
  }, []);

  return { state, playerId, connected, error, send };
}
```

- [ ] **Step 2: Typecheck.** Run: `npx tsc --noEmit` → EXIT 0.

- [ ] **Step 3: Commit**

```bash
git add src/lib/useWorldSocket.ts
git commit -m "feat(client): useWorldSocket hook"
```

---

### Task 9: `/world` route — minimal renderer

**Files:** Create `src/app/world/page.tsx`

A minimal client page: connection status, the player's `$WAR` + plot count, an SVG hex grid (fill by terrain color, ring stroke for owned), click-to-select, and Stake / Build Farm buttons that `send` commands. Reads `NEXT_PUBLIC_GAME_SERVER_URL` (fallback `ws://localhost:8080`).

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState } from "react";
import { useWorldSocket } from "@/lib/useWorldSocket";
import { PLOT_TYPES } from "@/game/plotTypes";
import { axialToPixel } from "@/game/world";

const URL = process.env.NEXT_PUBLIC_GAME_SERVER_URL ?? "ws://localhost:8080";
const SIZE = 16;

export default function WorldPage() {
  const { state, playerId, connected, error, send } = useWorldSocket(URL);
  const [sel, setSel] = useState<string | null>(null);

  if (!state) return <main style={{ padding: 24, fontFamily: "monospace" }}>{connected ? "Loading world…" : `Connecting to ${URL}…`}</main>;

  const me = playerId ? state.players[playerId] : null;
  const selPlot = sel ? state.plots[sel] : null;
  const selHex = sel ? state.hexes[sel] : null;
  const mine = Object.values(state.plots).filter((p) => p.owner === playerId).length;

  return (
    <main style={{ padding: 16, fontFamily: "monospace", color: "#e8e8e8", background: "#0d0f14", minHeight: "100vh" }}>
      <h1 style={{ margin: "0 0 8px" }}>WARLANDS · Live World</h1>
      <div style={{ fontSize: 13, opacity: 0.8 }}>
        {connected ? "🟢 connected" : "🔴 offline"} · tick {state.tick} · players {Object.keys(state.players).length} · you: {me ? `${Math.round(me.war).toLocaleString()} $WAR, ${mine} plots` : "—"}
      </div>
      {error && <div style={{ color: "#ff6b6b", fontSize: 12 }}>{error}</div>}
      <svg viewBox="-180 -180 360 360" width={520} height={520} style={{ marginTop: 12, background: "#11141b" }}>
        {Object.values(state.hexes).map((h) => {
          const key = `${h.q},${h.r}`;
          const { x, y } = axialToPixel(h.q, h.r, SIZE);
          const plot = state.plots[key];
          const fill = PLOT_TYPES[h.terrain].color;
          const owned = plot?.owner === playerId;
          const enemy = plot && !owned;
          return (
            <circle key={key} cx={x} cy={y} r={SIZE * 0.62}
              fill={fill} stroke={owned ? "#fff" : enemy ? "#ff5252" : sel === key ? "#ffd54f" : "#0008"}
              strokeWidth={owned || enemy || sel === key ? 2 : 0.5}
              onClick={() => setSel(key)} style={{ cursor: "pointer" }} />
          );
        })}
      </svg>
      {selHex && (
        <div style={{ marginTop: 12 }}>
          <div>Selected {sel} · {PLOT_TYPES[selHex.terrain].name} · stake {PLOT_TYPES[selHex.terrain].stake.toLocaleString()} $WAR</div>
          {!selPlot && <button onClick={() => { const [q, r] = sel!.split(",").map(Number); send({ type: "stake", q, r }); }}>Stake this plot</button>}
          {selPlot?.owner === playerId && (
            <div>
              <button onClick={() => send({ type: "build", key: sel!, buildingId: "farm" })}>Build Farm</button>
              <div style={{ fontSize: 12, opacity: 0.8 }}>buildings: {selPlot.buildings.map((b) => b.id).join(", ")} · food {Math.round(selPlot.resources.food ?? 0)}</div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Typecheck + build.** Run: `npx tsc --noEmit && npm run build` → EXIT 0.

- [ ] **Step 3: Commit**

```bash
git add src/app/world/page.tsx
git commit -m "feat(client): /world live multiplayer route"
```

---

### Task 10: Deploy — Railway (server + Postgres) + Vercel env

**Files:** Modify `.env.example`; create `server/railway.json` (optional start config)

- [ ] **Step 1: Add server URL to root `.env.example`**

Append: `# Live world server (Railway). Unset => /world tries ws://localhost:8080` and `NEXT_PUBLIC_GAME_SERVER_URL=`.

- [ ] **Step 2: Provision Railway** — create project, add Postgres plugin, deploy `server/` as a service. Set service start command `npm start`, root directory `server`. Railway injects `DATABASE_URL`; set `PORT` to the Railway-provided port (or read `process.env.PORT`). Capture the public domain → `wss://<svc>.up.railway.app`.

- [ ] **Step 3: Wire Vercel** — `vercel env add NEXT_PUBLIC_GAME_SERVER_URL production` = the `wss://…` URL; `vercel --prod`.

- [ ] **Step 4: Verify end-to-end** — open `/world` in two browsers; stake in one, watch the other update; confirm tick advances; restart the Railway service and confirm the world reloads from the latest snapshot.

- [ ] **Step 5: Commit**

```bash
git add .env.example server/railway.json
git commit -m "chore(deploy): wire live world server env"
```

---

## Self-Review

**Spec coverage:** pure `src/sim` core (T1–5) ✓; Node+ws server (T7) ✓; Postgres JSONB snapshots + restore (T6, T7) ✓; `/world` route, `/play` untouched (T9) ✓; anonymous identity = server `randomUUID` per socket (T7) ✓; full-snapshot sync (T7 broadcast) ✓; structured command errors (T4 + T7 error msg) ✓; tests unit (T2–4) + integration (T7) ✓; Railway+Vercel deploy (T10) ✓. Deviation from spec: `/world` uses a minimal bespoke SVG renderer instead of reusing `HexMap` — intentional, keeps the slice thin and `/play` untouched.

**Placeholder scan:** none — every code step is complete. (T7 Step 3/4 split is a real two-step refactor, not a placeholder.)

**Type consistency:** `WorldState`/`SimPlot`/`SimPlayer`/`Command`/`CommandResult` defined in T1 and used unchanged in T2–T9. `applyCommand`/`applyTick`/`createWorld`/`addPlayer`/`storageCap` signatures match across sim, server, and client. Protocol message shapes (`welcome`/`state`/`error`/`command`) match between server (T7) and hook (T8).
