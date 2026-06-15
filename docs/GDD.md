# PROJECT WARLANDS — AAA Web3 Strategy MMO

**Game Design Document, Technical Architecture & Tokenomics Master Spec**
**Version 1.0 · Target: 100,000+ CCU · Multi-Year Persistent Economy**

> Working title: **WARLANDS** (a.k.a. "Red Agent MMO"). Native token referred to throughout as **$WAR**.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Core Gameplay Loop](#2-core-gameplay-loop)
3. [World Design](#3-world-design)
4. [Plot Types](#4-plot-types)
5. [Resource Economy](#5-resource-economy)
6. [Manufacturing Economy](#6-manufacturing-economy)
7. [Marketplace Design](#7-marketplace-design)
8. [Combat Design](#8-combat-design)
9. [RNG Design](#9-rng-design)
10. [Allegiance System](#10-allegiance-system)
11. [Governance System](#11-governance-system)
12. [Tokenomics](#12-tokenomics)
13. [Token Sinks (100+)](#13-token-sinks)
14. [Reward System](#14-reward-system)
15. [Seasonal Design](#15-seasonal-design)
16. [Anti-Whale Design](#16-anti-whale-design)
17. [Anti-Bot Design](#17-anti-bot-design)
18. [Balancing Formulas](#18-balancing-formulas)
19. [Technical Architecture](#19-technical-architecture)
20. [Smart Contract Architecture](#20-smart-contract-architecture)
21. [Database Schema](#21-database-schema)
22. [Monetization](#22-monetization)
23. [MVP Roadmap](#23-mvp-roadmap)
24. [Long-Term Expansion Roadmap](#24-long-term-expansion-roadmap)
25. [Game Theory Appendix](#25-game-theory-appendix)

---

## 1. Executive Summary

**WARLANDS** is a persistent, single-shard (sharded-by-region under the hood) strategy MMO that fuses the base-building of *Clash of Clans*, the persistent-world raiding of *Travian/Tribal Wars*, the faction warfare and player-driven economy of *EVE Online*, the unit-counter combat of *Command & Conquer / Red Alert*, and the territorial meta-game of *Risk/Civilization*.

Every player lives on **one shared, always-running world map**. There are no matches and no lobbies. You stake the native token **$WAR** to claim and secure finite land. You build a camp, farm raw resources, refine them through deep supply chains into military hardware, trade on a fully player-driven market, and wage war on neighbors — alone or as part of an **Allegiance** (the game's alliance/guild structure).

### The Three Pillars

| Pillar | Description |
|---|---|
| **Land is staked, not bought** | $WAR is *locked* to secure a plot, never spent. Players never lose staked principal in combat. This separates "skin in the game" from "loot at risk" and makes the token a productivity bond, not a lottery ticket. |
| **Economy before war** | You cannot field an army without a supply chain. No single player can efficiently produce everything. Specialization and trade are structurally forced, which creates a real economy that war then disrupts. |
| **War funded by sinks, not emissions** | Rewards are paid from a treasury filled by real token sinks (fees, upkeep, speed-ups). The token is **not a reward printer**. Net emissions are bounded by net sinks each season. |

### Why It's Different from "Play-to-Earn"

Most Web3 games fail because rewards are minted faster than they are burned, so the token deflates to zero. WARLANDS inverts this: **every reward $WAR distributed in a season is first collected from a sink in that same season.** The protocol can never pay out more than it collected. Players "earn" by being economically or militarily productive *relative to other players*, not by extracting freshly minted supply.

### Design Targets

- **Easy to understand, hard to master**: claim → build → farm → fight is learnable in 10 minutes; supply-chain arbitrage, combat counters, and Allegiance politics take years.
- **PvP-first, economy-supported**: ~70% of strategic depth is conflict; the economy exists to fuel and be disrupted by it.
- **Skill > spend**: counters, scouting, and logistics let a 70%-power defender beat a 100%-power attacker who misplays (target: meaningful win chance — quantified in §9 and §18).
- **Scale**: architected for 100k+ CCU via regional simulation sharding and event-sourced game state.

---

## 2. Core Gameplay Loop

### 2.1 The Macro Loop

```
        ┌──────────────────────────────────────────────────────────┐
        │                                                          │
   STAKE $WAR ──► CLAIM PLOT ──► BUILD CAMP ──► FARM RESOURCES      │
        │                                            │             │
        │                                            ▼             │
        │                                  SPECIALIZE ECONOMY       │
        │                                            │             │
        │                  ┌─────────────────────────┤             │
        │                  ▼                         ▼             │
        │            TRADE w/ PLAYERS         MANUFACTURE GOODS     │
        │                  │                         │             │
        │                  └────────────┬────────────┘             │
        │                               ▼                          │
        │                          TRAIN ARMY                      │
        │                          ┌────┴────┐                     │
        │                          ▼         ▼                     │
        │                  DEFEND TERRITORY  RAID ENEMIES          │
        │                          │         │                     │
        │                          └────┬────┘                     │
        │                               ▼                          │
        │                       JOIN ALLEGIANCES                   │
        │                               │                          │
        │                               ▼                          │
        │                       CONTROL REGIONS                    │
        │                               │                          │
        │                               ▼                          │
        └────────────────► EARN SEASONAL REWARDS ──────────────────┘
                                  (re-stake / cash out)
```

### 2.2 Loop Cadences (what keeps players coming back)

| Cadence | Activities | Hook |
|---|---|---|
| **Per-session (5–20 min)** | collect resources, queue production, dispatch a raid, list/buy on market, scout a neighbor | tangible progress every login |
| **Daily** | upkeep payment, defense rotation, contract fulfillment, daily Allegiance ops | loss-aversion (skip = decay/raid risk) |
| **Weekly** | tech research tier, territory war windows, market arbitrage cycles | medium-term goals |
| **Seasonal (30 days)** | ladder climb, region control, season reward pool | reset + meta-shift, prestige |
| **Permanent** | account level, commander roster, reputation, cosmetics | identity & status that survives resets |

### 2.3 Onboarding (first 30 minutes)

1. **Tutorial sandbox plot** (no stake required, isolated edge of map) — teaches build/farm/produce/attack against scripted bots.
2. **Graduation**: stake your first 10,000 $WAR → claim a real Basic Plot in a low-density "newbie ring" on the live map.
3. **Beginner's Protection**: 72h shield (or until you make an offensive action), bonus production, and a guided "specialize" quest line.

---

## 3. World Design

### 3.1 Topology

- **One logical world per season.** The world is a large hex grid (axial coordinates) divided into a hierarchy:

```
WORLD
 └── REGIONS (e.g., 64 regions)         ← Allegiance-controllable, taxable
      └── SECTORS (e.g., 64 per region) ← simulation shard unit
           └── PLOTS (hexes)            ← player-owned, staked
```

- **Finite land.** Total plots are capped per season (e.g., **~250,000 plots** for a 100k-CCU world → land is genuinely scarce; not everyone gets a Warzone plot). Scarcity is the core economic primitive.
- **Geography is generated, not random soup.** Rivers run in connected chains; mountains form ranges; oil sits in desert belts; coasts ring the map edges and inland seas; Warzones cluster at the contested center; Technology Ruins are rare and scattered. This makes *location* strategic: river deltas, mountain passes, and coastal choke points are worth fighting over.

### 3.2 The Center–Edge Gradient

| Zone | Location | Plot mix | Risk/Reward |
|---|---|---|---|
| **Newbie Ring** | outermost ring | Basic, Forest, Plains | low risk, low reward, longer protection timers, capped player level |
| **Heartland** | mid-radius | full mix, balanced | normal rules |
| **The Crucible** | center | Warzone, Technology Ruins, Industrial concentrations | highest yields, no protection, contested by top Allegiances |

This creates a natural **progression vector** (players push inward as they grow) and a natural **endgame arena** (the center) without instancing.

### 3.3 Movement & Distance

Distance is real and matters. Armies and trade caravans move at finite speed across hexes; terrain modifies movement (rivers slow, roads/coasts speed). This is what makes alliances *geographic* and supply lines *attackable*. See movement math in §18.6.

### 3.4 Fog of War

You see your own plots and adjacent hexes fully. Beyond that you see static terrain but **not live troop/resource counts** without scouting. Radar buildings and Allegiance radar networks extend vision. Intel is a tradable commodity.

---

## 4. Plot Types

Stake amounts (in $WAR) match the brief. Stake is **locked**, never consumed. Higher-tier plots cost more stake because they yield more and are more contested.

| # | Plot | Stake ($WAR) | Primary outputs | Modifiers | Defensive notes |
|---|---|---|---|---|---|
| 1 | **Basic / Plains** | 10,000 | balanced food + wood + stone | +5% build speed | neutral |
| 2 | **Forest** | 12,500 | +Wood, +early growth | +15% wood, +10% early-game XP | ambush bonus (defender) |
| 3 | **River** | 15,000 | +Food, +Water, +Trade | +20% food, +15% water, −10% market fees | bridges = choke defense |
| 4 | **Mountain** | 20,000 | +Metal (Iron), +Stone | +25% iron, +20% stone | **+30% defense**, slows attackers |
| 5 | **Desert (Oil)** | 25,000 | +Oil, +Fuel | +30% oil | exposed, weak natural defense |
| 6 | **Coastal Trade** | 30,000 | +Trade, naval access | −20% transport cost, sea routes | naval raids possible |
| 7 | **Industrial** | 40,000 | manufacturing hub | +25% factory efficiency, +1 factory slot | high-value raid target |
| 8 | **Technology Ruins** | 50,000 | +Blueprints, +Research, +Data Chips | +30% research, unlocks rare blueprints | very high-value target |
| 9 | **Warzone** | 60,000 | highest raw + bonus rewards | +40% all yields, season-point multiplier | **no protection ever**, decay faster |

### 4.1 Plot Lifecycle & Decay

```
ACTIVE ──(unstake initiated)──► DECAYING ──(grace 7d)──► VULNERABLE ──(reclaim window)──► UNCLAIMED
   ▲                                                                                          │
   └──────────────────────────── (re-stake / new claim) ◄────────────────────────────────────┘
```

- **ACTIVE**: full defenses, full production.
- **DECAYING** (unstake requested OR upkeep unpaid): production −X%/day, defenses −Y%/day (see §18.7). Stake enters a **cooldown unbonding period** (e.g., 7 days) before withdrawal — prevents instant rug of a plot under siege.
- **VULNERABLE**: defenses below threshold; any player who razes the camp can **reclaim** the plot by staking the required amount. Original owner's *staked principal is returned* (minus an early-unstake fee sink); only the *built assets and stored resources* are lost/looted.
- **Key rule**: **staked $WAR is never seized by another player.** Conquest transfers the *right to stake* the plot, not the loser's tokens.

### 4.2 Multi-Plot Ownership

Players may own multiple plots, but face **diminishing returns and rising upkeep** per additional plot (anti-whale, §16). Plots that are non-contiguous incur logistics overhead to coordinate.

---

## 5. Resource Economy

### 5.1 Resource Tiers

**Tier 0 — Raw (gathered on plots):**
Food, Water, Wood, Stone, Iron, Rare Minerals, Oil, Data Chips
*(Fuel is refined from Oil — treated as Tier 1, see brief lists it under raw; we model Fuel as intermediate for supply-chain depth.)*

**Tier 1 — Intermediate (refined in basic processors):**
Steel (Iron+Stone+Fuel), Electronics (Rare Minerals+Data Chips+Water), Machine Parts (Steel+Fuel), Ammunition (Steel+Chemicals), Chemicals (Oil+Water+Rare Minerals), Fuel (Oil+Water)

**Tier 2 — Finished Products (built in factories):**
Rifles, Tanks, Drones, Aircraft, Turrets, Radar Systems, Shields, EMP Systems, Vehicles, Building Components

### 5.2 Supply Chain Graph (no one produces everything)

```
RAW                  INTERMEDIATE              FINISHED
─────                ────────────              ────────
Iron ─┐
Stone ─┼─► Steel ──┬─► Machine Parts ──┬─► Vehicles
Oil ──┼─► Fuel ────┘                   ├─► Tanks ◄── Electronics
      │                                ├─► Building Components
Water─┤                                │
      └─► Chemicals ─► Ammunition ──────┴─► Rifles ◄── Wood
Rare Minerals ─┬─► Electronics ──┬─► Drones
Data Chips ────┘                 ├─► Aircraft ◄── Fuel, Machine Parts
                                 ├─► Radar Systems
                                 ├─► Shields ◄── Steel, Electronics
                                 └─► EMP Systems ◄── Electronics, Chemicals
Food + Water ─► (population upkeep / workforce — consumed continuously)
```

**Design intent:** Every finished product touches 3–5 raw inputs across multiple terrain types. Since no plot produces all raws well, **you must trade or specialize**. Example dependencies:

- A **Tank** needs Steel (mountain+desert), Oil (desert), Electronics (tech ruins + rare minerals). One player rarely holds mountain + desert + tech plots all at once → trade.
- **Food + Water** are universal upkeep: armies and workforces *consume* them continuously, creating a permanent demand sink for farmers.

### 5.3 Resource Sinks

Resources (not the token) are consumed by: production, troop upkeep (food/water/fuel), construction, repairs after raids, research, and Allegiance treasury contributions. This keeps raw-resource demand high and gives farmers/miners a permanent market.

### 5.4 Production Formula

See §18.1 for the full production-rate formula. Summary:

```
Output/hr = Base × TerrainMult × BuildingLevelMult × WorkforceMult
            × EfficiencyMult × (1 − Congestion) × EventMult
```

---

## 6. Manufacturing Economy

### 6.1 Factories

Industrial-spec players build **Factories** that transform inputs → outputs over time. Factory archetypes:

| Factory | Produces | Key inputs |
|---|---|---|
| Refinery | Fuel, Chemicals | Oil, Water |
| Foundry | Steel, Machine Parts | Iron, Stone, Fuel |
| Arms Factory | Rifles, Ammunition | Steel, Wood, Chemicals |
| Heavy Works | Tanks, Vehicles, Building Components | Steel, Electronics, Oil |
| Aerospace | Aircraft, Drones | Electronics, Machine Parts, Fuel |
| Electronics Lab | Electronics, Radar, EMP, Shields | Rare Minerals, Data Chips |

### 6.2 Production Queue

- Each factory has **N queue slots** (upgradeable). Jobs process FIFO or by priority (priority costs $WAR — a sink).
- **Batch jobs**: e.g., "Produce 100 Rifles" = consumes inputs upfront, occupies factory for `BatchTime`.

```
BatchTime = (UnitTime × Quantity) / (FactoryEfficiency × WorkforceFactor)
            × (1 + QueueCongestionPenalty)
```

### 6.3 Worked Examples (matching the brief)

**100 Rifles** require:
```
Inputs:  300 Steel + 200 Wood + 150 Fuel + 50 Ammunition
Time:    100 × 4 min / (Eff × Workforce)   (= ~6.7h at Eff 1.0, WF 1.0)
Cost:    small $WAR job-init fee (sink)
```

**1 Tank** requires:
```
Inputs:  120 Steel + 60 Oil + 40 Electronics + 20 Machine Parts
Time:    90 min / (Eff × Workforce)
```

### 6.4 Factory Upgrades

- **Level** ↑ → throughput ↑, queue slots ↑, but **upkeep (food/water/fuel) ↑** and **$WAR maintenance ↑** (sink + anti-whale).
- **Specialization perks**: dedicating a factory to one product line grants +efficiency (encourages focus over generalism).

### 6.5 Workforce System

- Plots have a **population** fed by Food + Water. Population provides **labor** allocated across gathering and manufacturing.
- `WorkforceMult = f(allocated_labor / required_labor)` — under-staffed factories run slow; over-staffing wastes upkeep. This is a soft cap that punishes sprawling whale empires (you can't staff 50 factories without enormous food logistics).

### 6.6 Manufacturing Efficiency

```
FactoryEfficiency = BaseEff
  × (1 + 0.05 × FactoryLevel)
  × TerrainMult            (Industrial +25%)
  × (1 + SpecializationBonus)   (focus on one product line)
  × ResearchMult           (tech tree)
  × (1 − MaintenanceDebt)  (skipping $WAR maintenance degrades output)
```

---

## 7. Marketplace Design

### 7.1 Two-Layer Market

| Layer | Scope | Latency of trade | Use |
|---|---|---|---|
| **Regional Markets** | per-region order books | instant within region | local supply/demand, cheap fees |
| **Global Market** | cross-region | requires physical transport (caravans/ships) + time | arbitrage, big contracts |

Prices are **100% player-set** via limit/market orders. The protocol sets *no* prices. Server only matches orders and charges fees.

### 7.2 Order Types

- **Sell / Buy limit orders** (price + qty).
- **Market orders** (fill at best available).
- **Contracts**: courier contracts ("deliver 500 Steel from A to B for X"), production contracts ("I'll buy 1000 Rifles over 7 days"), mercenary contracts (see §8/§10).
- **Auctions** for rare items (unique blueprints, named commanders).

### 7.3 Transport, Routes & Arbitrage

Goods sold cross-region must **physically move** along trade routes:

```
DeliveredCost = GoodsPrice
  + TransportFee
  + RiskPremium (route danger)
TransportTime = Distance / CaravanSpeed × (1 + TerrainFriction)
TransportFee  = baseFee × Distance × Volume × (1 − CoastalDiscount)
```

- **Caravans can be raided** (supply-chain attack, §8) → arbitrage carries real risk → logistics players and escorts earn fees.
- **Coastal/River plots** reduce transport cost (terrain economic edge).
- **Arbitrage** is intended: price gaps between regions reward Traders and Logistics providers who move goods, which in turn equalizes prices (efficient market emerges from player greed).

### 7.4 Market Sinks (token + fee burn)

- **Listing fee** (small $WAR per order) — discourages spam orders.
- **Transaction fee** (% of trade value) — primary market sink; split: burn / Allegiance-region-tax / season pool.
- **Logistics fee** (transport) — paid to courier or NPC fallback.
- **Premium placement** (boost order visibility) — $WAR sink.

### 7.5 Anti-Manipulation

- Per-account order-rate limits; wash-trading detection (matching self-orders flagged, see §17).
- Regional tax routes a slice of fees to the controlling Allegiance — controlling a trade-hub region is itself a reward (territorial income).

---

## 8. Combat Design

### 8.1 Combat is **not** a pure power check

Outcome = f(power, **counters**, terrain, scouting, commanders, traps, logistics, weather, morale, RNG). A smart 70%-power force that counters correctly and picks terrain can beat a 100%-power force that walks in blind (quantified §9, §18.4).

### 8.2 Action Types

| Action | Goal | Notes |
|---|---|---|
| **Scout** | reveal enemy composition/defenses | costs $WAR + recon units; can be detected/intercepted |
| **Raid** | steal resources fast, light force | hit-and-run; loot cap; low destruction |
| **Siege** | break defenses, occupy/raze | slow, heavy, supply-dependent |
| **Sabotage** | disable a building/factory temporarily | engineers + chemicals; stealth |
| **Blockade** | cut a plot/region's trade routes | strangles economy without direct assault |
| **Supply-chain attack** | raid caravans, hit input producers | indirect warfare; cripples enemy manufacturing |

### 8.3 Unit Roster & Counter Triangle (extended)

```
        beats →
INFANTRY ───► ENGINEERS ───► TURRETS/STRUCTURES
   ▲                              │
   │                              ▼
DRONES ◄─── AIRCRAFT ◄─── ARTILLERY ◄─── TANKS ◄─── INFANTRY(AT)
   │            ▲                                       ▲
   └──► TANKS ──┘                                       │
ENGINEERS ──(repair/traps/sabotage)──────────────────────┘
```

Core counters (multiplicative damage modifiers, see §18.4):

| Attacker | Strong vs | Weak vs |
|---|---|---|
| **Infantry** | Engineers, garrisons | Tanks, Artillery |
| **Tanks** | Infantry, Turrets | Aircraft, Drones, Artillery(AT) |
| **Artillery** | Tanks, Structures, massed Infantry | Aircraft, fast Drones |
| **Aircraft** | Tanks, Artillery, ground | Drones (interceptors), Radar+AA Turrets |
| **Drones** | Aircraft, Infantry, recon | EMP, dedicated AA |
| **Engineers** | structures (sabotage/repair), traps | direct combat (fragile) |

**Support layers:** Turrets (static defense), Radar (vision/ambush negation), Shields (absorb burst, weak vs sustained), EMP (disable drones/electronics for N rounds), Vehicles (logistics/speed).

### 8.4 Modifiers Stack

```
EffectivePower = Σ_units [ UnitPower
   × CounterMult(unit, enemyComposition)
   × TerrainMult(unit, plotTerrain)
   × WeatherMult(unit, weather)
   × CommanderMult(commander, unit, situation)
   × MoraleMult
   × LogisticsMult(supply_ratio) ]
```

- **Terrain**: mountains favor defenders (+30%), forests enable infantry ambush, open desert favors tanks/air, rivers slow ground crossings.
- **Weather** (seasonal/regional, RNG-seeded): fog grounds aircraft, rain slows tanks, storms cut drone accuracy.
- **Commanders**: account-permanent hero units with skill trees (e.g., "+15% infantry in forest", "ambush specialist"). Commanders persist across seasons (progression hook).
- **Morale**: drops when supply is cut, when outnumbered after losses, or when a commander falls; low morale → rout chance.
- **Logistics**: army away from home consumes Food/Fuel; cut supply → `LogisticsMult` falls → besiegers can be starved out (defender's strategy).
- **Traps**: engineers pre-place mines/decoys on owned plots; trigger on attack for burst damage + RNG ambush.

### 8.5 What you can lose / steal

- **Lootable**: stored raw/intermediate/finished resources (up to a loot cap; vaults protect a %).
- **Destroyable**: buildings (repairable), production-in-progress, troops.
- **Never lost**: **staked $WAR**, account level, commanders, cosmetics, reputation. Conquest of a vulnerable plot transfers the *staking right*, returning principal to the loser.

### 8.6 Battle Resolution

Rounds-based deterministic-with-seeded-RNG resolution (server-authoritative, reproducible from a seed for dispute/audit). Each round: target selection by counter priority → damage with RNG band → morale check → retreat/rout check. Full battle log stored (event-sourced) so players can review and learn.

---

## 9. RNG Design

### 9.1 Philosophy: **Controlled** RNG

RNG should reward smart play, never make outcomes a coin flip. We use **bounded variance** plus **skill-gated swing events**: the underdog's upset comes mostly from *correct counters, terrain, scouting, and traps* — RNG is the smaller, final nudge.

### 9.2 Per-hit damage variance (bounded)

```
DamageRoll = BaseDamage × (1 + U(−V, +V))      where V = 0.15 (±15%)
```
Bounded so power still matters in expectation; variance creates texture, not chaos.

### 9.3 Critical / Swing Events (skill-gated)

```
P(ambush) = clamp( base_ambush
   + scouting_advantage_bonus
   + terrain_bonus(forest/mountain for defender)
   + commander_ambush_skill
   − enemy_radar_coverage , 0, P_max )
```
- An **ambush** grants the underdog a free opening round (attacker can't counter-target) and a damage spike.
- These probabilities are **earned** (you scouted, you chose forest, you brought an ambush commander), not free.

### 9.4 The Underdog Win-Chance Model

We define **PowerRatio** `r = P_self / P_enemy`. The base logistic win curve:

```
P_win_base(r) = 1 / (1 + e^(−k·(r − 1)))          k = 4 (steepness)
```

Then **skill/counter terms shift the effective ratio**:

```
r_eff = r × CounterFactor × TerrainFactor × ScoutFactor × CommanderFactor
P_win = clamp( 1 / (1 + e^(−k·(r_eff − 1))) , P_floor, P_ceiling )
```

with `P_floor = 0.05`, `P_ceiling = 0.95` (no fight is ever a guaranteed 0% or 100% — RNG always leaves a sliver).

**Target check (from brief): a 70%-power player who counters correctly should have a meaningful win chance.**

Example: `r = 0.70`. With a hard counter (`CounterFactor = 1.35`), home terrain (`TerrainFactor = 1.20`), and scouting edge (`ScoutFactor = 1.10`):
```
r_eff = 0.70 × 1.35 × 1.20 × 1.10 = 1.248
P_win = 1 / (1 + e^(−4·(1.248−1))) = 1 / (1 + e^(−0.992)) ≈ 0.729  → ~73%
```
So a well-played 70%-power defender flips to a clear favorite — **smart beats strong**. A blind 70%-power attacker (`r_eff = 0.70`) gets:
```
P_win = 1 / (1 + e^(−4·(0.70−1))) ≈ 0.231 → ~23%   (meaningful, not hopeless)
```

### 9.5 Anti-Frustration & Anti-Coinflip Guards

- **Pity/streak dampening**: extreme low-probability upsets are slightly boosted and runaway streaks slightly damped (smooths variance over many battles without removing it).
- **No high-stakes pure-RNG**: territory/season-defining battles use *more rounds* → variance averages out → skill dominates at the top.
- All RNG is **server-seeded and logged** (auditable; see §17 anti-cheat).

---

## 10. Allegiance System

(Alliances are renamed **ALLEGIANCES** per the brief — political/military/economic player organizations.)

### 10.1 Why Allegiances Exist

A solo player can hold a few plots but cannot defend a region, run a full supply chain, or win territory wars. Allegiances pool **specialization** (different members produce different things), **defense** (mutual reinforcement), and **capital** (treasuries) — see game theory §25.

### 10.2 Membership by Contribution Archetype

Members are tagged/recruited by what they bring:

```
Food Producers · Metal Producers · Oil Producers ·
Weapon Manufacturers · Technology Providers · Traders · Warlords · Logistics
```

An Allegiance's strength is its **supply-chain completeness** — a balanced Allegiance can self-supply armies; an unbalanced one must trade externally (and is vulnerable to blockade).

### 10.3 Allegiance Buildings (regional benefits)

| Building | Benefit (region-wide to members) |
|---|---|
| **Headquarters** | enables governance, member cap, sets capital |
| **Fortress** | +defense to all member plots in region, fallback garrison |
| **Trade Hub** | reduced market fees for members, regional order-book control |
| **Radar Network** | shared vision, reduces enemy ambush odds region-wide |
| **Research Center** | shared tech tree, faster blueprint unlocks |
| **Alliance Factory** | mega-factory for capital ships/superweapons; pooled inputs |
| **Alliance Shield Network** | timed regional shield (defensive war tool), big $WAR sink |

### 10.4 Treasuries (three books)

| Treasury | Holds | Funds |
|---|---|---|
| **Token Treasury** | $WAR | building upgrades, shield activations, mercenary hiring, diplomacy proposals |
| **Resource Treasury** | raw/intermediate/finished | war stockpiles, member relief, construction |
| **Military Treasury** | pre-built units / commanders on retainer | rapid reinforcement, defensive surges |

Members **contribute** (logged → contribution score §11.3). Treasury actions require governance approval (§11).

### 10.5 Regional Control

- A region is **controlled** when an Allegiance holds the most **Control Points** (from member plots, fortresses, and territory-war victories) in it.
- Control grants: **tax income** (slice of all market fees + a land tax from non-member plots), **resource bonuses**, **strategic perks** (faster reinforcement, region shield eligibility).
- **Territory Wars**: scheduled war windows where Allegiances contest region control via coordinated sieges + a Control-Point objective race (§18.5). Losing control loses the income but **not** members' staked plots.

### 10.6 Diplomacy & Politics

- **Treaties / Non-Aggression Pacts (NAP)**: on-chain or off-chain signed agreements; breaking a signed NAP incurs a **reputation penalty** and may trigger automatic war-score bonuses for the betrayed side.
- **Trade Agreements**: reduced inter-Allegiance market fees, shared trade hubs.
- **Mergers / Splits**: Allegiances can merge (treasury combine via governance vote) or split (treasury divided by contribution score).
- **Espionage**: spies (special agents) infiltrate to leak intel/treasury info; counter-intel detects them.
- **Betrayal mechanics**: betrayal is *allowed and impactful* but *costly* (reputation, future trust) — emergent politics. EVE-style.

---

## 11. Governance System

### 11.1 Four Governance Models (Allegiance picks one at creation, changeable by vote)

| Model | How decisions pass | Best for |
|---|---|---|
| **Democracy** | 1 member = 1 vote, majority | egalitarian guilds |
| **Weighted Contribution** | votes ∝ contribution score (capped to prevent whale capture) | meritocratic economic Allegiances |
| **Council** | elected council (N seats) votes; members elect council | large orgs, representative |
| **Founder / Autocratic** | founder(s) decide; members advise | fast-moving war machines |

All models support: **apply to join → members/council/founder vote → admit**, plus **promote, demote, vote-out (impeach)**.

### 11.2 Roles & Powers

```
Founder ─► Officers/Council ─► Veterans ─► Members ─► Recruits (probation)
```
Each role has granular permissions (treasury withdraw limits, declare war, sign treaties, kick, invite). Permissions are matrix-configurable.

### 11.3 Contribution Score (CS)

```
CS_member = w1·ResourcesDonated_norm
          + w2·TokenDonated_norm
          + w3·UnitsDonated_norm
          + w4·WarParticipation (battles, region defense)
          + w5·MarketTaxGenerated (trade routed through Allegiance hub)
          − decay(time)        (CS decays if inactive → prevents coasting)
```
CS drives weighted voting, reward splits (§14), and promotion eligibility. **Normalized & capped** per category to stop a single whale from buying governance.

### 11.4 Reputation System (account-permanent, cross-season)

```
Reputation = base
  + honored_treaties − broken_treaties×penalty
  + contracts_fulfilled − contracts_defaulted×penalty
  + verified_fair_play (anti-bot clean record)
```
- High rep → lower collateral on contracts, recruitment appeal, diplomatic trust, market trust badges.
- Low rep → flagged as betrayer/scammer; higher contract collateral required; reduced matchmaking trust.
- **Reputation survives season resets** — it is part of the permanent identity layer.

### 11.5 Anti-Capture Safeguards

- Weighted-vote caps (no member > X% voting weight).
- Treasury withdrawals above thresholds require multi-sig (officer quorum) — mirrors on-chain treasury multisig (§20).
- Time-locked major actions (merge, dissolve, mass-treasury-move) → 24–48h delay so members can react/veto.

---

## 12. Tokenomics

### 12.1 Token: $WAR

| Property | Value |
|---|---|
| **Type** | Fixed-supply utility token (no inflationary minting for rewards) |
| **Max supply** | e.g., 1,000,000,000 $WAR (fixed) |
| **Reward source** | **Sinks only** — rewards are redistributed from collected fees/burns, never freshly minted |
| **Core utility** | staking land, upgrades, speed-ups, fees, governance actions, cosmetics |

### 12.2 The "Not a Reward Printer" Invariant

**Hard invariant enforced by the Treasury contract:**

```
Σ Rewards_distributed(season s) ≤ Σ Sinks_collected(season s) − Σ Burns(season s)
```

The protocol literally cannot pay out more than it took in. A configurable **burn share** permanently removes a fraction of sinks (deflationary pressure), the remainder funds reward pools. This is the entire sustainability thesis (see §14).

### 12.3 Token Flow Diagram

```
                         ┌───────────────────────────────┐
   PLAYERS ──stake──►  STAKING CONTRACT  (locked, returnable)
                         └───────────────────────────────┘

   PLAYERS ──fees/upkeep/speedups/cosmetics──►  SINK ROUTER
                                                   │
                        ┌──────────────────────────┼───────────────────────┐
                        ▼                           ▼                       ▼
                   BURN (X%)               SEASON REWARD POOL (Y%)   ALLEGIANCE/REGION TAX (Z%)
                  (supply ↓)                       │                        │
                                                   ▼                        ▼
                                          PLAYERS (ranked payout)   ALLEGIANCE TREASURIES
                                                                            │
                                                                            ▼
                                                                    re-spent (sinks) ↺
```

X + Y + Z = 100% of each sink, tunable by governance within guardrails (e.g., burn ≥ 20%).

### 12.4 Initial Distribution (illustrative)

| Bucket | % | Vesting |
|---|---|---|
| Ecosystem / Season Reward Reserve | 30% | released only as matched by sinks (anti-inflation) |
| Community / Airdrop / Early Players | 15% | linear 12–24mo |
| Team | 18% | 12mo cliff, 36mo linear |
| Investors | 17% | 6–12mo cliff, 24–36mo linear |
| Treasury / Ops (DAO) | 12% | governance-controlled |
| Liquidity | 8% | locked LP |

> The "Reward Reserve" is *not* an emission schedule — it can only be drawn down in lockstep with sinks via the §12.2 invariant. If sinks are low, payouts are low. This prevents the classic P2E death spiral.

### 12.5 Staking Mechanics

- Stake to claim/secure plot; **principal always returnable** after unbonding (7d).
- **Early-unstake fee** (sink) discourages mercenary unstaking mid-war.
- **No staking yield from inflation.** "Yield" comes only from *playing the plot* (production you sell) — staking is a productivity bond, not passive APR. This is critical: it kills the "stake-and-farm-emissions" exploit.

---

## 13. Token Sinks

**100+ ranked sinks.** Rank = importance/volume as an economic sink (1 = largest, most constant drain). Tiers: **S** (structural, always-on), **A** (high), **B** (medium), **C** (situational/cosmetic).

### S-Tier (structural, the backbone of sustainability)

| # | Sink | Tier |
|---|---|---|
| 1 | Plot staking lock-up (opportunity cost; removes circulating supply) | S |
| 2 | Marketplace transaction fee (% of every trade) | S |
| 3 | Plot upkeep / maintenance (recurring per plot, scales with count) | S |
| 4 | Early-unstake fee | S |
| 5 | Building upgrade costs | S |
| 6 | Factory upgrade / new factory slot | S |
| 7 | Troop training fees | S |
| 8 | Production job-init fees (per batch) | S |
| 9 | Logistics / transport fees | S |
| 10 | Market listing fees | S |

### A-Tier (high-volume gameplay sinks)

| # | Sink | Tier |
|---|---|---|
| 11 | Speed-up: production | A |
| 12 | Speed-up: construction | A |
| 13 | Speed-up: research | A |
| 14 | Speed-up: troop movement/march | A |
| 15 | Speed-up: healing/repair | A |
| 16 | Scouting cost (per scout mission) | A |
| 17 | Repair buildings after raids | A |
| 18 | Repair/heal units | A |
| 19 | Research tier unlocks (tech tree) | A |
| 20 | Blueprint purchase/unlock | A |
| 21 | Allegiance creation fee | A |
| 22 | Allegiance building construction | A |
| 23 | Allegiance building upgrades | A |
| 24 | Allegiance Shield Network activation | A |
| 25 | Territory war participation fee | A |
| 26 | Region tax (paid by non-controlling plots) | A |
| 27 | Mercenary contract escrow fee | A |
| 28 | Battle pass purchase | A |
| 29 | Tournament entry fee | A |
| 30 | Premium order placement (market boost) | A |
| 31 | Caravan escort hiring | A |
| 32 | Trap placement (engineering) | A |
| 33 | Sabotage mission cost | A |
| 34 | Blockade establishment cost | A |
| 35 | Re-spec specialization | A |

### B-Tier (medium / progression / convenience)

| # | Sink | Tier |
|---|---|---|
| 36 | Plot upgrade (terrain improvement) | B |
| 37 | Additional production queue slot | B |
| 38 | Warehouse/vault capacity upgrade | B |
| 39 | Population/housing upgrade | B |
| 40 | Workforce reallocation fee | B |
| 41 | Commander recruitment | B |
| 42 | Commander skill respec | B |
| 43 | Commander XP boosters | B |
| 44 | Radar coverage extension | B |
| 45 | Diplomacy proposal fee (treaty/NAP submission) | B |
| 46 | Alliance merge fee | B |
| 47 | Alliance rename | B |
| 48 | Alliance emblem/banner customization | B |
| 49 | Region rename (controlling Allegiance) | B |
| 50 | Auction house listing (rare items) | B |
| 51 | Contract creation fee | B |
| 52 | Contract default penalty (forfeit collateral) | B |
| 53 | Espionage mission cost | B |
| 54 | Counter-intelligence sweep | B |
| 55 | Vault insurance (protect % of loot) | B |
| 56 | Instant-relocate plot adjacency (rare) | B |
| 57 | Trade route establishment fee | B |
| 58 | Naval route licensing (coastal) | B |
| 59 | Weather forecast intel purchase | B |
| 60 | Recon drone deployment | B |
| 61 | Superweapon/Alliance-factory job fee | B |
| 62 | Garrison reinforcement call | B |
| 63 | Defensive surge (temporary) | B |
| 64 | Production priority bump | B |
| 65 | Market analytics subscription | B |
| 66 | Name change (account) | B |
| 67 | Loadout save slots | B |
| 68 | Multi-plot management console | B |
| 69 | Fast-travel command for commander | B |
| 70 | Reinforcement teleport (limited) | B |

### C-Tier (cosmetic / vanity / situational — non-P2W)

| # | Sink | Tier |
|---|---|---|
| 71 | Base skins | C |
| 72 | Unit skins | C |
| 73 | Commander skins/outfits | C |
| 74 | Map marker/emote packs | C |
| 75 | Victory animations | C |
| 76 | Profile frames/badges | C |
| 77 | Alliance hall cosmetics | C |
| 78 | Custom war banners | C |
| 79 | Terrain decorations | C |
| 80 | Seasonal cosmetic bundles | C |
| 81 | Trophy display upgrades | C |
| 82 | Title purchases (vanity) | C |
| 83 | Chat color/flair | C |
| 84 | Animated emblems | C |
| 85 | Founder commemorative items | C |
| 86 | Pet/mascot units (cosmetic) | C |
| 87 | Custom march path visuals | C |
| 88 | Replay export/share premium | C |
| 89 | Spectator-mode premium features | C |
| 90 | Leaderboard highlight | C |
| 91 | Custom region flag art | C |
| 92 | Soundtrack/voicepack packs | C |
| 93 | HQ throne-room cosmetics | C |
| 94 | Seasonal portrait packs | C |
| 95 | Cosmetic loot-crate keys | C |
| 96 | Gifting fee (send cosmetic to friend) | C |
| 97 | Memorial plots (lore/vanity) | C |
| 98 | Photo-mode premium filters | C |
| 99 | Anniversary commemoratives | C |
| 100| Vanity "scorched earth" raze animation | C |
| 101| Custom alliance anthem | C |
| 102| Prestige nameplate after season | C |

> **Importance ranking summary:** Sinks #1–10 (S-tier) account for the majority of constant token drain and are what fund the reward pools sustainably. A-tier scales with engagement and war intensity. B/C tiers add depth and vanity demand without touching power balance (C-tier is strictly cosmetic → no pay-to-win).

---

## 14. Reward System

### 14.1 Principle: Rewards are redistributed sinks

No infinite emissions. Each season, collected sinks (minus burn) fill **reward pools**. Players compete for shares. Net token supply is **flat-to-deflationary**.

### 14.2 Reward Pools

| Pool | Funded by | Distributed to |
|---|---|---|
| **Season Ladder Pool** | Y% of all sinks | top ranked players/Allegiances by season score |
| **War Rewards** | territory-war fees + a share of raid-fee sinks | victors of territory wars, war MVPs |
| **Tournament Rewards** | tournament entry fees (self-funded) | tournament winners |
| **Territory Income** | region taxes (continuous) | controlling Allegiances (ongoing, not season-end) |
| **Marketplace Earnings** | player-to-player trade | players directly (this is *earned*, not from pool — the biggest real "income") |

### 14.3 Where players actually make money

1. **Be productive and sell**: farmers/miners/manufacturers earn by selling goods other players need — pure player-to-player value, the dominant income.
2. **Win wars / hold territory**: region tax + war pool.
3. **Rank high**: season ladder pool.
4. **Provide services**: logistics, mercenary, escort, intel — fee income.
5. **Trade/arbitrage**: buy low region A, sell high region B.

> Crucially, (1)–(5) are **zero-sum-to-positive relative to other players**, funded by sinks — not by minting. You profit by out-competing, not by extracting protocol inflation.

### 14.4 Season Score (drives ladder payout)

```
SeasonScore = w1·EconomicOutput (goods produced & sold)
            + w2·MilitaryScore (raids won, defenses held, war participation)
            + w3·TerritoryContribution (control points held × time)
            + w4·AllegianceContribution (CS)
            − penalties (botting flags, treaty-breaks)
```
Payout uses a **smoothed top-heavy curve** (not winner-take-all) so mid-ranked players still earn (retention). See §18.6 reward-share formula.

---

## 15. Seasonal Design

### 15.1 Season = 30 days

```
PRE-SEASON (3d): map generation, land claim rush, Allegiance formation, beginner protection
   │
ACTIVE (24d): economy build-up → escalating war → territory consolidation
   │  ├─ Week 1: Expansion (claim, build, specialize)
   │  ├─ Week 2: Economy & Trade maturity, first skirmishes
   │  ├─ Week 3: Territory Wars open, Allegiance conflicts peak
   │  └─ Week 4: Crucible endgame, region finals
   │
CLIMAX (2d): final territory wars, season-defining battles (multi-round, skill-dominant)
   │
RESOLUTION (1d): rankings finalized → reward pools distributed → cosmetics/rep/commanders banked → map archived → next map seeds
```

### 15.2 What carries over vs resets

| Persists (account layer) | Resets (season layer) |
|---|---|
| Account level / mastery | Temporary territory & region control |
| Commanders (+ their progression) | Seasonal rankings & scores |
| Reputation | Map-specific plots (must re-stake/re-claim) |
| Cosmetics & prestige titles | In-world resource stockpiles |
| **Staked $WAR principal** (returned at unbond) | Seasonal buff/research progress (partial) |

> Staked principal is never burned by a reset — at season end stakes unbond and players re-stake into the new map (or withdraw). Re-staking quickly is incentivized (loyalty bonus = small sink-funded perk, not emission).

### 15.3 Season Variety (meta-shifts)

Each season tweaks rules (modifier seasons): "Oil Crisis" (fuel scarce), "Tech Boom" (research cheap), "Total War" (faster decay, bigger war pool). Keeps the meta fresh and prevents solved-game stagnation.

---

## 16. Anti-Whale Design

Goal: capital helps, but **cannot dominate** — skill, coordination, and logistics gate raw spending.

### 16.1 Diminishing Returns on Plots

```
EffectiveYield(n-th plot) = BaseYield × DR(n)
DR(n) = 1 / (1 + α·(n − 1))        α = 0.12
```
e.g., 1st plot 100%, 5th plot ≈ 68%, 10th plot ≈ 49%. Each extra plot yields less.

### 16.2 Super-Linear Upkeep

```
UpkeepTotal = Σ_{i=1}^{n} BaseUpkeep × (1 + β·(i−1))     β = 0.15
```
Upkeep grows faster than linear → an empire of 30 plots bleeds resources/$WAR maintenance super-linearly. Past a point, marginal plots are net-negative without elite logistics.

### 16.3 Logistics Complexity

Coordinating many non-adjacent plots requires Food/Fuel transport and command bandwidth (limited simultaneous marches/commanders). Whales hit a **management ceiling**, not just a cost ceiling.

### 16.4 Territory Maintenance

Holding region control costs continuous treasury + active defense. A whale can buy plots but cannot *personally* defend 64 sectors → must rely on an Allegiance (which dilutes their control → social anti-whale).

### 16.5 Attack Inefficiency vs. Smaller Targets

```
LootEfficiency = clamp(1 − γ·(AttackerPower / DefenderPower − 1), LootMin, 1)
γ = 0.25, LootMin = 0.2
```
Stomping a much weaker target yields **diminished loot** (and a reputation/"bully" penalty). Big armies are most efficient against peers → whales can't farm minnows profitably.

### 16.6 Governance Caps

Weighted-vote cap (§11.5): no single wallet exceeds X% voting weight regardless of contribution → can't buy an Allegiance.

### 16.7 Net Effect

Capital buys a *head start and resilience*, not invulnerability. The dominant strategies are **specialize + trade + ally + play well**, which are open to non-whales.

---

## 17. Anti-Bot Design

### 17.1 Anti-Bot (automation detection)

- **Behavioral biometrics**: action timing entropy, mouse/touch dynamics, navigation patterns → ML classifier flags inhuman regularity.
- **Server-side rate limits & action cost**: every meaningful action has a $WAR/resource cost or cooldown → botting is *expensive*, not free.
- **Proof-of-Humanity gates** on high-value actions (claim, large withdrawal): adaptive challenges (only when risk score high → minimal friction for normal players).
- **Vercel BotID / WAF** at the edge for request-level bot filtering; **rate-limiting** and **Attack Mode** on the API.
- **Honeypot actions/plots**: traps that only bots would interact with.

### 17.2 Anti-Multi-Account (Sybil resistance)

- **Stake-gated identity**: every plot requires real staked $WAR → Sybil farms need real capital (the staking requirement *is* a Sybil tax).
- **Device/network fingerprinting** + clustering to detect linked accounts; correlated behavior (same IP/device cohorts trading suspiciously) flagged.
- **Wallet graph analysis** (on-chain): clusters that only transact among themselves to wash-reward are detected; reward eligibility scored by graph centrality/diversity.
- **Optional KYC tier** for large reward withdrawals / tournaments (compliance + Sybil break) — gameplay stays pseudonymous, *cash-out* of large sums is gated.
- **Reputation requirement** for high-value market/contract access (new alts start low-trust).

### 17.3 Anti-Farm (RMT / reward-farming)

- **Wash-trade detection**: self-matched orders, circular trades, non-economic price patterns flagged → fees clawed back, accounts penalized.
- **Loot diminishing returns** (§16.5) makes alt-farming (strong alt smashing weak alt) unprofitable.
- **Reward eligibility scoring**: season payouts weighted by *diverse* economic/military interaction, not isolated grind → an island of alts trading with itself scores ~0.
- **Anomaly economics**: statistical monitors on production/trade velocity per account; outliers reviewed.
- **Soft + hard penalties**: shadow-flag → reduced rewards → stake slashing of *ill-gotten resource gains* (never the principal stake unless ToS fraud) → ban.

### 17.4 Fair-Play Reputation Loop

Clean accounts accrue **verified fair-play reputation** → lower friction (fewer challenges), better contract terms. Bad actors face escalating friction. Friction is *targeted*, so legit players rarely see a captcha.

---

## 18. Balancing Formulas

> All constants are *tuning seeds* for a balancing spreadsheet, not final values. Notation: `clamp(x,lo,hi)`.

### 18.1 Production

```
Output_per_hour =
   BaseRate
 × TerrainMult            (e.g., Forest wood ×1.15)
 × (1 + 0.10·(BuildingLevel − 1))
 × WorkforceMult
 × ResearchMult
 × DR(plotIndex)          (§16.1 diminishing returns)
 × (1 − Congestion)       (regional over-production depresses local efficiency)
 × EventMult              (weather/season modifier)

WorkforceMult = clamp(assignedLabor / requiredLabor, 0, 1.25)
Congestion    = clamp(δ · (localSupply / localDemand − 1), 0, 0.4)   δ = 0.2
```

### 18.2 Manufacturing Time

```
BatchTime = (UnitTime × Qty) / (FactoryEfficiency × WorkforceFactor)
          × (1 + QueueCongestion)
FactoryEfficiency = BaseEff × (1+0.05·Lvl) × TerrainMult × (1+SpecBonus) × ResearchMult × (1−MaintenanceDebt)
```

### 18.3 Power Rating

```
UnitPower      = (Attack·a + Defense·b + HP·c + Speed·d) × QualityTierMult
ArmyPower      = Σ UnitPower
EffectivePower = Σ_units UnitPower × CounterMult × TerrainMult × WeatherMult × CommanderMult × MoraleMult × LogisticsMult
```

### 18.4 Combat Resolution (per round)

```
For each round until one side routs or is destroyed:
  1. Target selection: each unit type targets its priority counter first.
  2. Damage:  Dmg = AttackerEffPower_type × CounterMult × (1 + U(−0.15,+0.15))
              CounterMult ∈ {1.5 hard-counter, 1.2 soft, 1.0 neutral, 0.8 soft-bad, 0.6 hard-bad}
  3. Apply casualties (proportional to Dmg / enemy effective HP pool).
  4. Morale:  Morale -= k_m · (lossesThisRound / startingForce) − commanderMoraleBonus
  5. Rout check: if Morale < MoraleFloor → P(rout) rises; routed side flees (reduced losses, loses field).
```

### 18.5 Win Probability (underdog model, from §9.4)

```
r      = P_self / P_enemy
r_eff  = r × CounterFactor × TerrainFactor × ScoutFactor × CommanderFactor
P_win  = clamp( 1 / (1 + e^(−k·(r_eff − 1))) , 0.05, 0.95 )    k = 4

Factor bands:
  CounterFactor   ∈ [0.8, 1.4]   (composition match vs enemy)
  TerrainFactor   ∈ [0.85, 1.25] (home/defensive terrain)
  ScoutFactor     ∈ [0.95, 1.15] (intel advantage)
  CommanderFactor ∈ [0.9, 1.2]   (commander skill fit)
```

### 18.6 Loot

```
LootableStore = StoredResources × (1 − VaultProtected%)
LootTaken     = min( LootCap(attackerCapacity),
                     LootableStore × RaidSuccess% × LootEfficiency )
LootEfficiency = clamp(1 − γ·(P_attacker/P_defender − 1), 0.2, 1)    γ = 0.25  (§16.5)
RaidSuccess%   = P_win adjusted for raid-vs-siege intent
```

### 18.7 Plot Decay (unstaked / upkeep-unpaid)

```
day d in decay:
  Production_d = Production_0 × (1 − ρ)^d        ρ = 0.20
  Defense_d    = Defense_0   × (1 − σ)^d         σ = 0.30
  Vulnerable when Defense_d < V_threshold (e.g., 0.4·Defense_0)
Unbonding: staked principal returns after 7 days regardless (minus early-unstake fee).
```

### 18.8 Territory Control Points

```
ControlPoints(Allegiance, region) =
    Σ_memberPlots PlotWeight(terrain)
  + FortressBonus
  + WarVictoryPoints
  − EnemyContestPressure
Region controlled by argmax(ControlPoints). Tax accrues ∝ (CP_share).
```

### 18.9 Allegiance Contribution Score (from §11.3)

```
CS = Σ_k w_k · normalize(contribution_k)  − decay(Δt)
normalize caps each category to prevent single-category whale dominance.
```

### 18.10 Season Reward Share (top-heavy but not winner-take-all)

```
Share_i = (Score_i^p) / Σ_j (Score_j^p)        p = 1.5  (mild top-heaviness)
Payout_i = Share_i × SeasonPool
SeasonPool = Y% × (TotalSinks − Burns)         (§12.2 invariant)
```
`p>1` rewards top players more; `p` modest so ranks 100–1000 still earn → retention.

### 18.11 Diminishing Returns (generic)

```
DR(n) = 1 / (1 + α·(n−1))           plots, stacked buffs, repeated buildings
```

### 18.12 Economic Efficiency (specialist > generalist)

```
SpecBonus = s_max · (focusRatio)^q        focusRatio = output_in_specialty / total_output
                                          s_max = 0.35, q = 1.2
GeneralistPenalty: spreading across m product lines → each line gets BaseEff/√m effective focus.
```
A focused producer enjoys up to +35% efficiency; a jack-of-all-trades loses to specialists on every line → **trade emerges** (game theory §25).

### 18.13 Movement

```
TravelTime = Σ_hexes (HexBaseTime × TerrainFriction_hex) / (UnitSpeed × CommanderSpeedMod)
TerrainFriction: road 0.6, plains 1.0, forest 1.3, river-crossing 1.8, mountain 2.0
SupplyConsumption = unitsCount × (Food+Fuel)_per_hex × distance
```

### 18.14 Anti-Whale Upkeep (from §16.2)

```
UpkeepTotal = Σ_{i=1}^{n} BaseUpkeep · (1 + β·(i−1))     β = 0.15
```

---

## 19. Technical Architecture

### 19.1 High-Level

```
        ┌────────────────────────── CLIENTS ──────────────────────────┐
        │  Web (Next.js/React)   PWA/Mobile (React Native + shared TS) │
        └───────────────┬──────────────────────────┬──────────────────┘
                        │ HTTPS / WSS               │ wallet (WalletConnect)
            ┌───────────▼──────────────┐   ┌────────▼─────────┐
            │  EDGE / API GATEWAY       │   │  BLOCKCHAIN RPC   │
            │  (Vercel Functions, WAF,  │   │  (L2 nodes)       │
            │   BotID, rate limit, auth)│   └────────┬──────────┘
            └───────────┬──────────────┘            │
                        │ gRPC/NATS                  │ events/indexer
        ┌───────────────▼───────────────────────────▼───────────────────┐
        │                    GAME SERVICES (stateless API)               │
        │  Auth · Player · Plot · Economy/Market · Combat · Allegiance ·  │
        │  Diplomacy · Season · Reward · Anti-Cheat                       │
        └───────────────┬───────────────────────────┬───────────────────┘
                        │                            │
        ┌───────────────▼──────────┐   ┌─────────────▼────────────────┐
        │  REAL-TIME SIM LAYER      │   │  DATA LAYER                  │
        │  Sector Simulation Shards │   │  Postgres (OLTP, sharded)    │
        │  (authoritative tick),    │   │  Redis (cache/locks/pubsub)  │
        │  WebSocket gateway,        │   │  Timeseries (metrics/econ)   │
        │  matchmaking-free          │   │  Event store (battle logs)  │
        └───────────────┬──────────┘   │  Object store (replays)      │
                        │              │  Search (ClickHouse/OLAP)    │
                ┌───────▼────────┐     └──────────────────────────────┘
                │ MESSAGE BUS     │  Kafka/NATS: events, jobs, indexer ingest
                └─────────────────┘
```

### 19.2 Recommended Stack

| Layer | Choice | Why |
|---|---|---|
| **Web client** | Next.js (App Router) + React + TypeScript, deployed on Vercel; PixiJS/WebGL for the map canvas | fast iteration, SSR for landing/SEO, WebGL for 250k-hex map rendering with culling |
| **Mobile** | React Native (shared TS domain logic) or PWA-first | code reuse; PWA lowers store friction |
| **Edge/API** | Vercel Functions (Fluid Compute, Node 24) + Vercel WAF/BotID for the public API/gateway; long-lived sim runs on dedicated infra | edge security, autoscale, Node runtime |
| **Game services** | Go or Rust microservices (combat/sim), NestJS/TypeScript for CRUD-y services | Go/Rust for hot sim loops; TS for product velocity |
| **Real-time** | WebSockets via a gateway; authoritative server tick per sector | server-authoritative anti-cheat |
| **Sim model** | **Event-sourced + tick-based** per sector; CQRS (write = commands → events; read = projections) | reproducible, auditable, horizontally shardable |
| **Bus** | Kafka (or NATS JetStream) | event backbone, indexer ingest, job queue |
| **DB (OLTP)** | PostgreSQL, sharded by region/sector (Citus or Vitess-style); Neon/managed for elasticity | relational integrity for economy/ownership |
| **Cache/locks** | Redis (Upstash) — hot state, distributed locks, pub/sub | low-latency reads, rate limiting |
| **OLAP/analytics** | ClickHouse | economy dashboards, anti-bot analytics, balancing |
| **Object/replays** | S3/Vercel Blob | battle replays, season archives |
| **Indexer** | The Graph / custom indexer on L2 events | sync on-chain stake/market state to off-chain DB |

### 19.3 Scaling to 100k+ CCU

1. **Spatial sharding**: the world is partitioned into **Sectors**; each sector is an independently-simulated shard. Players mostly interact locally → traffic naturally partitions. Cross-sector actions (long marches, global trade) go through the bus.
2. **Authoritative tick + delta sync**: clients receive compressed deltas over WebSocket; the map renders client-side via WebGL with viewport culling (only nearby hexes streamed).
3. **CQRS read models**: heavy reads (map view, market depth) served from Redis/ClickHouse projections, not the OLTP write path.
4. **Stateless services + autoscale**: API services scale horizontally; sim shards scale by sector count.
5. **Async heavy compute**: battle resolution, season payout, decay sweeps run as queued jobs (idempotent, event-sourced).
6. **Hot/cold separation**: active season in hot Postgres/Redis; archived seasons to cold storage/OLAP.
7. **Backpressure & rate limits** at edge (WAF) protect the sim from spikes/bots.

### 19.4 Real-Time Consistency

- **Optimistic client + server reconciliation** for UX snappiness; server is source of truth.
- **Distributed locks** (Redis) on plot/market mutations to prevent double-spend/double-claim.
- **On-chain ↔ off-chain reconciliation**: staking/market settlement events emitted on L2, indexed, and reflected in DB; periodic Merkle checkpoint of off-chain economy state anchored on-chain for verifiability (optimistic-rollup-style trust).

---

## 20. Smart Contract Architecture

### 20.1 Chain Recommendation

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Ethereum L2 (Arbitrum / Base / Optimism)** | low fees, EVM tooling, security from L1, deep liquidity | bridge UX | **Recommended primary** (Base or Arbitrum) |
| **App-chain (Arbitrum Orbit / OP Stack)** | custom gas, throughput, game-tuned | ops overhead, bootstrapping liquidity | Phase 2 if volume demands |
| Solana | high TPS, low fee | non-EVM, different tooling | alt option |
| **Polygon PoS/zkEVM** | cheap, mature | — | viable alternative |

**Decision (updated):** Launch on **Solana** for low fees + high throughput. `$WAR` is an **SPL token (Token-2022)** — live on **devnet** today (mint `BHdvBpziU37TjyNCxjrFy4FFQ1DP2TButgrZyP9Qi8pT`). Keep most gameplay **off-chain** (server-authoritative); use the chain only for **value events**: staking, market settlement of high-value/withdrawable assets, treasury, reward claims, governance, and economy checkpoints. On-chain logic (staking vault, sinks, rewards) is implemented as **Anchor programs** (Rust). _(An earlier draft of this doc targeted an EVM L2 (Base/Arbitrum); that approach was deployed to Base Sepolia and then superseded by Solana.)_ Don't put hexes on-chain.

### 20.2 Contract Suite

```
$WAR Token (ERC-20)
 ├─ fixed supply, burnable, permit (gasless approve)
 │
StakingManager
 ├─ stakeForPlot(plotId, amount) → locks, mints non-transferable "PlotRight" (soulbound-ish ERC-721 or internal record)
 ├─ requestUnstake(plotId) → starts 7d unbonding
 ├─ withdraw(plotId) → returns principal − earlyUnstakeFee(if early)
 ├─ slashIneligible() → only for ToS/fraud, governance-gated (never normal play)
 │
PlotRegistry (ERC-721, "soulbound while staked")
 ├─ ownership = staking right; transfer only via conquest settlement or sale-with-stake-transfer
 │
MarketplaceSettlement
 ├─ on-chain escrow & settlement for high-value/withdrawable assets (blueprints, rare items, $WAR trades)
 ├─ fee router: splits fee → burn / season pool / region tax
 │  (commodity micro-trades settle off-chain, checkpointed)
 │
TreasuryVault (per-Allegiance, multisig / module)
 ├─ deposit/withdraw with governance + timelock + quorum
 ├─ holds $WAR; resource/military treasuries tracked off-chain, value-anchored
 │
RewardDistributor
 ├─ enforces INVARIANT: claimable ≤ sinksCollected − burns  (§12.2)
 ├─ Merkle-drop per season (gas-efficient claims), pull-based
 │
GovernanceModule
 ├─ Allegiance governance (4 models §11) + protocol DAO
 ├─ timelock on major actions
 │
SinkRouter
 ├─ single entrypoint all $WAR sinks flow through → splits burn / pool / tax (tunable within guardrails, e.g. burn ≥ 20%)
 │
EconomyCheckpoint (optimistic)
 ├─ periodic Merkle root of off-chain economy state, challenge window, anchors trust
```

### 20.3 Key Contract Invariants

1. **Principal safety**: `StakingManager` can only return principal to the original staker (or transfer the *right* on conquest/sale); it can never send a player's principal to another player as loot.
2. **No mint-for-rewards**: `RewardDistributor` has **no minting authority**; it can only distribute from a pool that was filled by `SinkRouter`. Enforced: `totalClaimable ≤ poolBalance`.
3. **Burn floor**: `SinkRouter` burns ≥ a governance-bounded minimum each epoch → structural deflation.
4. **Timelock + multisig** on all treasury and parameter changes.
5. **Reentrancy guards, pausable, upgradeable via transparent proxy** with timelocked admin (audited).

### 20.4 On-chain vs Off-chain Split

| On-chain | Off-chain (server-authoritative, checkpointed) |
|---|---|
| $WAR balances, staking, unbonding | hex map, plots-as-tiles, buildings, troop positions |
| Plot staking rights (ownership) | resource stockpiles, production queues |
| High-value/withdrawable asset trades | commodity micro-market matching |
| Treasury, governance, reward claims | combat resolution, movement, scouting |
| Economy Merkle checkpoints | fog of war, RNG seeds (revealed/auditable) |

---

## 21. Database Schema

### 21.1 ERD (core entities)

```
PLAYERS ───< PLOTS >─── PLOT_TYPES
   │            │
   │            ├──< BUILDINGS
   │            ├──< FACTORIES ──< PRODUCTION_JOBS
   │            ├──< PLOT_RESOURCES
   │            └──< TROOPS
   │
   ├──< STAKES (on-chain mirror)
   ├──< COMMANDERS
   ├──< WALLET_LINKS
   ├──< REPUTATION
   ├── ALLEGIANCE_MEMBERSHIPS >── ALLEGIANCES ──< ALLEGIANCE_BUILDINGS
   │                                  │
   │                                  ├──< TREASURY_TX
   │                                  ├──< GOVERNANCE_PROPOSALS ──< VOTES
   │                                  └──< CONTRIBUTION_SCORES
   │
   ├──< MARKET_ORDERS ──< MARKET_TRADES
   ├──< CONTRACTS
   ├──< BATTLES (attacker/defender) ──< BATTLE_EVENTS
   ├──< MOVEMENTS (marches/caravans)
   └──< SEASON_SCORES >── SEASONS

REGIONS ──< SECTORS ──< PLOTS
REGIONS ──< REGION_CONTROL >── ALLEGIANCES
DIPLOMACY (allegiance_a, allegiance_b, type, status)
TOKEN_SINK_LEDGER  (every sink event → fuels reward pool accounting)
REWARD_CLAIMS (season, player, merkle proof, amount)
```

### 21.2 Selected Table DDL (PostgreSQL)

```sql
-- ============ PLAYERS & IDENTITY ============
CREATE TABLE players (
  id              BIGSERIAL PRIMARY KEY,
  wallet_address  CHAR(42) UNIQUE NOT NULL,
  username        VARCHAR(32) UNIQUE NOT NULL,
  account_level   INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at  TIMESTAMPTZ,
  risk_score      NUMERIC(5,4) DEFAULT 0,        -- anti-bot
  kyc_tier        SMALLINT DEFAULT 0
);
CREATE INDEX idx_players_wallet ON players(wallet_address);
CREATE INDEX idx_players_active ON players(last_active_at);

CREATE TABLE reputation (
  player_id       BIGINT PRIMARY KEY REFERENCES players(id),
  score           INT NOT NULL DEFAULT 1000,
  treaties_kept   INT DEFAULT 0,
  treaties_broken INT DEFAULT 0,
  contracts_ok    INT DEFAULT 0,
  contracts_failed INT DEFAULT 0,
  fair_play       NUMERIC(5,4) DEFAULT 1.0,
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE wallet_links (   -- anti-multiaccount clustering
  id            BIGSERIAL PRIMARY KEY,
  player_id     BIGINT REFERENCES players(id),
  device_hash   VARCHAR(128),
  ip_cidr       CIDR,
  cluster_id    BIGINT,
  confidence    NUMERIC(5,4),
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_wallet_cluster ON wallet_links(cluster_id);

-- ============ WORLD / LAND ============
CREATE TABLE seasons (
  id          INT PRIMARY KEY,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  modifier    VARCHAR(40),
  status      VARCHAR(16) DEFAULT 'pre'   -- pre|active|climax|resolved
);

CREATE TABLE regions (
  id        INT PRIMARY KEY,
  season_id INT REFERENCES seasons(id),
  name      VARCHAR(48),
  center_q  INT, center_r INT             -- axial coords
);

CREATE TABLE sectors (
  id         BIGINT PRIMARY KEY,
  region_id  INT REFERENCES regions(id),
  shard_node VARCHAR(64)                  -- sim shard assignment
);
CREATE INDEX idx_sectors_region ON sectors(region_id);

CREATE TABLE plot_types (
  id           SMALLINT PRIMARY KEY,
  name         VARCHAR(32),
  stake_amount NUMERIC(20,0) NOT NULL,    -- in $WAR base units
  yield_json   JSONB,                     -- terrain modifiers
  defense_mult NUMERIC(4,2)
);

CREATE TABLE plots (
  id            BIGSERIAL PRIMARY KEY,
  season_id     INT REFERENCES seasons(id),
  sector_id     BIGINT REFERENCES sectors(id),
  plot_type_id  SMALLINT REFERENCES plot_types(id),
  q             INT NOT NULL, r INT NOT NULL,   -- axial hex coords
  owner_id      BIGINT REFERENCES players(id),  -- NULL = unclaimed
  status        VARCHAR(16) DEFAULT 'unclaimed',-- active|decaying|vulnerable|unclaimed
  decay_started TIMESTAMPTZ,
  defense_pct   NUMERIC(5,4) DEFAULT 1.0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (season_id, q, r)
);
CREATE INDEX idx_plots_owner   ON plots(owner_id);
CREATE INDEX idx_plots_sector  ON plots(sector_id);
CREATE INDEX idx_plots_status  ON plots(status);
CREATE INDEX idx_plots_coords  ON plots(season_id, q, r);

CREATE TABLE stakes (   -- mirror of on-chain StakingManager
  id            BIGSERIAL PRIMARY KEY,
  player_id     BIGINT REFERENCES players(id),
  plot_id       BIGINT REFERENCES plots(id),
  amount        NUMERIC(20,0) NOT NULL,
  tx_hash       CHAR(66),
  status        VARCHAR(16) DEFAULT 'locked', -- locked|unbonding|withdrawn
  unbond_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_stakes_player ON stakes(player_id);
CREATE UNIQUE INDEX idx_stakes_plot_active ON stakes(plot_id) WHERE status='locked';

-- ============ ECONOMY ON PLOTS ============
CREATE TABLE buildings (
  id        BIGSERIAL PRIMARY KEY,
  plot_id   BIGINT REFERENCES plots(id),
  kind      VARCHAR(32),
  level     INT DEFAULT 1,
  maint_debt NUMERIC(5,4) DEFAULT 0
);
CREATE INDEX idx_buildings_plot ON buildings(plot_id);

CREATE TABLE factories (
  id          BIGSERIAL PRIMARY KEY,
  plot_id     BIGINT REFERENCES plots(id),
  archetype   VARCHAR(24),
  level       INT DEFAULT 1,
  queue_slots INT DEFAULT 1,
  efficiency  NUMERIC(5,4) DEFAULT 1.0
);

CREATE TABLE production_jobs (
  id          BIGSERIAL PRIMARY KEY,
  factory_id  BIGINT REFERENCES factories(id),
  product     VARCHAR(32),
  quantity    INT,
  inputs_json JSONB,
  starts_at   TIMESTAMPTZ,
  finishes_at TIMESTAMPTZ,
  status      VARCHAR(16) DEFAULT 'queued',  -- queued|running|done|cancelled
  priority    SMALLINT DEFAULT 0
);
CREATE INDEX idx_jobs_factory ON production_jobs(factory_id);
CREATE INDEX idx_jobs_finish  ON production_jobs(finishes_at) WHERE status='running';

CREATE TABLE plot_resources (
  plot_id   BIGINT REFERENCES plots(id),
  resource  VARCHAR(24),
  amount    NUMERIC(20,4) DEFAULT 0,
  PRIMARY KEY (plot_id, resource)
);

CREATE TABLE troops (
  id        BIGSERIAL PRIMARY KEY,
  plot_id   BIGINT REFERENCES plots(id),    -- garrison location
  owner_id  BIGINT REFERENCES players(id),
  unit_type VARCHAR(24),
  count     INT DEFAULT 0,
  morale    NUMERIC(5,4) DEFAULT 1.0
);
CREATE INDEX idx_troops_owner ON troops(owner_id);

-- ============ MARKET ============
CREATE TABLE market_orders (
  id         BIGSERIAL PRIMARY KEY,
  player_id  BIGINT REFERENCES players(id),
  region_id  INT REFERENCES regions(id),     -- NULL = global
  side       CHAR(4),                         -- buy|sell
  item       VARCHAR(32),
  qty        NUMERIC(20,4),
  price      NUMERIC(20,8),                   -- in $WAR
  filled     NUMERIC(20,4) DEFAULT 0,
  status     VARCHAR(12) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_orders_book ON market_orders(region_id, item, side, price) WHERE status='open';
CREATE INDEX idx_orders_player ON market_orders(player_id);

CREATE TABLE market_trades (
  id          BIGSERIAL PRIMARY KEY,
  buy_order   BIGINT REFERENCES market_orders(id),
  sell_order  BIGINT REFERENCES market_orders(id),
  item        VARCHAR(32),
  qty         NUMERIC(20,4),
  price       NUMERIC(20,8),
  fee         NUMERIC(20,8),
  executed_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_trades_item_time ON market_trades(item, executed_at);

CREATE TABLE contracts (
  id           BIGSERIAL PRIMARY KEY,
  creator_id   BIGINT REFERENCES players(id),
  taker_id     BIGINT REFERENCES players(id),
  kind         VARCHAR(24),     -- courier|production|mercenary|escort
  terms_json   JSONB,
  collateral   NUMERIC(20,0),
  status       VARCHAR(16) DEFAULT 'open',
  deadline     TIMESTAMPTZ
);

-- ============ COMBAT ============
CREATE TABLE movements (
  id          BIGSERIAL PRIMARY KEY,
  owner_id    BIGINT REFERENCES players(id),
  kind        VARCHAR(16),     -- march|caravan|scout
  from_plot   BIGINT, to_plot BIGINT,
  payload_json JSONB,          -- troops or goods
  depart_at   TIMESTAMPTZ, arrive_at TIMESTAMPTZ,
  status      VARCHAR(16) DEFAULT 'enroute'
);
CREATE INDEX idx_moves_arrive ON movements(arrive_at) WHERE status='enroute';

CREATE TABLE battles (
  id           BIGSERIAL PRIMARY KEY,
  attacker_id  BIGINT REFERENCES players(id),
  defender_id  BIGINT REFERENCES players(id),
  plot_id      BIGINT REFERENCES plots(id),
  intent       VARCHAR(16),    -- raid|siege|sabotage
  seed         BYTEA,          -- RNG seed (auditable)
  result_json  JSONB,
  loot_json    JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_battles_plot ON battles(plot_id);
CREATE INDEX idx_battles_players ON battles(attacker_id, defender_id);

CREATE TABLE battle_events (   -- event-sourced log per round
  id        BIGSERIAL PRIMARY KEY,
  battle_id BIGINT REFERENCES battles(id),
  round_no  INT,
  event     JSONB
);
CREATE INDEX idx_bevents_battle ON battle_events(battle_id, round_no);

-- ============ ALLEGIANCES ============
CREATE TABLE allegiances (
  id           BIGSERIAL PRIMARY KEY,
  name         VARCHAR(48) UNIQUE,
  founder_id   BIGINT REFERENCES players(id),
  gov_model    VARCHAR(24),    -- democracy|weighted|council|founder
  treasury_war NUMERIC(20,0) DEFAULT 0,    -- $WAR (mirror of on-chain vault)
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE allegiance_memberships (
  allegiance_id BIGINT REFERENCES allegiances(id),
  player_id     BIGINT REFERENCES players(id),
  role          VARCHAR(16) DEFAULT 'member',
  archetype     VARCHAR(24),  -- food|metal|oil|weapons|tech|trader|warlord|logistics
  contribution  NUMERIC(20,4) DEFAULT 0,
  joined_at     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (allegiance_id, player_id)
);
CREATE INDEX idx_memb_player ON allegiance_memberships(player_id);

CREATE TABLE allegiance_buildings (
  id            BIGSERIAL PRIMARY KEY,
  allegiance_id BIGINT REFERENCES allegiances(id),
  region_id     INT REFERENCES regions(id),
  kind          VARCHAR(32),  -- hq|fortress|tradehub|radar|research|factory|shield
  level         INT DEFAULT 1
);

CREATE TABLE treasury_tx (
  id            BIGSERIAL PRIMARY KEY,
  allegiance_id BIGINT REFERENCES allegiances(id),
  player_id     BIGINT,
  kind          VARCHAR(16),  -- deposit|withdraw
  asset         VARCHAR(24),  -- WAR|resource|unit
  amount        NUMERIC(20,4),
  tx_hash       CHAR(66),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE governance_proposals (
  id            BIGSERIAL PRIMARY KEY,
  allegiance_id BIGINT REFERENCES allegiances(id),
  proposer_id   BIGINT,
  kind          VARCHAR(32),  -- admit|promote|demote|kick|war|treaty|spend|merge
  payload_json  JSONB,
  status        VARCHAR(16) DEFAULT 'open',
  opens_at      TIMESTAMPTZ, closes_at TIMESTAMPTZ,
  timelock_until TIMESTAMPTZ
);

CREATE TABLE votes (
  proposal_id BIGINT REFERENCES governance_proposals(id),
  player_id   BIGINT REFERENCES players(id),
  weight      NUMERIC(20,4),
  choice      SMALLINT,       -- 1 yes / 0 no / -1 abstain
  PRIMARY KEY (proposal_id, player_id)
);

CREATE TABLE region_control (
  region_id      INT REFERENCES regions(id),
  allegiance_id  BIGINT REFERENCES allegiances(id),
  control_points NUMERIC(20,4),
  tax_rate       NUMERIC(5,4),
  since          TIMESTAMPTZ,
  PRIMARY KEY (region_id, allegiance_id)
);

CREATE TABLE diplomacy (
  id        BIGSERIAL PRIMARY KEY,
  alleg_a   BIGINT REFERENCES allegiances(id),
  alleg_b   BIGINT REFERENCES allegiances(id),
  kind      VARCHAR(24),  -- nap|peace|trade|war|merger
  status    VARCHAR(16),
  signed_at TIMESTAMPTZ, expires_at TIMESTAMPTZ
);

-- ============ TOKENOMICS LEDGER ============
CREATE TABLE token_sink_ledger (
  id         BIGSERIAL PRIMARY KEY,
  season_id  INT REFERENCES seasons(id),
  player_id  BIGINT,
  sink_type  SMALLINT,        -- maps to §13 sink #
  amount     NUMERIC(20,0),
  burned     NUMERIC(20,0),
  to_pool    NUMERIC(20,0),
  to_tax     NUMERIC(20,0),
  tx_hash    CHAR(66),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_sink_season ON token_sink_ledger(season_id, sink_type);

CREATE TABLE season_scores (
  season_id  INT REFERENCES seasons(id),
  player_id  BIGINT REFERENCES players(id),
  econ       NUMERIC(20,4) DEFAULT 0,
  military   NUMERIC(20,4) DEFAULT 0,
  territory  NUMERIC(20,4) DEFAULT 0,
  alleg      NUMERIC(20,4) DEFAULT 0,
  total      NUMERIC(20,4) GENERATED ALWAYS AS (econ+military+territory+alleg) STORED,
  PRIMARY KEY (season_id, player_id)
);
CREATE INDEX idx_scores_total ON season_scores(season_id, total DESC);

CREATE TABLE reward_claims (
  season_id   INT REFERENCES seasons(id),
  player_id   BIGINT REFERENCES players(id),
  amount      NUMERIC(20,0),
  merkle_proof BYTEA,
  claimed     BOOLEAN DEFAULT false,
  claimed_at  TIMESTAMPTZ,
  PRIMARY KEY (season_id, player_id)
);

CREATE TABLE commanders (   -- account-permanent
  id        BIGSERIAL PRIMARY KEY,
  player_id BIGINT REFERENCES players(id),
  name      VARCHAR(40),
  level     INT DEFAULT 1,
  skills_json JSONB
);
CREATE INDEX idx_commanders_player ON commanders(player_id);
```

### 21.3 Indexing & Partitioning Strategy

- **Partition by season** on high-churn tables (`plots`, `market_trades`, `battles`, `token_sink_ledger`) → drop old partitions cheaply at archive.
- **Shard by region/sector** at the cluster level (Citus distribution key = `sector_id`/`region_id`) so local interactions stay node-local.
- **Hot read paths** (map viewport, order book) served from Redis/ClickHouse projections, not these OLTP tables.
- **Covering/partial indexes** on `status='open'`, `status='running'`, `status='enroute'` to keep job/market/movement sweeps fast.

---

## 22. Monetization

### 22.1 Principles

- **Strictly no pay-to-win.** Money buys **time and vanity**, never raw power that's unavailable to F2P.
- **Token-first, fiat-friendly**: support fiat on-ramp → $WAR, but all in-game spend is $WAR (sinks → §13).

### 22.2 Revenue Streams

| Stream | What | P2W risk | Mitigation |
|---|---|---|---|
| **Cosmetics** | skins, banners, titles, animations (§13 C-tier) | none | purely visual |
| **Battle Pass** | seasonal track of cosmetics + convenience + small $WAR-sink rebates | low | rewards are cosmetic/convenience, achievable F2P via play |
| **Convenience** | extra build/loadout slots, analytics, queue QoL | low | caps; never combat power |
| **Speed-ups** | time-skips on production/build/research | medium | **time, not magnitude**; diminishing, capped per day; F2P reaches same ceiling with patience; speed-ups don't exceed achievable output |
| **Tournament entry** | self-funded prize pools | none | entry fee = prize pool |
| **Marketplace fee** | protocol takes % of trades | none | it's a sink, funds rewards |
| **Land scarcity / primary sale** | initial plot stake demand drives token utility | none | stake returnable, not "buying power" |
| **Premium services** | replays, spectator, market analytics | none | informational/cosmetic |

### 22.3 The Anti-P2W Guarantee

```
Anything purchasable with money is either:
  (a) cosmetic, OR
  (b) a time accelerator bounded by a ceiling that F2P players also reach.
No purchasable item grants combat stats, exclusive units, or yields unreachable by play.
```
Speed-ups are explicitly **capped and diminishing** (e.g., daily speed-up cap; each successive speed-up costs more) so whales can't simply buy infinite production. Combat is gated by **counters + skill + logistics**, which money cannot purchase.

### 22.4 Sustainability

Protocol revenue (marketplace fee share, cosmetics) funds ops; reward pools are funded **only** by sinks (§12.2). The business is healthy when *engagement* is high (more trades, more wars → more fees), aligning the studio with player activity rather than with whale extraction.

---

## 23. MVP Roadmap

> Goal: prove the **stake→claim→build→farm→raid** core loop + a thin economy + sustainable token flow, on testnet then a small live season.

### Phase 0 — Foundations (Months 0–2)
- Token ($WAR) on L2 testnet; StakingManager + PlotRegistry; basic SinkRouter (fee→burn/pool).
- Core services scaffolding (Next.js client, WebGL hex map, auth, WebSocket gateway).
- Postgres schema (plots, players, stakes, resources), Redis, one sim shard.

### Phase 1 — Core Loop (Months 2–4)
- Stake → claim plot → build camp → farm 3–4 raw resources → simple production.
- Movement + basic raid combat (infantry/tank/artillery counter triangle) with bounded RNG (§9).
- Plot decay/unstaking; principal-safe conquest.
- **Closed alpha**, single small region, ~1k players.

### Phase 2 — Economy & Market (Months 4–6)
- Full resource → intermediate → finished supply chains; factories + queues.
- Regional marketplace (order book, fees, listing) — the first real sink engine.
- Specialization bonuses; transport/logistics v1.
- **Open beta**, single region scaled, economy telemetry/ClickHouse dashboards for balancing.

### Phase 3 — Allegiances & Territory (Months 6–9)
- Allegiances: membership, treasury (on-chain vault), one governance model (start: council), basic buildings.
- Region control + territory tax; first scheduled territory war.
- Diplomacy v1 (NAP, trade agreements), reputation system.

### Phase 4 — Season 1 Live (Months 9–12)
- 30-day season loop: reward pools funded by sinks, Merkle reward claims, ladder.
- Anti-bot/anti-Sybil v1 (WAF/BotID, rate limits, wash-trade detection, stake-gated identity).
- Commanders + cosmetics + battle pass (monetization v1).
- Full air/drone/engineer roster, weather, traps, morale.
- **Mainnet launch**, single shard scaled to multiple regions, audited contracts.

**MVP definition of done:** a player can stake, build a specialized economy, trade, raid, join an Allegiance, contest a region, and at season end claim a sink-funded reward — with net token supply flat-to-deflationary and no P2W vectors.

---

## 24. Long-Term Expansion Roadmap

### Year 1 (post-launch)
- Multi-region full world (64 regions), 100k-CCU scale hardening, sector-shard autoscaling.
- All 4 governance models; Allegiance mergers/splits; espionage/betrayal mechanics.
- Global market + cross-region arbitrage + naval/coastal trade routes.
- Tournament circuit; seasonal modifier variety.
- Mobile (React Native) parity.

### Year 2
- **Superweapons & Alliance-factory capital units** (megaprojects, big sinks).
- **App-chain migration** (Arbitrum Orbit / OP Stack) if volume warrants — game-tuned gas.
- Mercenary economy maturation; insurance & derivatives market (player-built financial layer).
- Spectator/esports mode, replay sharing, creator tools.
- Advanced anti-cheat ML; reputation-gated high-trust markets.

### Year 3+
- **Player-governed protocol DAO** controls sink-split parameters, season modifiers, treasury within guardrails.
- **UGC**: custom maps/scenarios, modding API, community seasons.
- **Cross-game asset interop** (commanders/cosmetics as portable identity).
- Persistent "history" layer: world chronicles, dynasties, named wars — emergent lore as retention.
- Land NFT secondary economy (sale-with-stake-transfer), region "real estate" markets.
- Regional/lite app-chains for ultra-scale; ZK proofs for verifiable off-chain economy checkpoints.

---

## 25. Game Theory Appendix

**Why players cooperate.**
No plot type produces all inputs; specialization bonuses (§18.12) make focused producers strictly more efficient. To build an army you need outputs you can't make well → cooperation/trade dominates autarky. Defense is also super-additive: mutual reinforcement beats isolated walls.

**Why players trade.**
Comparative advantage + spatial price gaps. A mountain owner makes cheap Steel; a desert owner makes cheap Fuel; both gain by trading rather than each producing both inefficiently. Transport cost + regional supply create arbitrage that Traders/Logistics monetize, which equilibrates prices — a self-organizing market from individual greed.

**Why players join Allegiances.**
A solo player can't defend a region, can't field a complete supply chain, and can't win territory income. Allegiances pool specialization, capital (treasuries), and defense, and unlock region tax + shared buildings — payoffs unavailable solo. Contribution scoring + reputation make cooperation incentive-compatible (free-riders decay out).

**Why specialists outperform generalists.**
`SpecBonus` (up to +35%) plus the generalist `1/√m` focus penalty (§18.12) mean a generalist loses to a specialist on *every* line. The market lets the generalist's would-be self-sufficiency be replaced by cheaper trade → specialization is the dominant strategy, and trade is its necessary complement.

**Why stronger players earn more.**
Higher power → win more raids/wars → more loot, territory, and season score (top-heavy payout curve, §18.10). Capital and skill compound. This preserves aspiration and competitive drive.

**Why weaker players still have opportunities.**
(1) Combat is counter/terrain/scout-gated: a 70%-power smart defender beats a 100%-power blind attacker (§9.4, ~73% vs ~23%). (2) Loot diminishing returns (§16.5) make whales unable to profitably farm minnows. (3) The economy rewards *productivity*, not power — a top farmer/logistics provider earns from selling to warlords without ever fighting. (4) Diminishing plot returns + super-linear upkeep (§16) cap whale dominance. (5) Reputation/services give non-combat paths to wealth and status. The result: multiple viable ladders (economic, military, political) so players of every strength and playstyle have a path to meaningful rewards.

**The equilibrium.**
The Nash-stable meta is a world of *interdependent specialists* organized into *competing Allegiances*, where war is constant but bounded (loot at risk, principal safe), trade is constant (specialization forces it), and the token is constantly sunk and redistributed (sustainable, deflationary). No single dominant strategy ("buy power and win") exists — capital, skill, cooperation, and information each gate the others.

---

*End of GDD v1.0 — WARLANDS. All numeric constants are tuning seeds intended to be calibrated in a live balancing spreadsheet and economy simulation before launch.*
