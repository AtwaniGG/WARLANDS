# Server-Authoritative Simulation — Slice 1: "Pipeline Proof"

**Date:** 2026-06-15
**Sub-project:** Plan B #1 (server-authoritative multiplayer), first slice
**Status:** Approved, in implementation

## Goal

Prove the full `command → validate → apply → broadcast → persist` pipeline end-to-end:
multiple clients on **one shared map**, an authoritative 1 Hz tick computed server-side,
2–3 player actions (`stake`, `build`), state persisted to Postgres, the server running as a
long-lived Node service on Railway, the client served from Vercel.

Once the pipeline is proven, porting the remaining actions (upgrade, train, scout, raid,
market, allegiance) is mechanical follow-on work, not new architecture.

## Why this matters

Today the entire simulation lives client-side in a ~1,460-line Zustand store
(`src/game/store.ts`). Every player runs their own private world; nothing is shared or
authoritative. Real PvP and sink-funded reward scoring (Plan B #3, #4) both require the
server to own the world state. This slice establishes that ownership with the smallest
believable surface area.

Crucial enabling fact: the existing rule modules (`src/game/combat.ts`, `formulas.ts`,
`world.ts`, `units.ts`, …) are mostly pure, and combat already uses a **seeded deterministic
RNG**. Determinism is exactly what makes a server-authoritative move tractable.

## Architecture

Three parts.

### 1. `src/sim/` — pure, isomorphic simulation core

No Zustand, no DOM, no IO, no `Date.now()`/`Math.random()` in logic paths (seed-driven only).
Imported by both the Next.js app and the Node server.

- `types.ts` — `WorldState`, `Plot`, `Player`, `Command`, `CommandResult`
- `world.ts` — `createWorld(seed): WorldState` (lifts hex generation from `src/game/world.ts`)
- `tick.ts` — `applyTick(state): WorldState` (deterministic resource production for staked plots)
- `commands.ts` — `applyCommand(state, playerId, cmd): { state, error? }` for `stake` and `build`
- Reuses existing pure data: `src/game/plotTypes.ts`, `buildings.ts`, `resources.ts`
  (imported, not duplicated).

### 2. `server/` — Node + `ws` authoritative service

Own `package.json`; deploys to Railway as a standalone service.

- Holds the authoritative `WorldState` in memory.
- `setInterval(…, 1000)` → `applyTick` → throttled persist → broadcast snapshot.
- WebSocket connection: assigns or loads a `playerId`; inbound command message →
  `applyCommand` → broadcast updated snapshot to all clients.
- Postgres (Railway): single table `world_snapshots(id, tick, state JSONB, created_at)`.
  Load the latest snapshot on boot; save every ~10 ticks and on graceful shutdown so the
  world survives restarts.

### 3. Client integration — new `/world` route, existing `/play` untouched

- `useWorldSocket` hook: connects to `NEXT_PUBLIC_GAME_SERVER_URL`, holds the
  server-pushed `WorldState`, exposes `sendCommand(cmd)`.
- Reuses existing `HexMap` / `PlotPanel` components to render the shared world for the
  slice's two actions.
- The polished single-player `/play` experience is left completely intact.

## Data flow

```
client action
  → ws send { type: 'stake' | 'build', ... }
  → server applyCommand(state, playerId, cmd)   (validate)
  → mutate authoritative WorldState
  → broadcast full snapshot
  → every client renders
```

The tick runs independently server-side every 1 s: `applyTick` → broadcast.

## Key decisions

| Decision | Choice | Rationale / deferral |
|---|---|---|
| Server framework | Raw Node + `ws` | Rules already exist as pure functions; little left for a framework. 1 Hz JSON is cheap. |
| Repo structure | `server/` dir + shared `src/sim`, Next app stays at root | Doesn't disturb the working Vercel deploy. |
| Identity | Anonymous server-issued session id (localStorage) | Two tabs = two players. Wallet auth → sub-project #2. |
| Coexistence | New `/world` route | Leaves the live `/play` demo intact. |
| Sync model | Full JSON snapshot per tick/change | World ≈ 271 hexes (radius 9) — cheap at 1 Hz. Delta compression later. |
| Persistence | JSONB world snapshot, not the 26-table relational schema | Pragmatic for proof; full Drizzle mapping later. |

## Error handling

- `applyCommand` returns structured errors to the issuing client: insufficient `$WAR`,
  plot already occupied, no free building slot, unknown plot/building.
- Malformed or unknown ws messages are rejected without mutating state.
- On reconnect the client requests a fresh full snapshot.

## Testing

- `src/sim` pure functions: unit tests, TDD. `applyTick` determinism (same state+seed →
  same next state), `applyCommand` validation rules (each rejection path + each success path).
- Server: one integration test — two `ws` clients connect, one issues `stake`, both receive
  the broadcast reflecting the new plot owner.

## Deployment

- Railway: new service built from `server/`; attach a Postgres plugin; wire `DATABASE_URL`
  and `PORT`. Expose a public WebSocket URL.
- Vercel: add `NEXT_PUBLIC_GAME_SERVER_URL` pointing at the Railway service; redeploy.
- Verify: open `/world` in two browsers, stake/build in one, observe the other update live;
  restart the Railway service and confirm the world reloads from the latest snapshot.

## Explicitly out of scope (this slice)

Sector sharding · wallet-based auth + signature anti-cheat · real player-vs-player combat ·
porting market/combat/allegiance/research · delta compression · client-side prediction ·
the full 26-table relational schema · horizontal scaling / multiple shards.

These are tracked for later slices of Plan B #1 and sibling sub-projects (#2 on-chain,
#3 reward pipeline, #4 PvP, #5 hardening).
