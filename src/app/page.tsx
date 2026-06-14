import Link from "next/link";
import { PLOT_TYPES, TERRAIN_IDS } from "@/game/plotTypes";

const LOOP = ["STAKE", "CLAIM", "BUILD", "FARM", "MANUFACTURE", "RAID", "ALLY", "EARN"];

const PILLARS = [
  {
    no: "01",
    title: "Land is staked, not bought",
    body: "Lock $WAR to secure a plot — never spent, always returnable. Conquest transfers the right to the land, never your principal. Skin in the game without loot in the game.",
    accent: "var(--amber)",
  },
  {
    no: "02",
    title: "Economy before war",
    body: "No army without a supply chain. No plot makes everything well. Specialization and trade are structurally forced — then war disrupts what the economy built.",
    accent: "var(--teal)",
  },
  {
    no: "03",
    title: "War funded by sinks, not emissions",
    body: "Every reward $WAR is first collected from a real sink. The protocol can never pay out more than it took in. No infinite emissions. No death spiral.",
    accent: "var(--blood)",
  },
];

export default function Landing() {
  return (
    <div
      className="wl-grain relative min-h-dvh overflow-hidden bg-[#0a0d12] text-zinc-200"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      {/* atmosphere */}
      <div className="wl-hexgrid pointer-events-none absolute inset-0 opacity-40" />
      <div className="wl-glow pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[#f5b301]/10 blur-[120px]" />
      <div className="wl-scanline" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,#05070b_100%)]" />

      {/* nav */}
      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center font-black text-black" style={{ fontFamily: "var(--font-display)", background: "var(--amber)" }}>W</span>
          <span className="text-lg font-bold tracking-[0.2em] text-zinc-100" style={{ fontFamily: "var(--font-display)" }}>WARLANDS</span>
        </div>
        <div className="hidden items-center gap-7 text-xs uppercase tracking-widest text-zinc-400 md:flex">
          <a href="#loop" className="hover:text-amber-400">The Loop</a>
          <a href="#pillars" className="hover:text-amber-400">Doctrine</a>
          <a href="#land" className="hover:text-amber-400">Land</a>
          <a href="#token" className="hover:text-amber-400">$WAR</a>
        </div>
        <Link href="/play" className="border border-amber-500/60 bg-amber-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-amber-300 transition hover:bg-amber-500 hover:text-black">
          Enter War Room
        </Link>
      </nav>

      {/* hero */}
      <header className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
        <div className="wl-rise mb-6 inline-flex items-center gap-2 border border-zinc-700/70 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-zinc-400" style={{ animationDelay: "0ms" }}>
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Persistent world · always running
        </div>

        <h1 className="max-w-4xl text-5xl font-bold leading-[0.95] tracking-tight text-zinc-50 sm:text-7xl md:text-[5.5rem]" style={{ fontFamily: "var(--font-display)" }}>
          <span className="wl-rise block" style={{ animationDelay: "80ms" }}>STAKE THE LAND.</span>
          <span className="wl-rise block text-amber-400" style={{ animationDelay: "180ms" }}>FORGE AN EMPIRE.</span>
          <span className="wl-rise block" style={{ animationDelay: "280ms" }}>
            WAGE <span style={{ color: "var(--blood)" }}>WAR</span>.
          </span>
        </h1>

        <p className="wl-rise mt-6 max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg" style={{ animationDelay: "380ms" }}>
          A persistent Web3 strategy MMO on one shared hex world. Stake the native token to
          claim finite land, build industrial-military supply chains, trade a player-driven
          economy, and conquer your neighbors — alone or in an Allegiance.
        </p>

        <div className="wl-rise mt-9 flex flex-wrap items-center gap-4" style={{ animationDelay: "480ms" }}>
          <Link href="/play" className="group relative overflow-hidden bg-amber-500 px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-amber-400">
            Deploy to the Front →
          </Link>
          <a href="#loop" className="border border-zinc-700 px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-zinc-300 transition hover:border-zinc-500 hover:text-white">
            How it works
          </a>
        </div>

        {/* status readout strip */}
        <div className="wl-rise mt-14 grid grid-cols-2 gap-px border border-zinc-800 bg-zinc-800 sm:grid-cols-4" style={{ animationDelay: "560ms", fontFamily: "var(--font-mono)" }}>
          {[
            ["WORLD", "ONLINE"],
            ["LAND PLOTS", "~250,000"],
            ["TOKEN", "$WAR"],
            ["SEASON", "30 DAYS"],
          ].map(([k, v]) => (
            <div key={k} className="px-4 py-3" style={{ background: "var(--panel-void)" }}>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500">{k}</div>
              <div className="mt-1 text-lg font-bold text-amber-300">{v}</div>
            </div>
          ))}
        </div>
      </header>

      {/* hazard divider */}
      <div className="wl-hazard relative z-10 h-1.5 opacity-50" />

      {/* core loop */}
      <section id="loop" className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <SectionLabel n="A" title="The Core Loop" />
        <div className="mt-8 flex flex-wrap items-stretch gap-2" style={{ fontFamily: "var(--font-mono)" }}>
          {LOOP.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className="border border-zinc-800 bg-[#0f131c] px-4 py-3 text-center">
                <div className="text-[10px] text-zinc-600">{String(i + 1).padStart(2, "0")}</div>
                <div className="text-sm font-bold tracking-wide text-zinc-200">{step}</div>
              </div>
              {i < LOOP.length - 1 && <span className="text-amber-500/70">→</span>}
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Easy to understand, brutal to master. Learnable in ten minutes; the supply-chain
          arbitrage, combat counters, and Allegiance politics take years.
        </p>
      </section>

      {/* pillars */}
      <section id="pillars" className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <SectionLabel n="B" title="Doctrine" />
        <div className="mt-8 grid gap-px bg-zinc-800 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.no} className="group p-7 transition" style={{ background: "var(--panel-void)" }}>
              <div className="text-5xl font-bold text-zinc-800 transition group-hover:text-zinc-700" style={{ fontFamily: "var(--font-display)" }}>{p.no}</div>
              <div className="mt-3 h-0.5 w-10" style={{ background: p.accent }} />
              <h3 className="mt-4 text-xl font-semibold text-zinc-100" style={{ fontFamily: "var(--font-display)" }}>{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* land / plot types */}
      <section id="land" className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <SectionLabel n="C" title="Finite Land · Real Scarcity" />
        <p className="mt-4 max-w-2xl text-sm text-zinc-500">
          Nine terrain types, each with its own yields, defenses, and stake. Higher tiers earn
          more and bleed more. Stake is locked — never spent, never lootable.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-px bg-zinc-800 sm:grid-cols-3 lg:grid-cols-3" style={{ fontFamily: "var(--font-mono)" }}>
          {TERRAIN_IDS.map((t) => {
            const d = PLOT_TYPES[t];
            return (
              <div key={t} className="p-4 transition" style={{ background: "var(--panel-void)" }}>
                <div className="flex items-center justify-between">
                  <span className="inline-block h-3 w-3" style={{ background: d.color }} />
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">DEF ×{d.defenseMult}</span>
                </div>
                <div className="mt-3 text-sm font-bold text-zinc-200">{d.name}</div>
                <div className="mt-1 text-amber-300">{d.stake.toLocaleString()} <span className="text-[10px] text-zinc-500">$WAR</span></div>
              </div>
            );
          })}
        </div>
      </section>

      {/* tokenomics sink flow */}
      <section id="token" className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <SectionLabel n="D" title="$WAR · Not a Reward Printer" />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm leading-relaxed text-zinc-400">
              Fixed supply. No minting for rewards. Every sink — staking, fees, upkeep,
              speed-ups, war — flows through a single router and splits three ways. A hard,
              on-chain invariant guarantees payouts can never exceed what sinks collected.
            </p>
            <div className="mt-6 space-y-3" style={{ fontFamily: "var(--font-mono)" }}>
              <FlowRow label="BURN" pct="≥ 20%" desc="permanently removed · structural deflation" color="var(--blood)" />
              <FlowRow label="SEASON POOL" pct="~40%" desc="ranked player rewards (sink-funded)" color="var(--amber)" />
              <FlowRow label="REGION TAX" pct="~20%" desc="income for territory-holding Allegiances" color="var(--teal)" />
            </div>
          </div>
          <div className="border border-zinc-800 p-6" style={{ fontFamily: "var(--font-mono)", background: "var(--panel-void)" }}>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Token flow</div>
            <pre className="mt-3 overflow-x-auto text-[11px] leading-relaxed text-zinc-400">{`PLAYERS
  │ fees · upkeep · speed-ups
  ▼
SINK ROUTER ──► BURN  (supply ↓)
  │
  ├──► SEASON POOL ──► ranked payouts
  │
  └──► REGION TAX ──► Allegiance treasuries
                          │
                          └► re-spent (sinks) ↺`}</pre>
            <div className="mt-4 border-t border-zinc-800 pt-3 text-[11px] text-emerald-400">
              Σ rewards ≤ Σ sinks − burns  ·  enforced in contract
            </div>
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <div className="relative overflow-hidden border border-amber-500/30 bg-gradient-to-br from-[#13100a] to-[#0c1018] p-10 text-center md:p-16">
          <div className="wl-hexgrid pointer-events-none absolute inset-0 opacity-30" />
          <h2 className="relative text-3xl font-bold tracking-tight text-zinc-50 md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
            THE WORLD IS ALREADY AT WAR.
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-sm text-zinc-400">
            No matches. No lobbies. One live map, always running. Claim your ground before
            someone else stakes it.
          </p>
          <Link href="/play" className="relative mt-8 inline-block bg-amber-500 px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-amber-400">
            Enter the War Room →
          </Link>
        </div>
      </section>

      {/* footer */}
      <footer className="relative z-10 border-t border-zinc-900 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-zinc-600 sm:flex-row" style={{ fontFamily: "var(--font-mono)" }}>
          <span className="tracking-widest">WARLANDS · AAA WEB3 STRATEGY MMO</span>
          <span>Prototype build · {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="grid h-7 w-7 place-items-center border border-amber-500/50 text-xs font-bold text-amber-400" style={{ fontFamily: "var(--font-mono)" }}>{n}</span>
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
      <span className="h-px flex-1 bg-zinc-800" />
    </div>
  );
}

function FlowRow({ label, pct, desc, color }: { label: string; pct: string; desc: string; color: string }) {
  return (
    <div className="flex items-center gap-3 border border-zinc-800 px-4 py-3" style={{ background: "var(--panel-void)" }}>
      <span className="inline-block h-8 w-1" style={{ background: color }} />
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold tracking-wide text-zinc-200">{label}</span>
          <span className="text-sm" style={{ color }}>{pct}</span>
        </div>
        <div className="text-[11px] text-zinc-500">{desc}</div>
      </div>
    </div>
  );
}
