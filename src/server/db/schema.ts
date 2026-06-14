// WARLANDS database schema (Drizzle ORM / PostgreSQL) — implements GDD §21.
// Server-authoritative persistent world. Generate migrations with `npm run db:generate`.

import {
  pgTable, bigserial, integer, smallint, bigint, varchar, char,
  text, boolean, timestamp, numeric, jsonb, primaryKey, uniqueIndex, index,
} from "drizzle-orm/pg-core";

// ---------------- Players & identity ----------------
export const players = pgTable("players", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  walletAddress: char("wallet_address", { length: 42 }).notNull().unique(),
  username: varchar("username", { length: 32 }).notNull().unique(),
  accountLevel: integer("account_level").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  riskScore: numeric("risk_score", { precision: 5, scale: 4 }).default("0"),
  kycTier: smallint("kyc_tier").default(0),
}, (t) => [index("idx_players_active").on(t.lastActiveAt)]);

export const reputation = pgTable("reputation", {
  playerId: bigint("player_id", { mode: "number" }).primaryKey().references(() => players.id),
  score: integer("score").notNull().default(1000),
  treatiesKept: integer("treaties_kept").default(0),
  treatiesBroken: integer("treaties_broken").default(0),
  contractsOk: integer("contracts_ok").default(0),
  contractsFailed: integer("contracts_failed").default(0),
  fairPlay: numeric("fair_play", { precision: 5, scale: 4 }).default("1"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const walletLinks = pgTable("wallet_links", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  playerId: bigint("player_id", { mode: "number" }).references(() => players.id),
  deviceHash: varchar("device_hash", { length: 128 }),
  clusterId: bigint("cluster_id", { mode: "number" }),
  confidence: numeric("confidence", { precision: 5, scale: 4 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [index("idx_wallet_cluster").on(t.clusterId)]);

// ---------------- World / land ----------------
export const seasons = pgTable("seasons", {
  id: integer("id").primaryKey(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  modifier: varchar("modifier", { length: 40 }),
  status: varchar("status", { length: 16 }).default("pre"), // pre|active|climax|resolved
});

export const regions = pgTable("regions", {
  id: integer("id").primaryKey(),
  seasonId: integer("season_id").references(() => seasons.id),
  name: varchar("name", { length: 48 }),
  centerQ: integer("center_q"),
  centerR: integer("center_r"),
});

export const sectors = pgTable("sectors", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  regionId: integer("region_id").references(() => regions.id),
  shardNode: varchar("shard_node", { length: 64 }),
}, (t) => [index("idx_sectors_region").on(t.regionId)]);

export const plotTypes = pgTable("plot_types", {
  id: smallint("id").primaryKey(),
  name: varchar("name", { length: 32 }),
  stakeAmount: numeric("stake_amount", { precision: 20, scale: 0 }).notNull(),
  yieldJson: jsonb("yield_json"),
  defenseMult: numeric("defense_mult", { precision: 4, scale: 2 }),
});

export const plots = pgTable("plots", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  seasonId: integer("season_id").references(() => seasons.id),
  sectorId: bigint("sector_id", { mode: "number" }).references(() => sectors.id),
  plotTypeId: smallint("plot_type_id").references(() => plotTypes.id),
  q: integer("q").notNull(),
  r: integer("r").notNull(),
  ownerId: bigint("owner_id", { mode: "number" }).references(() => players.id),
  status: varchar("status", { length: 16 }).default("unclaimed"), // active|decaying|vulnerable|unclaimed
  decayStarted: timestamp("decay_started", { withTimezone: true }),
  defensePct: numeric("defense_pct", { precision: 5, scale: 4 }).default("1"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  uniqueIndex("uq_plots_coords").on(t.seasonId, t.q, t.r),
  index("idx_plots_owner").on(t.ownerId),
  index("idx_plots_sector").on(t.sectorId),
  index("idx_plots_status").on(t.status),
]);

export const stakes = pgTable("stakes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  playerId: bigint("player_id", { mode: "number" }).references(() => players.id),
  plotId: bigint("plot_id", { mode: "number" }).references(() => plots.id),
  amount: numeric("amount", { precision: 20, scale: 0 }).notNull(),
  txHash: char("tx_hash", { length: 66 }),
  status: varchar("status", { length: 16 }).default("locked"), // locked|unbonding|withdrawn
  unbondAt: timestamp("unbond_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [index("idx_stakes_player").on(t.playerId)]);

// ---------------- Economy on plots ----------------
export const buildings = pgTable("buildings", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  plotId: bigint("plot_id", { mode: "number" }).references(() => plots.id),
  kind: varchar("kind", { length: 32 }),
  level: integer("level").default(1),
  maintDebt: numeric("maint_debt", { precision: 5, scale: 4 }).default("0"),
}, (t) => [index("idx_buildings_plot").on(t.plotId)]);

export const factories = pgTable("factories", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  plotId: bigint("plot_id", { mode: "number" }).references(() => plots.id),
  archetype: varchar("archetype", { length: 24 }),
  level: integer("level").default(1),
  queueSlots: integer("queue_slots").default(1),
  efficiency: numeric("efficiency", { precision: 5, scale: 4 }).default("1"),
});

export const productionJobs = pgTable("production_jobs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  factoryId: bigint("factory_id", { mode: "number" }).references(() => factories.id),
  product: varchar("product", { length: 32 }),
  quantity: integer("quantity"),
  inputsJson: jsonb("inputs_json"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  finishesAt: timestamp("finishes_at", { withTimezone: true }),
  status: varchar("status", { length: 16 }).default("queued"),
  priority: smallint("priority").default(0),
}, (t) => [index("idx_jobs_factory").on(t.factoryId)]);

export const plotResources = pgTable("plot_resources", {
  plotId: bigint("plot_id", { mode: "number" }).references(() => plots.id),
  resource: varchar("resource", { length: 24 }),
  amount: numeric("amount", { precision: 20, scale: 4 }).default("0"),
}, (t) => [primaryKey({ columns: [t.plotId, t.resource] })]);

export const troops = pgTable("troops", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  plotId: bigint("plot_id", { mode: "number" }).references(() => plots.id),
  ownerId: bigint("owner_id", { mode: "number" }).references(() => players.id),
  unitType: varchar("unit_type", { length: 24 }),
  count: integer("count").default(0),
  morale: numeric("morale", { precision: 5, scale: 4 }).default("1"),
}, (t) => [index("idx_troops_owner").on(t.ownerId)]);

// ---------------- Market ----------------
export const marketOrders = pgTable("market_orders", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  playerId: bigint("player_id", { mode: "number" }).references(() => players.id),
  regionId: integer("region_id").references(() => regions.id),
  side: char("side", { length: 4 }),
  item: varchar("item", { length: 32 }),
  qty: numeric("qty", { precision: 20, scale: 4 }),
  price: numeric("price", { precision: 20, scale: 8 }),
  filled: numeric("filled", { precision: 20, scale: 4 }).default("0"),
  status: varchar("status", { length: 12 }).default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("idx_orders_book").on(t.regionId, t.item, t.side, t.price),
  index("idx_orders_player").on(t.playerId),
]);

export const marketTrades = pgTable("market_trades", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  buyOrder: bigint("buy_order", { mode: "number" }).references(() => marketOrders.id),
  sellOrder: bigint("sell_order", { mode: "number" }).references(() => marketOrders.id),
  item: varchar("item", { length: 32 }),
  qty: numeric("qty", { precision: 20, scale: 4 }),
  price: numeric("price", { precision: 20, scale: 8 }),
  fee: numeric("fee", { precision: 20, scale: 8 }),
  executedAt: timestamp("executed_at", { withTimezone: true }).defaultNow(),
}, (t) => [index("idx_trades_item_time").on(t.item, t.executedAt)]);

export const contracts = pgTable("contracts", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  creatorId: bigint("creator_id", { mode: "number" }).references(() => players.id),
  takerId: bigint("taker_id", { mode: "number" }).references(() => players.id),
  kind: varchar("kind", { length: 24 }), // courier|production|mercenary|escort
  termsJson: jsonb("terms_json"),
  collateral: numeric("collateral", { precision: 20, scale: 0 }),
  status: varchar("status", { length: 16 }).default("open"),
  deadline: timestamp("deadline", { withTimezone: true }),
});

// ---------------- Combat ----------------
export const movements = pgTable("movements", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  ownerId: bigint("owner_id", { mode: "number" }).references(() => players.id),
  kind: varchar("kind", { length: 16 }), // march|caravan|scout
  fromPlot: bigint("from_plot", { mode: "number" }),
  toPlot: bigint("to_plot", { mode: "number" }),
  payloadJson: jsonb("payload_json"),
  departAt: timestamp("depart_at", { withTimezone: true }),
  arriveAt: timestamp("arrive_at", { withTimezone: true }),
  status: varchar("status", { length: 16 }).default("enroute"),
}, (t) => [index("idx_moves_arrive").on(t.arriveAt)]);

export const battles = pgTable("battles", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  attackerId: bigint("attacker_id", { mode: "number" }).references(() => players.id),
  defenderId: bigint("defender_id", { mode: "number" }).references(() => players.id),
  plotId: bigint("plot_id", { mode: "number" }).references(() => plots.id),
  intent: varchar("intent", { length: 16 }), // raid|siege|sabotage
  seed: char("seed", { length: 66 }),
  resultJson: jsonb("result_json"),
  lootJson: jsonb("loot_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("idx_battles_plot").on(t.plotId),
  index("idx_battles_players").on(t.attackerId, t.defenderId),
]);

export const battleEvents = pgTable("battle_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  battleId: bigint("battle_id", { mode: "number" }).references(() => battles.id),
  roundNo: integer("round_no"),
  event: jsonb("event"),
}, (t) => [index("idx_bevents_battle").on(t.battleId, t.roundNo)]);

// ---------------- Allegiances ----------------
export const allegiances = pgTable("allegiances", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 48 }).unique(),
  founderId: bigint("founder_id", { mode: "number" }).references(() => players.id),
  govModel: varchar("gov_model", { length: 24 }),
  treasuryWar: numeric("treasury_war", { precision: 20, scale: 0 }).default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const allegianceMemberships = pgTable("allegiance_memberships", {
  allegianceId: bigint("allegiance_id", { mode: "number" }).references(() => allegiances.id),
  playerId: bigint("player_id", { mode: "number" }).references(() => players.id),
  role: varchar("role", { length: 16 }).default("member"),
  archetype: varchar("archetype", { length: 24 }),
  contribution: numeric("contribution", { precision: 20, scale: 4 }).default("0"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.allegianceId, t.playerId] }),
  index("idx_memb_player").on(t.playerId),
]);

export const allegianceBuildings = pgTable("allegiance_buildings", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  allegianceId: bigint("allegiance_id", { mode: "number" }).references(() => allegiances.id),
  regionId: integer("region_id").references(() => regions.id),
  kind: varchar("kind", { length: 32 }),
  level: integer("level").default(1),
});

export const treasuryTx = pgTable("treasury_tx", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  allegianceId: bigint("allegiance_id", { mode: "number" }).references(() => allegiances.id),
  playerId: bigint("player_id", { mode: "number" }),
  kind: varchar("kind", { length: 16 }), // deposit|withdraw
  asset: varchar("asset", { length: 24 }),
  amount: numeric("amount", { precision: 20, scale: 4 }),
  txHash: char("tx_hash", { length: 66 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const governanceProposals = pgTable("governance_proposals", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  allegianceId: bigint("allegiance_id", { mode: "number" }).references(() => allegiances.id),
  proposerId: bigint("proposer_id", { mode: "number" }),
  kind: varchar("kind", { length: 32 }),
  payloadJson: jsonb("payload_json"),
  status: varchar("status", { length: 16 }).default("open"),
  opensAt: timestamp("opens_at", { withTimezone: true }),
  closesAt: timestamp("closes_at", { withTimezone: true }),
  timelockUntil: timestamp("timelock_until", { withTimezone: true }),
});

export const votes = pgTable("votes", {
  proposalId: bigint("proposal_id", { mode: "number" }).references(() => governanceProposals.id),
  playerId: bigint("player_id", { mode: "number" }).references(() => players.id),
  weight: numeric("weight", { precision: 20, scale: 4 }),
  choice: smallint("choice"), // 1 yes / 0 no / -1 abstain
}, (t) => [primaryKey({ columns: [t.proposalId, t.playerId] })]);

export const regionControl = pgTable("region_control", {
  regionId: integer("region_id").references(() => regions.id),
  allegianceId: bigint("allegiance_id", { mode: "number" }).references(() => allegiances.id),
  controlPoints: numeric("control_points", { precision: 20, scale: 4 }),
  taxRate: numeric("tax_rate", { precision: 5, scale: 4 }),
  since: timestamp("since", { withTimezone: true }),
}, (t) => [primaryKey({ columns: [t.regionId, t.allegianceId] })]);

export const diplomacy = pgTable("diplomacy", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  allegA: bigint("alleg_a", { mode: "number" }).references(() => allegiances.id),
  allegB: bigint("alleg_b", { mode: "number" }).references(() => allegiances.id),
  kind: varchar("kind", { length: 24 }), // nap|peace|trade|war|merger
  status: varchar("status", { length: 16 }),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

// ---------------- Tokenomics ledger ----------------
export const tokenSinkLedger = pgTable("token_sink_ledger", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  seasonId: integer("season_id").references(() => seasons.id),
  playerId: bigint("player_id", { mode: "number" }),
  sinkType: smallint("sink_type"), // maps to §13 sink #
  amount: numeric("amount", { precision: 20, scale: 0 }),
  burned: numeric("burned", { precision: 20, scale: 0 }),
  toPool: numeric("to_pool", { precision: 20, scale: 0 }),
  toTax: numeric("to_tax", { precision: 20, scale: 0 }),
  txHash: char("tx_hash", { length: 66 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [index("idx_sink_season").on(t.seasonId, t.sinkType)]);

export const seasonScores = pgTable("season_scores", {
  seasonId: integer("season_id").references(() => seasons.id),
  playerId: bigint("player_id", { mode: "number" }).references(() => players.id),
  econ: numeric("econ", { precision: 20, scale: 4 }).default("0"),
  military: numeric("military", { precision: 20, scale: 4 }).default("0"),
  territory: numeric("territory", { precision: 20, scale: 4 }).default("0"),
  alleg: numeric("alleg", { precision: 20, scale: 4 }).default("0"),
}, (t) => [
  primaryKey({ columns: [t.seasonId, t.playerId] }),
  index("idx_scores_total").on(t.seasonId),
]);

export const rewardClaims = pgTable("reward_claims", {
  seasonId: integer("season_id").references(() => seasons.id),
  playerId: bigint("player_id", { mode: "number" }).references(() => players.id),
  amount: numeric("amount", { precision: 20, scale: 0 }),
  merkleProof: text("merkle_proof"),
  claimed: boolean("claimed").default(false),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
}, (t) => [primaryKey({ columns: [t.seasonId, t.playerId] })]);

export const commanders = pgTable("commanders", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  playerId: bigint("player_id", { mode: "number" }).references(() => players.id),
  name: varchar("name", { length: 40 }),
  level: integer("level").default(1),
  skillsJson: jsonb("skills_json"),
}, (t) => [index("idx_commanders_player").on(t.playerId)]);
