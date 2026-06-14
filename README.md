# WARLANDS — Web3 Strategy MMO (Prototype)

A persistent-world, PvP-first strategy MMO where players stake a native token (`$WAR`) to
secure finite land on one shared live map, build economies, and wage war.
This repo is the **playable prototype of the core loop**, built directly from
[`docs/GDD.md`](docs/GDD.md) (the full 24-section design doc / tokenomics / architecture spec).

## What's playable right now

The full prototype loop across **five integrated systems** (tabs: World · Market · Allegiance · Season):

```
STAKE → CLAIM → BUILD → FARM → MANUFACTURE → TRAIN → RAID → TRADE → ALLY → COMPETE FOR SEASON REWARDS
```

**Phase A — Economy (GDD §2–6, §18)**
- **Live hex world map** with a center→edge risk gradient (newbie ring → the Crucible), pan & zoom.
- **9 plot types** with real stake costs + terrain yield multipliers. $WAR is *locked, never spent*.
- **8 raw → 6 intermediate → 6 finished** resources with real supply-chain recipes.
- **Extractors + factories**; tick engine with diminishing returns, level multipliers, super-linear
  upkeep, storage caps, and starvation→defense decay. **Anti-whale math live.**

**Phase B — Combat & Raids (GDD §8–9)**
- **6 unit classes** + a full counter matrix (infantry/tanks/artillery/aircraft/drones/engineers).
- **NPC hostile camps** (💀) seeded across the map, stronger & richer toward the center; respawn over time.
- **Scout → Raid/Siege** with **seeded, reproducible** battle resolution, the GDD §9.4 underdog
  win-probability model, loot efficiency falloff, and full battle reports.

**Phase C — Marketplace (GDD §7)**
- Player-driven **order book** (buy / sell / limit list) over a live AI-liquidity book with drifting prices.
- **4% transaction + 5 $WAR listing fees** are token sinks (½ burned, ½ to the season reward pool).

**Phase D — Allegiances & Governance (GDD §10–11)**
- **Found or join** an Allegiance; pick one of 4 governance models (democracy/weighted/council/founder).
- **Treasury contributions** raise your contribution score; **propose → vote** on Allegiance buildings;
  AI members auto-vote and proposals resolve by your governance model.
- **Buildings grant live buffs**: Research +production, Fortress +defense, Trade Hub −market fees, Radar +scouting.

**Phase E — Seasons & Rewards (GDD §14–15)**
- Season timer, **4-factor season score** (econ/military/territory/allegiance).
- Reward pool is **funded only by sinks**; payout uses the top-heavy (p=1.5) share curve and
  **can never exceed the pool** — the GDD §12.2 no-emissions invariant, enforced in code.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

How to play: click an unclaimed hex → **Stake & Claim** → on your plot, **Construct**
extractors (e.g. Farm, Iron Mine) → watch the stockpile fill each tick → build a
Foundry/Refinery and pick a product to start manufacturing → upgrade your Camp for more
build slots. Higher-tier terrain (mountain, desert, tech ruins, warzone) costs more stake
but yields more.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind v4**
- **Zustand** game store + a 1s tick loop (`GameClock`)
- All game rules live in [`src/game/`](src/game/) and mirror the GDD section-by-section:
  - `resources.ts` — §5 resource tiers & recipes
  - `plotTypes.ts` — §4 terrain/plots
  - `buildings.ts` — §6 buildings/factories
  - `formulas.ts` — §18 balancing formulas (production, DR, upkeep, win prob, loot)
  - `world.ts` — §3 hex world generation
  - `store.ts` — §2 core loop engine

## Not yet built (next slices, per the GDD)

- **On-chain layer (§20)** — real $WAR ERC-20, staking/treasury/reward contracts on an L2 (Base/Arbitrum).
  Currently staking, treasury and rewards are **mocked client-side** but modeled exactly as the contracts will enforce.
- **Server-authoritative multiplayer (§19)** — sector-sharded sim, WebSocket sync, Postgres/Redis.
  Currently single-player with AI opponents standing in for other players (market liquidity, NPC camps, Allegiance members).
- **Player-vs-player raids, territory wars, diplomacy/espionage (§8, §10.5–10.6)**, weather/commanders/traps,
  and the on-chain Merkle reward claim.

The current build is a single-player, client-side prototype that demonstrates the **complete economic +
military + political + seasonal loop** with every rule traced to a GDD section.
