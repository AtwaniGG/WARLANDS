CREATE TABLE "allegiance_buildings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"allegiance_id" bigint,
	"region_id" integer,
	"kind" varchar(32),
	"level" integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE "allegiance_memberships" (
	"allegiance_id" bigint,
	"player_id" bigint,
	"role" varchar(16) DEFAULT 'member',
	"archetype" varchar(24),
	"contribution" numeric(20, 4) DEFAULT '0',
	"joined_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "allegiance_memberships_allegiance_id_player_id_pk" PRIMARY KEY("allegiance_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "allegiances" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(48),
	"founder_id" bigint,
	"gov_model" varchar(24),
	"treasury_war" numeric(20, 0) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "allegiances_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "battle_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"battle_id" bigint,
	"round_no" integer,
	"event" jsonb
);
--> statement-breakpoint
CREATE TABLE "battles" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"attacker_id" bigint,
	"defender_id" bigint,
	"plot_id" bigint,
	"intent" varchar(16),
	"seed" char(66),
	"result_json" jsonb,
	"loot_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"plot_id" bigint,
	"kind" varchar(32),
	"level" integer DEFAULT 1,
	"maint_debt" numeric(5, 4) DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "commanders" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"player_id" bigint,
	"name" varchar(40),
	"level" integer DEFAULT 1,
	"skills_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"creator_id" bigint,
	"taker_id" bigint,
	"kind" varchar(24),
	"terms_json" jsonb,
	"collateral" numeric(20, 0),
	"status" varchar(16) DEFAULT 'open',
	"deadline" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "diplomacy" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"alleg_a" bigint,
	"alleg_b" bigint,
	"kind" varchar(24),
	"status" varchar(16),
	"signed_at" timestamp with time zone,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "factories" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"plot_id" bigint,
	"archetype" varchar(24),
	"level" integer DEFAULT 1,
	"queue_slots" integer DEFAULT 1,
	"efficiency" numeric(5, 4) DEFAULT '1'
);
--> statement-breakpoint
CREATE TABLE "governance_proposals" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"allegiance_id" bigint,
	"proposer_id" bigint,
	"kind" varchar(32),
	"payload_json" jsonb,
	"status" varchar(16) DEFAULT 'open',
	"opens_at" timestamp with time zone,
	"closes_at" timestamp with time zone,
	"timelock_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "market_orders" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"player_id" bigint,
	"region_id" integer,
	"side" char(4),
	"item" varchar(32),
	"qty" numeric(20, 4),
	"price" numeric(20, 8),
	"filled" numeric(20, 4) DEFAULT '0',
	"status" varchar(12) DEFAULT 'open',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "market_trades" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"buy_order" bigint,
	"sell_order" bigint,
	"item" varchar(32),
	"qty" numeric(20, 4),
	"price" numeric(20, 8),
	"fee" numeric(20, 8),
	"executed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "movements" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"owner_id" bigint,
	"kind" varchar(16),
	"from_plot" bigint,
	"to_plot" bigint,
	"payload_json" jsonb,
	"depart_at" timestamp with time zone,
	"arrive_at" timestamp with time zone,
	"status" varchar(16) DEFAULT 'enroute'
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"wallet_address" char(42) NOT NULL,
	"username" varchar(32) NOT NULL,
	"account_level" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone,
	"risk_score" numeric(5, 4) DEFAULT '0',
	"kyc_tier" smallint DEFAULT 0,
	CONSTRAINT "players_wallet_address_unique" UNIQUE("wallet_address"),
	CONSTRAINT "players_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "plot_resources" (
	"plot_id" bigint,
	"resource" varchar(24),
	"amount" numeric(20, 4) DEFAULT '0',
	CONSTRAINT "plot_resources_plot_id_resource_pk" PRIMARY KEY("plot_id","resource")
);
--> statement-breakpoint
CREATE TABLE "plot_types" (
	"id" smallint PRIMARY KEY NOT NULL,
	"name" varchar(32),
	"stake_amount" numeric(20, 0) NOT NULL,
	"yield_json" jsonb,
	"defense_mult" numeric(4, 2)
);
--> statement-breakpoint
CREATE TABLE "plots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"season_id" integer,
	"sector_id" bigint,
	"plot_type_id" smallint,
	"q" integer NOT NULL,
	"r" integer NOT NULL,
	"owner_id" bigint,
	"status" varchar(16) DEFAULT 'unclaimed',
	"decay_started" timestamp with time zone,
	"defense_pct" numeric(5, 4) DEFAULT '1',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "production_jobs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"factory_id" bigint,
	"product" varchar(32),
	"quantity" integer,
	"inputs_json" jsonb,
	"starts_at" timestamp with time zone,
	"finishes_at" timestamp with time zone,
	"status" varchar(16) DEFAULT 'queued',
	"priority" smallint DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "region_control" (
	"region_id" integer,
	"allegiance_id" bigint,
	"control_points" numeric(20, 4),
	"tax_rate" numeric(5, 4),
	"since" timestamp with time zone,
	CONSTRAINT "region_control_region_id_allegiance_id_pk" PRIMARY KEY("region_id","allegiance_id")
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" integer PRIMARY KEY NOT NULL,
	"season_id" integer,
	"name" varchar(48),
	"center_q" integer,
	"center_r" integer
);
--> statement-breakpoint
CREATE TABLE "reputation" (
	"player_id" bigint PRIMARY KEY NOT NULL,
	"score" integer DEFAULT 1000 NOT NULL,
	"treaties_kept" integer DEFAULT 0,
	"treaties_broken" integer DEFAULT 0,
	"contracts_ok" integer DEFAULT 0,
	"contracts_failed" integer DEFAULT 0,
	"fair_play" numeric(5, 4) DEFAULT '1',
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reward_claims" (
	"season_id" integer,
	"player_id" bigint,
	"amount" numeric(20, 0),
	"merkle_proof" text,
	"claimed" boolean DEFAULT false,
	"claimed_at" timestamp with time zone,
	CONSTRAINT "reward_claims_season_id_player_id_pk" PRIMARY KEY("season_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "season_scores" (
	"season_id" integer,
	"player_id" bigint,
	"econ" numeric(20, 4) DEFAULT '0',
	"military" numeric(20, 4) DEFAULT '0',
	"territory" numeric(20, 4) DEFAULT '0',
	"alleg" numeric(20, 4) DEFAULT '0',
	CONSTRAINT "season_scores_season_id_player_id_pk" PRIMARY KEY("season_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" integer PRIMARY KEY NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"modifier" varchar(40),
	"status" varchar(16) DEFAULT 'pre'
);
--> statement-breakpoint
CREATE TABLE "sectors" (
	"id" bigint PRIMARY KEY NOT NULL,
	"region_id" integer,
	"shard_node" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "stakes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"player_id" bigint,
	"plot_id" bigint,
	"amount" numeric(20, 0) NOT NULL,
	"tx_hash" char(66),
	"status" varchar(16) DEFAULT 'locked',
	"unbond_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "token_sink_ledger" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"season_id" integer,
	"player_id" bigint,
	"sink_type" smallint,
	"amount" numeric(20, 0),
	"burned" numeric(20, 0),
	"to_pool" numeric(20, 0),
	"to_tax" numeric(20, 0),
	"tx_hash" char(66),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "treasury_tx" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"allegiance_id" bigint,
	"player_id" bigint,
	"kind" varchar(16),
	"asset" varchar(24),
	"amount" numeric(20, 4),
	"tx_hash" char(66),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "troops" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"plot_id" bigint,
	"owner_id" bigint,
	"unit_type" varchar(24),
	"count" integer DEFAULT 0,
	"morale" numeric(5, 4) DEFAULT '1'
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"proposal_id" bigint,
	"player_id" bigint,
	"weight" numeric(20, 4),
	"choice" smallint,
	CONSTRAINT "votes_proposal_id_player_id_pk" PRIMARY KEY("proposal_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "wallet_links" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"player_id" bigint,
	"device_hash" varchar(128),
	"cluster_id" bigint,
	"confidence" numeric(5, 4),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "allegiance_buildings" ADD CONSTRAINT "allegiance_buildings_allegiance_id_allegiances_id_fk" FOREIGN KEY ("allegiance_id") REFERENCES "public"."allegiances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allegiance_buildings" ADD CONSTRAINT "allegiance_buildings_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allegiance_memberships" ADD CONSTRAINT "allegiance_memberships_allegiance_id_allegiances_id_fk" FOREIGN KEY ("allegiance_id") REFERENCES "public"."allegiances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allegiance_memberships" ADD CONSTRAINT "allegiance_memberships_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allegiances" ADD CONSTRAINT "allegiances_founder_id_players_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_events" ADD CONSTRAINT "battle_events_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_attacker_id_players_id_fk" FOREIGN KEY ("attacker_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_defender_id_players_id_fk" FOREIGN KEY ("defender_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commanders" ADD CONSTRAINT "commanders_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_creator_id_players_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_taker_id_players_id_fk" FOREIGN KEY ("taker_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diplomacy" ADD CONSTRAINT "diplomacy_alleg_a_allegiances_id_fk" FOREIGN KEY ("alleg_a") REFERENCES "public"."allegiances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diplomacy" ADD CONSTRAINT "diplomacy_alleg_b_allegiances_id_fk" FOREIGN KEY ("alleg_b") REFERENCES "public"."allegiances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factories" ADD CONSTRAINT "factories_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_proposals" ADD CONSTRAINT "governance_proposals_allegiance_id_allegiances_id_fk" FOREIGN KEY ("allegiance_id") REFERENCES "public"."allegiances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_orders" ADD CONSTRAINT "market_orders_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_orders" ADD CONSTRAINT "market_orders_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_trades" ADD CONSTRAINT "market_trades_buy_order_market_orders_id_fk" FOREIGN KEY ("buy_order") REFERENCES "public"."market_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_trades" ADD CONSTRAINT "market_trades_sell_order_market_orders_id_fk" FOREIGN KEY ("sell_order") REFERENCES "public"."market_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_owner_id_players_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plot_resources" ADD CONSTRAINT "plot_resources_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plots" ADD CONSTRAINT "plots_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plots" ADD CONSTRAINT "plots_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plots" ADD CONSTRAINT "plots_plot_type_id_plot_types_id_fk" FOREIGN KEY ("plot_type_id") REFERENCES "public"."plot_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plots" ADD CONSTRAINT "plots_owner_id_players_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_jobs" ADD CONSTRAINT "production_jobs_factory_id_factories_id_fk" FOREIGN KEY ("factory_id") REFERENCES "public"."factories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_control" ADD CONSTRAINT "region_control_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_control" ADD CONSTRAINT "region_control_allegiance_id_allegiances_id_fk" FOREIGN KEY ("allegiance_id") REFERENCES "public"."allegiances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regions" ADD CONSTRAINT "regions_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation" ADD CONSTRAINT "reputation_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_claims" ADD CONSTRAINT "reward_claims_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_claims" ADD CONSTRAINT "reward_claims_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_scores" ADD CONSTRAINT "season_scores_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_scores" ADD CONSTRAINT "season_scores_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakes" ADD CONSTRAINT "stakes_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakes" ADD CONSTRAINT "stakes_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_sink_ledger" ADD CONSTRAINT "token_sink_ledger_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury_tx" ADD CONSTRAINT "treasury_tx_allegiance_id_allegiances_id_fk" FOREIGN KEY ("allegiance_id") REFERENCES "public"."allegiances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "troops" ADD CONSTRAINT "troops_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "troops" ADD CONSTRAINT "troops_owner_id_players_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_proposal_id_governance_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."governance_proposals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_links" ADD CONSTRAINT "wallet_links_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_memb_player" ON "allegiance_memberships" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_bevents_battle" ON "battle_events" USING btree ("battle_id","round_no");--> statement-breakpoint
CREATE INDEX "idx_battles_plot" ON "battles" USING btree ("plot_id");--> statement-breakpoint
CREATE INDEX "idx_battles_players" ON "battles" USING btree ("attacker_id","defender_id");--> statement-breakpoint
CREATE INDEX "idx_buildings_plot" ON "buildings" USING btree ("plot_id");--> statement-breakpoint
CREATE INDEX "idx_commanders_player" ON "commanders" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_orders_book" ON "market_orders" USING btree ("region_id","item","side","price");--> statement-breakpoint
CREATE INDEX "idx_orders_player" ON "market_orders" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_trades_item_time" ON "market_trades" USING btree ("item","executed_at");--> statement-breakpoint
CREATE INDEX "idx_moves_arrive" ON "movements" USING btree ("arrive_at");--> statement-breakpoint
CREATE INDEX "idx_players_active" ON "players" USING btree ("last_active_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_plots_coords" ON "plots" USING btree ("season_id","q","r");--> statement-breakpoint
CREATE INDEX "idx_plots_owner" ON "plots" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_plots_sector" ON "plots" USING btree ("sector_id");--> statement-breakpoint
CREATE INDEX "idx_plots_status" ON "plots" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_jobs_factory" ON "production_jobs" USING btree ("factory_id");--> statement-breakpoint
CREATE INDEX "idx_scores_total" ON "season_scores" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "idx_sectors_region" ON "sectors" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "idx_stakes_player" ON "stakes" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_sink_season" ON "token_sink_ledger" USING btree ("season_id","sink_type");--> statement-breakpoint
CREATE INDEX "idx_troops_owner" ON "troops" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_wallet_cluster" ON "wallet_links" USING btree ("cluster_id");