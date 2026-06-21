"use client";
import { useEffect, useRef, useState } from "react";

const NAV: { id: string; n: string; label: string }[] = [
  { id: "abstract", n: "00", label: "Abstract" },
  { id: "world", n: "01", label: "The World" },
  { id: "economy", n: "02", label: "Resource Economy" },
  { id: "military", n: "03", label: "Military & Combat" },
  { id: "market", n: "04", label: "Marketplace" },
  { id: "allegiances", n: "05", label: "Allegiances & Governance" },
  { id: "seasons", n: "06", label: "Seasons & Rewards" },
  { id: "token", n: "07", label: "Tokenomics · $HEXAR" },
  { id: "architecture", n: "08", label: "Architecture" },
  { id: "onchain", n: "09", label: "On-Chain Layer" },
  { id: "integrity", n: "10", label: "Engineering Integrity" },
  { id: "status", n: "11", label: "Build Status & Roadmap" },
  { id: "deploy", n: "12", label: "Deployment & Access" },
];

const PLOTS = [
  ["Basic / Plains", "10,000", "Balanced starter land, +5% build speed"],
  ["Forest", "12,500", "+15% wood, defender ambush bonus"],
  ["River", "15,000", "+20% food, +15% water, −10% market fees"],
  ["Mountain", "20,000", "+25% iron, +20% stone, +30% defense"],
  ["Oil Desert", "25,000", "+30% oil; exposed, weak natural defense"],
  ["Coastal Trade", "30,000", "−20% transport, sea routes, trade hub"],
  ["Industrial", "40,000", "+25% factory efficiency, +1 factory slot"],
  ["Technology Ruins", "50,000", "+30% research, data chips, rare blueprints"],
  ["Warzone", "60,000", "+40% all yields, season-pts ×2.5 — no protection"],
];

const UNITS = [
  ["🪖", "Infantry", "Cheap, durable garrison", "Strong vs Engineers · weak vs Tanks/Artillery"],
  ["🛡️", "Tanks", "Armored spearhead", "Strong vs Infantry/Turrets · weak vs Air/Drones/Arty"],
  ["💥", "Artillery", "Siege & area damage", "Strong vs Tanks/structures · weak vs Air/Drones"],
  ["✈️", "Aircraft", "Fast strike", "Strong vs ground · weak vs Drones & AA"],
  ["🛸", "Drones", "Interceptor / recon", "Strong vs Aircraft/Infantry · weak vs EMP/AA"],
  ["🔧", "Engineers", "Sabotage, repair, traps", "Strong vs structures · fragile in the open"],
];

const CONTRACTS = [
  ["$HEXAR token (Solana)", "BHdvBpziU37TjyNCxjrFy4FFQ1DP2TButgrZyP9Qi8pT", "Live Token-2022 SPL · fixed 1B supply. Holder gate: hold ≥1,000 to deploy."],
  ["Treasury / payouts", "DQ4NGW79Vs8DNqyJniMbx8E1v3ZEvarsHB7m1N6pNNUJ", "Settles sink-funded season rewards. Pays only pool-earned $HEXAR, capped per commander."],
  ["StakingManager (EVM, planned)", "0xF0814Ec2822160B6c4d3156F5b8ba95648b422bF", "Principal-safe land staking + conquest settlement."],
  ["SinkRouter (EVM, planned)", "0x76A246e04Ab8aFAac33B09417acdd4a0F37830fc", "Splits collected sinks: burn / reward pool / region tax."],
];

const SLICES = [
  ["01", "Pipeline", "Pure sim core, Node+ws server, /world route, Postgres snapshots, stake + build."],
  ["02", "Economy", "Factories (raw→intermediate→finished), upgrades, unstake with burn sink."],
  ["03", "Military", "Unit training + seeded deterministic PvP raids/sieges, loot, defense damage."],
  ["04", "Marketplace", "Shared P2P order book — list/buy/cancel, buyer→seller $HEXAR, fee sinks."],
  ["05", "Allegiances", "Shared treasury, contributions, treasury-funded buildings that buff members."],
  ["06", "Governance", "Propose → vote → auto-resolve building proposals, settled in the tick."],
];

export default function Whitepaper() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("abstract");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.classList.add("wp--ready");

    const reveals = root.querySelectorAll<HTMLElement>(".wp-reveal");
    const ro = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    reveals.forEach((el) => ro.observe(el));

    const sections = root.querySelectorAll<HTMLElement>("section[id]");
    const so = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((el) => so.observe(el));

    return () => { ro.disconnect(); so.disconnect(); };
  }, []);

  return (
    <div className="wp" ref={rootRef}>
      {/* fonts (runtime-loaded; no build dependency) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,400&family=JetBrains+Mono:wght@400;500;700&display=swap"
      />
      <style>{CSS}</style>

      {/* atmosphere */}
      <svg className="wp-hexbg" aria-hidden="true">
        <defs>
          <pattern id="hexp" width="56" height="48" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
            <path d="M14 0 L42 0 L56 24 L42 48 L14 48 L0 24 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexp)" />
      </svg>
      <div className="wp-grain" aria-hidden="true" />
      <div className="wp-scan" aria-hidden="true" />

      <div className="wp-shell">
        {/* ---- DOSSIER INDEX ---- */}
        <aside className="wp-side">
          <div className="wp-brandmark">
            <span className="wp-chev">▚</span> WARLANDS
          </div>
          <div className="wp-classif">STRATEGIC BRIEFING · v1.0 · UNCLASSIFIED // DEMO</div>
          <nav className="wp-nav">
            {NAV.map((s) => (
              <a key={s.id} href={`#${s.id}`} className={active === s.id ? "on" : ""}>
                <span className="wp-nav-n">{s.n}</span>
                <span>{s.label}</span>
              </a>
            ))}
          </nav>
          <div className="wp-side-foot">
            <a href="/world">▶ Enter live world</a>
            <a href="/play">▶ Single-player</a>
          </div>
        </aside>

        {/* ---- MAIN ---- */}
        <main className="wp-main">
          {/* HERO */}
          <header className="wp-hero">
            <div className="wp-stamp">CLASSIFIED<br/>FIELD MANUAL</div>
            <div className="wp-tag wp-fade" style={{ animationDelay: "40ms" }}>
              PERSISTENT-WORLD · PVP-FIRST · WEB3 STRATEGY MMO
            </div>
            <h1 className="wp-title wp-fade" style={{ animationDelay: "120ms" }}>WAR<span>LANDS</span></h1>
            <p className="wp-lede wp-fade" style={{ animationDelay: "220ms" }}>
              A single live map where commanders stake a fixed-supply token to secure finite land,
              build interlocking war economies, and fight — solo or in allegiances — for a
              reward pool that can only ever pay out what the economy first burned.
            </p>
            <div className="wp-statstrip wp-fade" style={{ animationDelay: "320ms" }}>
              {[
                ["1,000,000,000", "fixed $HEXAR supply"],
                ["~250,000", "plots / season"],
                ["9", "plot types"],
                ["20", "resources"],
                ["6", "unit classes"],
                ["30d", "seasons"],
              ].map(([n, l]) => (
                <div key={l} className="wp-stat">
                  <div className="wp-stat-n">{n}</div>
                  <div className="wp-stat-l">{l}</div>
                </div>
              ))}
            </div>
            <div className="wp-status-line wp-fade" style={{ animationDelay: "420ms" }}>
              <span className="wp-dot" /> LIVE · client on Vercel · authoritative server on Railway · contracts on Base Sepolia
            </div>
          </header>

          {/* 00 ABSTRACT */}
          <Section id="abstract" n="00" title="Abstract">
            <p>
              Most token-incentivised games die because they mint rewards faster than they burn them; the token
              inflates to zero. <strong>WARLANDS inverts the model.</strong> Every unit of $HEXAR paid out as a seasonal
              reward is first collected from a real sink — staking fees, market fees, upkeep, construction, training —
              <em> in that same season</em>. The protocol can never distribute more than it took in:
            </p>
            <div className="wp-eq">Σ Rewards(season) &nbsp;≤&nbsp; Σ Sinks(season) − Σ Burns(season)</div>
            <p>
              Players earn by being economically and militarily productive <em>relative to other players</em>, never by
              extracting freshly printed supply. The result is a closed, conserved economy: a fixed 1,000,000,000 $HEXAR
              supply that only ever moves between players, locked stake, allegiance treasuries, and the burn furnace —
              an invariant we enforce in code and verify with over a million randomized simulation steps (§10).
            </p>
          </Section>

          {/* 01 WORLD */}
          <Section id="world" n="01" title="The World">
            <p>
              One logical world per season: a large axial hex grid with a deliberate <strong>center→edge risk gradient</strong>.
              The outer ring is the <em>newbie belt</em> (gentle starter land); the mid-ring is the <em>heartland</em>
              (the full economic mix); the core is the <em>Crucible</em> — high-value, contested, perpetually at war.
              Land is finite (≈250,000 plots at 100k-CCU scale), which makes scarcity the core economic primitive:
              not everyone gets a Warzone plot.
            </p>
            <p>
              You secure a plot by <strong>staking $HEXAR</strong> against it (locked, never spent). Higher-tier terrain
              demands more stake and yields more — and is harder to defend. Unstaking returns your principal minus a
              small early-exit fee (a sink); losing a plot to conquest is <em>principal-safe</em> — you lose built
              assets and stored goods, not your locked stake.
            </p>
            <DataTable head={["Plot type", "Stake ($HEXAR)", "Trait"]} rows={PLOTS} mono={[1]} />
          </Section>

          {/* 02 ECONOMY */}
          <Section id="economy" n="02" title="Resource Economy">
            <p>
              Twenty resources across three tiers form a genuine supply chain. <strong>Extractors</strong> gather eight
              raw resources from terrain that supports them; <strong>factories</strong> refine and manufacture the rest.
              Production follows <code>Base × Terrain × Level × Workforce × (1 − congestion) × DiminishingReturns(plot)</code> —
              super-linear upkeep and diminishing returns are deliberate anti-whale pressure.
            </p>
            <div className="wp-tier">
              <TierCol label="Tier 0 · Raw" items={["Food", "Water", "Wood", "Stone", "Iron", "Rare Minerals", "Oil", "Data Chips"]} />
              <TierCol label="Tier 1 · Intermediate" items={["Fuel", "Steel", "Electronics", "Machine Parts", "Chemicals", "Ammunition"]} />
              <TierCol label="Tier 2 · Finished" items={["Rifles", "Tanks", "Drones", "Aircraft", "Turrets", "Building Components"]} />
            </div>
            <p>
              <strong>Food and Water are universal upkeep</strong> — armies and workforces consume them every tick,
              creating permanent demand for farmers. Storage is capped (warehouses raise the ceiling), and starvation
              softly degrades a plot’s defenses, so a war machine without a food economy rots from within.
            </p>
          </Section>

          {/* 03 MILITARY */}
          <Section id="military" n="03" title="Military & Combat">
            <p>
              Six unit classes locked in a <strong>counter triangle</strong>. There is no single dominant army — every
              composition has a hard counter, so scouting and combined-arms beat brute force.
            </p>
            <div className="wp-units">
              {UNITS.map(([ic, name, role, cnt]) => (
                <div key={name} className="wp-unit">
                  <div className="wp-unit-h"><span className="wp-unit-ic">{ic}</span>{name}</div>
                  <div className="wp-unit-role">{role}</div>
                  <div className="wp-unit-cnt">{cnt}</div>
                </div>
              ))}
            </div>
            <p>
              Battles are resolved by a <strong>seeded, deterministic engine</strong>: the same inputs always produce the
              same auditable round-by-round log. RNG is bounded (a controlled damage roll), and decisive territory
              battles run more rounds so variance averages out and skill dominates at the top. Raids loot stored goods
              (a vault protects a share); sieges can break defenses. Conquest is principal-safe — the loser keeps their
              locked stake.
            </p>
          </Section>

          {/* 04 MARKET */}
          <Section id="market" n="04" title="Marketplace">
            <p>
              A single shared, player-driven order book. Sellers <strong>list</strong> goods (escrowed into the order for
              a flat listing fee); buyers <strong>sweep the cheapest asks</strong>, and $HEXAR flows directly from buyer to
              seller. A transaction fee skims every trade into the sink router — split between the burn furnace, the
              season reward pool, and allegiance/region tax. The market is the economy’s primary sink engine and its
              price-discovery layer: scarcity and war shocks ripple straight into prices.
            </p>
          </Section>

          {/* 05 ALLEGIANCES */}
          <Section id="allegiances" n="05" title="Allegiances & Governance">
            <p>
              Players band into <strong>allegiances</strong> with a shared treasury. Members contribute $HEXAR (raising
              their contribution score) to fund <strong>allegiance buildings</strong> that buff every member’s plots —
              a Research Center grants +12% production, a Fortress +15% defense, a Trade Hub −25% market fees.
            </p>
            <p>
              Construction runs through on-chain-style <strong>governance</strong>: any member proposes a building, members
              vote for or against, and a proposal whose window closes with a majority is auto-resolved and built from the
              treasury — settled deterministically inside the world tick. Founders retain a direct-build fast path.
              Disband returns the remaining treasury to the last member out; nothing is destroyed silently.
            </p>
          </Section>

          {/* 06 SEASONS */}
          <Section id="seasons" n="06" title="Seasons & Rewards">
            <p>
              The world runs in <strong>30-day seasons</strong>. Throughout a season, sinks fill a reward pool. At
              season’s end, a four-factor score — <em>economy</em> (value produced &amp; traded), <em>military</em>
              (raids/sieges won), <em>territory</em> (control, weighted by plot tier), and <em>allegiance</em>
              (contribution) — ranks every commander, and the sink-funded pool is distributed accordingly. Then the map
              resets and the meta shifts, while account-permanent layers (commanders, reputation) carry forward.
            </p>
            <p>
              Because the pool is funded only by collected sinks, the season cannot pay out more than the economy
              produced. Rewards are a redistribution of productivity, never an emission.
            </p>
          </Section>

          {/* 07 TOKEN */}
          <Section id="token" n="07" title="Tokenomics · $HEXAR">
            <div className="wp-token-grid">
              <Fact k="Supply" v="1,000,000,000 $HEXAR — fixed, minted once at genesis (Solana Token-2022)" />
              <Fact k="Emissions" v="None. No staking yield, no liquidity mining, no inflation." />
              <Fact k="Reward source" v="Sinks only, redistributed each season" />
              <Fact k="Deflation" v="A configurable burn share permanently removes a fraction of every sink" />
              <Fact k="Access" v="Holder-gated — hold ≥1,000 $HEXAR to deploy onto the map" />
              <Fact k="Withdrawals" v="Only pool-earned $HEXAR is claimable on-chain, capped per commander — the free starting balance is in-game only" />
            </div>
            <p>
              Every fee, upkeep charge, construction, training order and early-unstake penalty routes through the
              <strong> Sink Router</strong>, which splits collected $HEXAR three ways:
            </p>
            <div className="wp-router">
              <div className="wp-router-in">PLAYERS → fees · upkeep · build · train · listings</div>
              <div className="wp-router-arrow">▼ SINK ROUTER ▼</div>
              <div className="wp-router-out">
                <span className="r-burn">BURN (X%)</span>
                <span className="r-pool">SEASON POOL (Y%)</span>
                <span className="r-tax">REGION TAX (Z%)</span>
              </div>
            </div>
            <p>
              This is the entire sustainability thesis: the protocol literally cannot distribute more than it collected,
              and a slice of everything is burned forever — so net supply trends flat-to-deflationary with activity.
            </p>
          </Section>

          {/* 08 ARCHITECTURE */}
          <Section id="architecture" n="08" title="Architecture">
            <p>
              The simulation is <strong>server-authoritative</strong>. A pure, deterministic core (<code>src/sim</code>)
              owns the rules — world generation, a 1 Hz tick, and validated commands — with zero IO, no randomness
              outside seeded paths, and no framework entanglement. The same module runs on the server and ships to the
              client.
            </p>
            <div className="wp-flow">
              <span>client action</span><i>→</i><span>validate</span><i>→</i><span>apply</span><i>→</i><span>broadcast</span><i>→</i><span>persist</span>
            </div>
            <ul className="wp-list">
              <li><strong>Authoritative server</strong> — Node + <code>ws</code>: holds the world in memory, ticks it, validates every command, and broadcasts state to all clients.</li>
              <li><strong>Persistence</strong> — JSONB world snapshots to Postgres every few ticks; the world reloads on boot, surviving restarts.</li>
              <li><strong>Client</strong> — Next.js 16 / React 19. The polished single-player prototype lives at <code>/play</code>; the live shared world at <code>/world</code>.</li>
              <li><strong>Determinism</strong> — battles and ticks are reproducible; snapshots round-trip losslessly, which is what makes authoritative persistence safe.</li>
            </ul>
          </Section>

          {/* 09 ONCHAIN */}
          <Section id="onchain" n="09" title="On-Chain Layer">
            <p>
              Value events settle on an EVM L2 (deployed to <strong>Base Sepolia</strong>); high-frequency gameplay stays
              off-chain and authoritative. Four self-contained Foundry contracts, no external libraries:
            </p>
            <div className="wp-contracts">
              {CONTRACTS.map(([name, addr, desc]) => (
                <a
                  key={name}
                  className="wp-contract"
                  href={`https://sepolia.basescan.org/address/${addr}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="wp-contract-h">{name} <span className="wp-ext">↗</span></div>
                  <div className="wp-addr">{addr}</div>
                  <div className="wp-contract-d">{desc}</div>
                </a>
              ))}
            </div>
            <p>
              Staking is <strong>principal-safe</strong>: the StakingManager escrows stake and only ever returns it to the
              owner (minus sinks) or transfers a plot via conquest — it has no power to seize principal. The
              treasury settles claims only from a sink-funded pool — paying out solely pool-earned $HEXAR, capped per
              commander, never minting. Genesis supply is fixed at the $HEXAR mint and burnable through the sink router.
            </p>
          </Section>

          {/* 10 INTEGRITY */}
          <Section id="integrity" n="10" title="Engineering Integrity">
            <p>
              The economy makes a hard promise — a fixed, conserved supply — so we hold the code to it. The simulation
              core is built test-first, and a <strong>property-based fuzz harness</strong> throws random valid and invalid
              command streams at it, asserting after <em>every step</em> that:
            </p>
            <ul className="wp-list">
              <li><strong>$HEXAR is conserved</strong>: Σ balances + Σ locked stake + Σ treasuries + burned = constant.</li>
              <li>resources never go negative, no value is NaN, structural integrity holds, and no input ever throws.</li>
              <li>a JSON snapshot round-trips to an identical subsequent tick (persistence safety).</li>
            </ul>
            <p>
              A <strong>1.2-million-step</strong> run across many seeds and players surfaced five places where $HEXAR was
              silently destroyed without being recorded as burned — building, upgrading, training, a market rounding
              residue, and treasury loss on disband. All five are fixed (the spent $HEXAR is now correctly booked as a sink
              or refunded), and the fuzzer is a permanent regression guard. The supply is now provably conserved under a
              million-plus randomized operations.
            </p>
          </Section>

          {/* 11 STATUS */}
          <Section id="status" n="11" title="Build Status & Roadmap">
            <p className="wp-sub">Shipped — the full single-player feature set, now server-authoritative multiplayer, deployed and verified live in six slices:</p>
            <div className="wp-slices">
              {SLICES.map(([n, name, desc]) => (
                <div key={n} className="wp-slice">
                  <div className="wp-slice-n">{n}</div>
                  <div><div className="wp-slice-name">{name} <span className="wp-ok">✓ live</span></div><div className="wp-slice-d">{desc}</div></div>
                </div>
              ))}
            </div>
            <p className="wp-sub">On the roadmap to a full launch:</p>
            <ul className="wp-list">
              <li>Merkle reward pipeline (season scoring → on-chain claims) atop the deployed contracts.</li>
              <li>Sector sharding &amp; autoscaling for 100k-CCU scale.</li>
              <li>Wallet-based identity + anti-cheat signatures (anonymous sessions today).</li>
              <li>Contract audit hardening, then mainnet launch on an EVM L2.</li>
            </ul>
          </Section>

          {/* 12 DEPLOY */}
          <Section id="deploy" n="12" title="Deployment & Access">
            <div className="wp-token-grid">
              <Fact k="Live world" v="warlands-nine.vercel.app/world" link="https://warlands-nine.vercel.app/world" />
              <Fact k="Single-player" v="warlands-nine.vercel.app/play" link="https://warlands-nine.vercel.app/play" />
              <Fact k="Game server" v="wss://warlands-app-production.up.railway.app (authoritative)" />
              <Fact k="Chain" v="Base Sepolia (chainId 84532)" link="https://sepolia.basescan.org/address/0x317e64c59E84b958629C4F0CCFbe9F14d0bF9c0B" />
            </div>
            <p>
              Stack: Next.js 16 · React 19 · TypeScript · Zustand · wagmi/viem · Node + ws · Drizzle ORM + Neon Postgres ·
              Foundry / Solidity. Open <a href="/world">/world</a> in two tabs to watch the authoritative world sync in
              real time.
            </p>
          </Section>

          <footer className="wp-foot">
            <div>WARLANDS — Strategic Briefing v1.0</div>
            <div className="wp-foot-dim">
              All numeric constants are tuning seeds to be calibrated against a live economy simulation before launch.
              Testnet demo — not financial advice, not a solicitation.
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

/* ---------- building blocks ---------- */
function Section({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="wp-section wp-reveal">
      <div className="wp-sec-head">
        <span className="wp-sec-n">§{n}</span>
        <h2>{title}</h2>
      </div>
      <div className="wp-sec-body">{children}</div>
    </section>
  );
}
function DataTable({ head, rows, mono = [] }: { head: string[]; rows: string[][]; mono?: number[] }) {
  return (
    <div className="wp-table-wrap">
      <table className="wp-table">
        <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className={mono.includes(j) ? "m" : ""}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function TierCol({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="wp-tier-col">
      <div className="wp-tier-h">{label}</div>
      <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  );
}
function Fact({ k, v, link }: { k: string; v: string; link?: string }) {
  return (
    <div className="wp-fact">
      <div className="wp-fact-k">{k}</div>
      <div className="wp-fact-v">{link ? <a href={link} target="_blank" rel="noreferrer">{v} ↗</a> : v}</div>
    </div>
  );
}

const CSS = `
.wp{--bg:#0a0b0e;--bg2:#0e1015;--panel:#13161d;--line:#252b37;--line2:#333c4c;
  --ink:#dcdacf;--dim:#878d9b;--amber:#f0b429;--amber2:#caa23a;--red:#cf3b2c;--teal:#46b3a6;
  --display:'Oswald',system-ui,sans-serif;--body:'Newsreader',Georgia,serif;--mono:'JetBrains Mono',ui-monospace,monospace;
  background:var(--bg);color:var(--ink);font-family:var(--body);min-height:100vh;position:relative;overflow-x:hidden;
  font-size:16px;line-height:1.62;-webkit-font-smoothing:antialiased;}
.wp *{box-sizing:border-box;}
.wp ::selection{background:var(--amber);color:#1a1407;}
.wp-hexbg{position:fixed;inset:0;width:100%;height:100%;color:#e9b94a;opacity:.045;pointer-events:none;z-index:0;}
.wp-grain{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.5;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E");}
.wp-scan{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.35;
  background:repeating-linear-gradient(to bottom,transparent 0,transparent 2px,rgba(0,0,0,.45) 3px,transparent 4px);}
.wp-shell{position:relative;z-index:2;display:grid;grid-template-columns:280px 1fr;gap:0;max-width:1280px;margin:0 auto;}

/* sidebar */
.wp-side{position:sticky;top:0;align-self:start;height:100vh;padding:34px 26px;border-right:1px solid var(--line);
  display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(16,18,24,.6),rgba(10,11,14,.2));backdrop-filter:blur(2px);}
.wp-brandmark{font-family:var(--display);font-weight:700;font-size:21px;letter-spacing:.22em;color:var(--ink);text-transform:uppercase;}
.wp-brandmark .wp-chev{color:var(--amber);margin-right:6px;}
.wp-classif{font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;color:var(--dim);margin:12px 0 26px;line-height:1.6;
  border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:9px 0;}
.wp-nav{display:flex;flex-direction:column;gap:1px;overflow-y:auto;flex:1;margin:0 -8px;}
.wp-nav a{display:flex;gap:11px;align-items:baseline;padding:6px 8px;color:var(--dim);text-decoration:none;
  font-family:var(--display);font-weight:400;font-size:13px;letter-spacing:.06em;text-transform:uppercase;
  border-left:2px solid transparent;transition:all .18s ease;}
.wp-nav a:hover{color:var(--ink);background:rgba(240,180,41,.04);}
.wp-nav a.on{color:var(--amber);border-left-color:var(--amber);background:rgba(240,180,41,.06);}
.wp-nav-n{font-family:var(--mono);font-size:10px;color:var(--line2);min-width:18px;}
.wp-nav a.on .wp-nav-n{color:var(--amber2);}
.wp-side-foot{margin-top:18px;border-top:1px solid var(--line);padding-top:16px;display:flex;flex-direction:column;gap:8px;}
.wp-side-foot a{font-family:var(--mono);font-size:11px;letter-spacing:.05em;color:var(--teal);text-decoration:none;}
.wp-side-foot a:hover{color:var(--amber);}

/* main */
.wp-main{padding:0 clamp(24px,5vw,72px) 120px;min-width:0;}

/* hero */
.wp-hero{position:relative;padding:80px 0 56px;border-bottom:1px solid var(--line);}
.wp-stamp{position:absolute;top:64px;right:0;transform:rotate(8deg);font-family:var(--display);font-weight:700;
  font-size:13px;letter-spacing:.18em;line-height:1.25;text-align:center;color:var(--red);text-transform:uppercase;
  border:2px solid var(--red);padding:8px 12px;opacity:.62;}
.wp-tag{font-family:var(--mono);font-size:11.5px;letter-spacing:.34em;color:var(--amber2);text-transform:uppercase;}
.wp-title{font-family:var(--display);font-weight:700;text-transform:uppercase;letter-spacing:.04em;
  font-size:clamp(58px,11vw,128px);line-height:.92;margin:14px 0 0;color:var(--ink);}
.wp-title span{color:transparent;-webkit-text-stroke:1.5px var(--amber);text-stroke:1.5px var(--amber);}
.wp-lede{font-size:clamp(17px,2.1vw,21px);line-height:1.6;max-width:48ch;color:#c8c6bb;margin:24px 0 0;font-weight:300;}
.wp-statstrip{display:flex;flex-wrap:wrap;gap:0;margin:38px 0 0;border:1px solid var(--line);}
.wp-stat{flex:1;min-width:120px;padding:16px 18px;border-right:1px solid var(--line);background:rgba(19,22,29,.5);}
.wp-stat:last-child{border-right:none;}
.wp-stat-n{font-family:var(--mono);font-weight:700;font-size:clamp(18px,2.4vw,24px);color:var(--amber);letter-spacing:-.01em;}
.wp-stat-l{font-family:var(--display);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin-top:5px;}
.wp-status-line{font-family:var(--mono);font-size:11px;letter-spacing:.04em;color:var(--dim);margin-top:22px;display:flex;align-items:center;gap:9px;}
.wp-dot{width:8px;height:8px;border-radius:50%;background:var(--teal);box-shadow:0 0 0 0 rgba(70,179,166,.5);animation:wp-pulse 2.4s infinite;}
@keyframes wp-pulse{0%{box-shadow:0 0 0 0 rgba(70,179,166,.45)}70%{box-shadow:0 0 0 9px rgba(70,179,166,0)}100%{box-shadow:0 0 0 0 rgba(70,179,166,0)}}

/* sections */
.wp-section{padding:62px 0;border-bottom:1px solid var(--line);}
.wp-sec-head{display:flex;align-items:baseline;gap:16px;margin-bottom:26px;}
.wp-sec-n{font-family:var(--mono);font-size:13px;color:var(--amber2);letter-spacing:.05em;}
.wp-sec-head h2{font-family:var(--display);font-weight:600;text-transform:uppercase;letter-spacing:.05em;
  font-size:clamp(26px,4vw,40px);margin:0;color:var(--ink);}
.wp-sec-head h2::after{content:"";display:block;height:2px;background:linear-gradient(90deg,var(--amber),transparent);margin-top:10px;width:min(420px,60%);}
.wp-sec-body p{margin:0 0 18px;max-width:74ch;}
.wp-sec-body strong{color:#f0eee4;font-weight:500;}
.wp-sec-body em{color:var(--amber2);font-style:italic;}
.wp-sec-body code{font-family:var(--mono);font-size:.82em;background:rgba(240,180,41,.08);color:var(--amber);padding:1px 6px;border-radius:3px;border:1px solid rgba(240,180,41,.14);}
.wp-sec-body a{color:var(--teal);text-decoration:none;border-bottom:1px solid rgba(70,179,166,.35);}
.wp-sec-body a:hover{color:var(--amber);border-color:var(--amber);}
.wp-sub{font-family:var(--display);text-transform:uppercase;letter-spacing:.1em;font-size:13px;color:var(--dim);margin-top:30px;}
.wp-eq{font-family:var(--mono);font-size:clamp(14px,2vw,18px);color:var(--amber);text-align:center;
  border:1px solid var(--line2);background:rgba(240,180,41,.05);padding:22px;margin:8px 0 24px;letter-spacing:.02em;}

/* lists */
.wp-list{list-style:none;padding:0;margin:6px 0 18px;max-width:78ch;}
.wp-list li{position:relative;padding:7px 0 7px 24px;border-bottom:1px dashed var(--line);}
.wp-list li::before{content:"▸";position:absolute;left:0;color:var(--amber);}

/* table */
.wp-table-wrap{overflow-x:auto;border:1px solid var(--line);margin:8px 0 12px;}
.wp-table{width:100%;border-collapse:collapse;font-size:14px;min-width:480px;}
.wp-table th{font-family:var(--display);text-transform:uppercase;letter-spacing:.1em;font-size:11px;color:var(--amber2);
  text-align:left;padding:11px 16px;background:rgba(240,180,41,.05);border-bottom:1px solid var(--line2);}
.wp-table td{padding:10px 16px;border-bottom:1px solid var(--line);color:#c8c6bb;}
.wp-table tr:last-child td{border-bottom:none;}
.wp-table tr:hover td{background:rgba(255,255,255,.015);color:var(--ink);}
.wp-table td.m{font-family:var(--mono);color:var(--amber);font-size:13px;}

/* tiers */
.wp-tier{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:18px 0 22px;}
.wp-tier-col{border:1px solid var(--line);background:rgba(19,22,29,.5);padding:16px;}
.wp-tier-h{font-family:var(--display);text-transform:uppercase;letter-spacing:.09em;font-size:11.5px;color:var(--amber);margin-bottom:11px;border-bottom:1px solid var(--line);padding-bottom:8px;}
.wp-tier-col ul{list-style:none;margin:0;padding:0;font-family:var(--mono);font-size:12.5px;color:#bcc0c9;}
.wp-tier-col li{padding:3px 0;}

/* units */
.wp-units{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:18px 0 24px;}
.wp-unit{border:1px solid var(--line);background:rgba(19,22,29,.55);padding:15px;transition:border-color .2s,transform .2s;}
.wp-unit:hover{border-color:var(--amber2);transform:translateY(-2px);}
.wp-unit-h{font-family:var(--display);text-transform:uppercase;letter-spacing:.06em;font-size:16px;color:var(--ink);display:flex;align-items:center;gap:9px;}
.wp-unit-ic{font-size:19px;}
.wp-unit-role{font-size:13.5px;color:#c8c6bb;margin:6px 0;}
.wp-unit-cnt{font-family:var(--mono);font-size:10.5px;color:var(--dim);letter-spacing:.02em;line-height:1.5;}

/* flow + router */
.wp-flow{display:flex;flex-wrap:wrap;align-items:center;gap:10px;font-family:var(--mono);font-size:12px;
  text-transform:uppercase;letter-spacing:.05em;margin:8px 0 22px;}
.wp-flow span{border:1px solid var(--line2);padding:8px 13px;color:var(--ink);background:rgba(19,22,29,.6);}
.wp-flow i{color:var(--amber);font-style:normal;}
.wp-router{border:1px solid var(--line2);margin:8px 0 22px;text-align:center;font-family:var(--mono);}
.wp-router-in{padding:13px;font-size:12px;color:#c8c6bb;letter-spacing:.03em;border-bottom:1px solid var(--line);}
.wp-router-arrow{padding:9px;font-size:12px;letter-spacing:.3em;color:var(--amber);background:rgba(240,180,41,.06);}
.wp-router-out{display:flex;flex-wrap:wrap;}
.wp-router-out span{flex:1;min-width:130px;padding:14px;font-size:12px;letter-spacing:.06em;border-right:1px solid var(--line);}
.wp-router-out span:last-child{border-right:none;}
.r-burn{color:var(--red);} .r-pool{color:var(--teal);} .r-tax{color:var(--amber);}

/* facts / token grid */
.wp-token-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin:6px 0 22px;}
.wp-fact{border:1px solid var(--line);background:rgba(19,22,29,.5);padding:14px 16px;}
.wp-fact-k{font-family:var(--display);text-transform:uppercase;letter-spacing:.1em;font-size:10.5px;color:var(--amber2);}
.wp-fact-v{font-size:14.5px;color:#cdcabf;margin-top:6px;line-height:1.5;}
.wp-fact-v a{font-family:var(--mono);font-size:13px;color:var(--teal);text-decoration:none;}
.wp-fact-v a:hover{color:var(--amber);}

/* contracts */
.wp-contracts{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin:8px 0 22px;}
.wp-contract{display:block;border:1px solid var(--line);background:rgba(19,22,29,.55);padding:16px;text-decoration:none;transition:border-color .2s,transform .2s;}
.wp-contract:hover{border-color:var(--teal);transform:translateY(-2px);}
.wp-contract-h{font-family:var(--display);text-transform:uppercase;letter-spacing:.06em;font-size:15px;color:var(--ink);display:flex;justify-content:space-between;}
.wp-ext{color:var(--teal);}
.wp-addr{font-family:var(--mono);font-size:10.5px;color:var(--amber);word-break:break-all;margin:8px 0;}
.wp-contract-d{font-size:13px;color:#bcc0c9;}

/* slices */
.wp-slices{display:flex;flex-direction:column;gap:0;border:1px solid var(--line);margin:10px 0 18px;}
.wp-slice{display:flex;gap:16px;padding:14px 16px;border-bottom:1px solid var(--line);align-items:flex-start;}
.wp-slice:last-child{border-bottom:none;}
.wp-slice:hover{background:rgba(255,255,255,.015);}
.wp-slice-n{font-family:var(--mono);font-weight:700;color:var(--amber);font-size:14px;min-width:24px;}
.wp-slice-name{font-family:var(--display);text-transform:uppercase;letter-spacing:.06em;font-size:15px;color:var(--ink);}
.wp-ok{font-family:var(--mono);font-size:10px;color:var(--teal);letter-spacing:.05em;margin-left:8px;}
.wp-slice-d{font-size:13.5px;color:#bcc0c9;margin-top:3px;}

/* footer */
.wp-foot{padding:46px 0 0;font-family:var(--mono);font-size:11.5px;color:var(--dim);letter-spacing:.04em;}
.wp-foot-dim{margin-top:10px;max-width:70ch;line-height:1.7;color:var(--line2);}

/* reveal + load */
.wp-fade{opacity:0;animation:wp-up .8s cubic-bezier(.2,.7,.2,1) forwards;}
@keyframes wp-up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.wp--ready .wp-reveal{opacity:0;transform:translateY(16px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1);}
.wp--ready .wp-reveal.in{opacity:1;transform:none;}
@media (prefers-reduced-motion:reduce){.wp-fade,.wp--ready .wp-reveal{animation:none!important;opacity:1!important;transform:none!important;}}

/* responsive */
@media (max-width:880px){
  .wp-shell{grid-template-columns:1fr;}
  .wp-side{position:static;height:auto;flex-direction:column;border-right:none;border-bottom:1px solid var(--line);padding:22px 24px;}
  .wp-nav{flex-direction:row;flex-wrap:wrap;gap:4px 14px;margin:8px 0 0;}
  .wp-nav a{border-left:none;border-bottom:2px solid transparent;padding:4px 0;}
  .wp-nav a.on{border-left:none;border-bottom-color:var(--amber);background:none;}
  .wp-tier{grid-template-columns:1fr;}
  .wp-stamp{display:none;}
}
`;
