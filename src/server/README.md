# WARLANDS — Backend Foundation (GDD §19, §21)

The server-authoritative persistence layer. Implemented with **Drizzle ORM** on
**Neon Postgres** (Vercel Marketplace), the recommended Vercel data stack.

The app runs fully in **client-side mock mode** with no database. Set `DATABASE_URL`
to enable persistence; everything degrades gracefully (`getDb()` returns `null`,
API routes return `503` with a clear message).

## Layout
- `db/schema.ts` — the full GDD §21 schema: 26 tables (players, plots, stakes, buildings,
  factories, production jobs, resources, troops, market orders/trades, contracts, movements,
  battles + events, allegiances + memberships/buildings/treasury/governance/votes,
  region control, diplomacy, token sink ledger, season scores, reward claims, commanders,
  seasons/regions/sectors/plot types) — with indexes and foreign keys.
- `db/index.ts` — lazy, SSR-safe Drizzle client (`getDb()`).
- API routes: `src/app/api/health`, `/api/players`, `/api/market`.

## Commands
```bash
# 1. Provision a Neon Postgres DB (Vercel Marketplace) and set DATABASE_URL in .env.local
cp .env.example .env.local        # then fill DATABASE_URL

# 2. Generate / apply migrations
npm run db:generate   # offline: builds SQL from schema (already run -> drizzle/0000_*.sql)
npm run db:push       # apply schema to the database (dev)
npm run db:migrate    # apply committed migrations (prod)
npm run db:studio     # browse data
```

## Where this is going (GDD §19)
This is the data layer for the server-authoritative simulation: sector-sharded tick
processing, WebSocket delta sync, CQRS read models in Redis/ClickHouse, and an indexer
reconciling on-chain staking/treasury events into `stakes` / `treasury_tx`. The current
single-player client store (`src/game/store.ts`) is the reference implementation of the
rules these services will run authoritatively.
