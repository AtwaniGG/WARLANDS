# WARLANDS — AAA Web3 Strategy MMO

A persistent-world, PvP-first strategy MMO where players stake a native token (`$WAR`) to
secure finite land on one shared live map, build economies, and wage war — solo or in
**Allegiances**. Built directly from [`docs/GDD.md`](docs/GDD.md), the full 24-section design
doc covering tokenomics, balancing math, architecture, and roadmap.

> **Landing page** at `/` · **Single-player game** at `/play` · **Live shared world** at `/world`.

```bash
npm install
npm run dev        # → http://localhost:3000  (landing) · /play (single-player) · /world (multiplayer)

# Live world server (authoritative sim) — separate Node service:
cd server && npm install && npm run dev   # → ws://localhost:8080
```

## Repository layout

```
src/
  app/                  Next.js App Router
    page.tsx            ← tactical landing page (/)
    play/page.tsx       ← the game (/play)
    api/                ← health · players · market (server routes)
    play/page.tsx       ← the single-player game (/play)
    world/page.tsx      ← live multiplayer world (/world)
  game/                 client game engine (rules mirror the GDD section-by-section)
    resources · plotTypes · buildings · units · combat · market
    allegiance · empire · formulas · world · store (zustand, persisted)
  sim/                  pure isomorphic simulation core (shared client+server)
    types · world · tick · commands  (no IO; deterministic; vitest-tested)
  lib/                  useWorldSocket (client ↔ live world server)
  components/           UI: hex map, plot/military/market/allegiance/diplomacy/season/wallet panels
  web3/                 wagmi + viem: config, ABIs, addresses, provider
  server/db/            Drizzle ORM schema (GDD §21) + Neon client
server/                 authoritative game server — Node + ws, 1 Hz tick, Postgres snapshots
contracts/              Solidity smart contracts (GDD §20) + Foundry tests
drizzle/                generated SQL migrations
docs/
  GDD.md                full game design document
  DESIGN_BRIEF.md       master art & design prompt (16 modules)
```

## What's built

**Game (client, `src/game` + `src/components`)** — fully playable single-player prototype:
- **Economy** (GDD §2–6, §18): hex world with center→edge risk gradient, 9 plot types, 20-resource
  supply chain, extractors + factories, tick engine with diminishing returns / super-linear upkeep.
- **Combat** (§8–9): 6 unit classes + counter matrix, NPC camps, scout/raid/siege, seeded
  reproducible battles, the underdog win-probability model, loot, battle reports.
- **Marketplace** (§7): player-driven order book with drifting prices; fees are token sinks.
- **Allegiances & governance** (§10–11): found/join, 4 governance models, treasury, contribution
  scores, propose→vote→resolve, buildings that grant live buffs.
- **Rival empires & diplomacy** (§10.5–10.6): AI empires hold territory, declare war/peace/alliance,
  retaliate, and can be conquered.
- **Seasons & rewards** (§14–15): timer, 4-factor score, sink-funded reward pool enforcing the
  no-emissions invariant.
- **Persistence**: localStorage save/load with SSR-safe hydration + reset.

**Live multiplayer world (`src/sim` + `server/` + `/world`)** — server-authoritative, the full
core loop. A pure deterministic simulation core (`src/sim`: world, 1 Hz tick, commands) runs
authoritatively in a Node + `ws` server; multiple clients share one map and commands flow
client → validate → apply → broadcast → persist (Postgres JSONB snapshots, restore on boot).
Authoritative today: **stake/build**, **economy** (extractors + factories, upgrade, unstake with
burn sink), **military** (unit training + seeded **PvP raids/sieges** with loot & defense damage),
and a **shared player marketplace** (P2P order book, buyer→seller `$WAR` transfer, fee/listing
sinks). The `/world` route renders it live; `/play` stays single-player. Anonymous per-socket
identity for now. See [docs/superpowers/specs/2026-06-15-server-authoritative-sim-design.md](docs/superpowers/specs/2026-06-15-server-authoritative-sim-design.md).

**On-chain layer (`contracts/`, GDD §20)** — self-contained Foundry project, `solc`-verified:
`WarToken` (fixed-supply burnable), `StakingManager` (principal-safe staking + conquest),
`SinkRouter` (burn-floor split), `RewardDistributor` (Merkle claims, claimable ≤ pool),
`AllegianceTreasury` (quorum + timelock). See [contracts/README.md](contracts/README.md).

**Web3 client (`src/web3`)**: wagmi v3 + viem wallet connect, typed ABIs, env-driven addresses.
Falls back to mock mode until contracts are deployed and `NEXT_PUBLIC_*` is set.

**Backend foundation (`src/server`, GDD §19/§21)**: full 26-table Drizzle/Postgres schema +
Neon client + API routes. Runs in mock mode until `DATABASE_URL` is set.
See [src/server/README.md](src/server/README.md).

## Configuration

Copy [`.env.example`](.env.example) → `.env.local`. All integrations degrade gracefully:
no `DATABASE_URL` → mock backend; no `NEXT_PUBLIC_*` contract addresses → mocked staking;
no `NEXT_PUBLIC_GAME_SERVER_URL` → `/world` falls back to `ws://localhost:8080`.
The server (`server/.env`) needs `PORT` and an optional `DATABASE_URL` (snapshots no-op without it).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Zustand · wagmi/viem ·
Drizzle ORM + Neon Postgres · Foundry/Solidity. Targets an EVM L2 (Base / Arbitrum).

## Not yet built

The server-authoritative core loop is live and multiplayer (`/world`), but the full MMO does not
yet have: **allegiances/governance** ported to the server (still single-player only), **sector
sharding** for scale, **wallet-based identity + anti-cheat signatures** (anonymous ids today), the
on-chain layer **deployed** (contracts in `contracts/` are tested but not on a testnet/mainnet —
needs a funded deployer wallet), the on-chain **Merkle reward pipeline**, and **contract audit
hardening**. The client store remains the reference implementation for the not-yet-ported systems.
