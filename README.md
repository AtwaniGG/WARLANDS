# WARLANDS — AAA Web3 Strategy MMO

A persistent-world, PvP-first strategy MMO where players stake a native token (`$WAR`) to
secure finite land on one shared live map, build economies, and wage war — solo or in
**Allegiances**. Built directly from [`docs/GDD.md`](docs/GDD.md), the full 24-section design
doc covering tokenomics, balancing math, architecture, and roadmap.

> **Landing page** at `/` · **Game** at `/play`.

```bash
npm install
npm run dev        # → http://localhost:3000  (landing)  ·  /play (game)
```

## Repository layout

```
src/
  app/                  Next.js App Router
    page.tsx            ← tactical landing page (/)
    play/page.tsx       ← the game (/play)
    api/                ← health · players · market (server routes)
  game/                 client game engine (rules mirror the GDD section-by-section)
    resources · plotTypes · buildings · units · combat · market
    allegiance · empire · formulas · world · store (zustand, persisted)
  components/           UI: hex map, plot/military/market/allegiance/diplomacy/season/wallet panels
  web3/                 wagmi + viem: config, ABIs, addresses, provider
  server/db/            Drizzle ORM schema (GDD §21) + Neon client
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
no `DATABASE_URL` → mock backend; no `NEXT_PUBLIC_*` contract addresses → mocked staking.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Zustand · wagmi/viem ·
Drizzle ORM + Neon Postgres · Foundry/Solidity. Targets an EVM L2 (Base / Arbitrum).

## Not yet built

Server-authoritative multiplayer simulation (sector sharding, WebSocket sync), the on-chain
Merkle reward pipeline, player-vs-player (vs the current AI), and contract audit hardening.
The client store is the reference implementation of the rules the backend will run authoritatively.
