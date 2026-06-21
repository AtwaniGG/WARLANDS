"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/game/store";
import { useSettings } from "@/game/settings";
import { Button } from "./ui";

type Progress = { plots: number; hasExtractor: boolean; hasFactory: boolean; hasArmy: boolean };

interface Step {
  chapter: string;
  title: string;
  body: string;
  /** tab to switch to when this step opens */
  view?: string;
  /** optional hands-on objective + a predicate over game progress */
  objective?: { hint: string; done: (p: Progress) => boolean };
}

const STEPS: Step[] = [
  {
    chapter: "Briefing",
    title: "Welcome, Commander",
    body: "WARLANDS is a persistent strategy MMO: stake $HEXAR to claim finite land, build an interlocking war economy, and fight — solo or in allegiances — to climb a season ladder funded entirely by player activity. This tour covers every system in a few minutes. You can leave any time.",
  },
  {
    chapter: "The World",
    title: "One living map",
    view: "map",
    body: "The world is a hex grid with a center→edge risk gradient. The outer ring is the safe newbie belt; the center is the Crucible — high-value, contested, perpetual war. 💀 marks raidable NPC camps; coloured banners are rival AI empires. Drag to pan, scroll or pinch to zoom.",
  },
  {
    chapter: "The World",
    title: "Nine plot types",
    view: "map",
    body: "Each terrain has a stake cost and a yield profile. A Basic Plot (10k) is cheap and balanced; a Warzone (60k) gives +40% on everything and 2.5× season points but can never be protected. Higher tier = more reward, more stake, harder to hold.",
  },
  {
    chapter: "Claim Land",
    title: "Stake your first plot",
    view: "map",
    body: "Click any unclaimed hex, then press “Stake & Claim”. Your $HEXAR is locked — never spent — as the right to occupy that plot. Unstaking later returns the principal minus a small fee.",
    objective: { hint: "Stake & claim any plot", done: (p) => p.plots >= 1 },
  },
  {
    chapter: "Claim Land",
    title: "Your plot panel",
    view: "map",
    body: "Selecting a plot opens its panel on the right: Stockpile (stored goods), Defense, Buildings, and the Construct menu. Every plot starts with a Camp (HQ) — its level caps how many buildings you can place, so upgrade it to expand.",
  },
  {
    chapter: "Economy",
    title: "Build an extractor",
    view: "map",
    body: "Use Construct to build an extractor — Farm, Lumber Camp, Iron Mine, Oil Derrick, and so on. Terrain decides what's allowed (no oil on a forest). Extractors gather one raw resource every tick.",
    objective: { hint: "Build any extractor", done: (p) => p.hasExtractor },
  },
  {
    chapter: "Economy",
    title: "Resources & three tiers",
    view: "map",
    body: "Twenty resources in three tiers: raw (food, wood, iron, oil, data chips…) → intermediate (steel, fuel, electronics…) → finished (rifles, tanks, drones, aircraft…). Extra plots give diminishing returns each, so it pays to specialise and trade rather than sprawl.",
  },
  {
    chapter: "Economy",
    title: "Upkeep & storage",
    view: "map",
    body: "Food and Water are consumed every tick by your workforce and army — keep producing them or your defenses slowly decay. Storage is capped; build Warehouses to raise the ceiling so surplus production isn't wasted.",
  },
  {
    chapter: "Economy",
    title: "Factories & supply chains",
    view: "map",
    body: "Build a Refinery or Foundry and pick its product. Factories transform inputs up the chain: oil→fuel, iron+fuel→steel, steel+electronics→tanks. Finished military goods are what unlock the heavy units you'll need for war.",
  },
  {
    chapter: "Economy",
    title: "Upgrade everything",
    view: "map",
    body: "Upgrade buildings to boost output — each level costs $HEXAR (a token sink) and raises upkeep. Upgrade your Camp to unlock more building slots. Growth is good, but rising upkeep keeps sprawl in check.",
  },
  {
    chapter: "Military",
    title: "Raise an army",
    view: "map",
    body: "Train units on a plot that can afford them (units cost $HEXAR plus finished goods like rifles or tanks). Six classes: Infantry, Tanks, Artillery, Aircraft, Drones, Engineers — each with a role.",
    objective: { hint: "Train any unit", done: (p) => p.hasArmy },
  },
  {
    chapter: "Military",
    title: "The counter triangle",
    view: "codex",
    body: "No army is dominant. Tanks crush infantry but fall to artillery and aircraft; aircraft beat ground units but lose to drones; drones counter aircraft. Scout first, bring combined arms. This Codex tab has the full counter matrix and supply chains for reference.",
  },
  {
    chapter: "Military",
    title: "Raid, siege & conquer",
    view: "map",
    body: "Send an army from a plot at a 💀 camp, a rival empire, or another player. Battles are seeded and deterministic — same inputs, same result. Raids loot stored goods; sieges break defenses and take land. Conquest is principal-safe: the loser's staked $HEXAR is refunded; only built assets and loot change hands.",
  },
  {
    chapter: "Trade",
    title: "The marketplace",
    view: "market",
    body: "A player-driven order book — sell your surplus, buy what you're short on. Prices drift with supply and demand, and every trade pays a fee that's burned or routed to the season reward pool. The market is the economy's main sink engine and price-discovery layer.",
  },
  {
    chapter: "Allegiances",
    title: "Band together",
    view: "allegiance",
    body: "Found or join an allegiance: a shared treasury funded by member contributions. Treasury-funded buildings buff every member's plots — Research (+production), Fortress (+defense), Trade Hub (−market fees). Coordinated alliances dominate.",
  },
  {
    chapter: "Allegiances",
    title: "Governance",
    view: "allegiance",
    body: "Members propose allegiance buildings and vote; a majority builds it from the treasury. Larger alliances contest regions, run scheduled territory wars, and climb the ladder together.",
  },
  {
    chapter: "Progression",
    title: "Research & commanders",
    view: "research",
    body: "Spend resources on Research to unlock tech bonuses and rare blueprints. Recruit Commanders — account-permanent heroes with skills (e.g. +infantry in forests) that persist across seasons. See the Research and Commanders tabs.",
  },
  {
    chapter: "Seasons",
    title: "Seasons & rewards",
    view: "season",
    body: "The world runs in 30-day seasons. A four-factor score — economy, military, territory, and allegiance contribution — ranks every commander. The reward pool is funded only by sinks collected that season, so payouts can never exceed what the economy produced. No emissions, ever.",
  },
  {
    chapter: "On-Chain",
    title: "The $HEXAR token",
    view: "wallet",
    body: "$HEXAR is a real SPL token on Solana (beta). Value events — staking, market settlement, treasury, reward claims — settle on-chain, while high-frequency gameplay stays off-chain and fast. Fixed 1,000,000,000 supply, deflationary via sinks. Connect a Phantom wallet here to see your on-chain balance.",
  },
  {
    chapter: "Ready",
    title: "Good hunting, Commander",
    view: "map",
    body: "That's the loop: stake → build → produce → fight → trade → ally → climb the season. Check Quests for guided goals, Stats and Ranks to track progress, and the Codex for reference. Reopen this tutorial any time with the ❔ button. The world is live — go take it.",
  },
];

export function TutorialOverlay({ onView }: { onView?: (v: string) => void }) {
  const done = useSettings((s) => s.tutorialDone);
  const rawStep = useSettings((s) => s.tutorialStep);
  const set = useSettings((s) => s.set);
  const plots = useGame((s) => s.plots);

  const step = Math.min(Math.max(rawStep, 0), STEPS.length - 1);
  const list = Object.values(plots);
  const progress: Progress = {
    plots: list.length,
    hasExtractor: list.some((p) => p.buildings.some((b) => b.id !== "camp" && b.id !== "warehouse")),
    hasFactory: list.some((p) => p.buildings.some((b) => b.activeProduct)),
    hasArmy: list.some((p) => Object.values(p.army).some((n) => (n ?? 0) > 0)),
  };

  const s = STEPS[step];

  // switch tab when a step opens
  useEffect(() => {
    if (!done && s.view && onView) onView(s.view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, done]);

  // auto-advance ~1s after completing a hands-on objective
  const autoed = useRef(-1);
  const objDone = s.objective ? s.objective.done(progress) : false;
  useEffect(() => {
    if (done || !s.objective || !objDone || autoed.current === step) return;
    autoed.current = step;
    const t = setTimeout(() => set("tutorialStep", Math.min(step + 1, STEPS.length - 1)), 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objDone, step, done]);

  // Re-open button when the tutorial is dismissed.
  if (done) {
    return (
      <button
        onClick={() => set("tutorialDone", false)}
        aria-label="Open tutorial"
        className="fixed bottom-4 left-4 z-40 grid place-items-center"
        style={{ width: 38, height: 38, borderRadius: 999, border: "1px solid rgba(245,179,1,0.45)", background: "var(--panel)", color: "var(--amber-text)", fontSize: 18, boxShadow: "var(--shadow-2)" }}
        title="Tutorial / Help"
      >
        ❔
      </button>
    );
  }

  const first = step === 0;
  const last = step === STEPS.length - 1;
  const go = (n: number) => set("tutorialStep", Math.min(Math.max(n, 0), STEPS.length - 1));
  const finish = () => set("tutorialDone", true);

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-40" style={{ width: "min(380px, calc(100vw - 24px))" }}>
      <div
        className="pointer-events-auto p-4"
        style={{ borderRadius: "var(--radius-lg)", border: "1px solid rgba(245,179,1,0.4)", background: "var(--panel)", boxShadow: "var(--shadow-2)" }}
      >
        <div className="flex items-center justify-between">
          <span className="wl-label" style={{ color: "var(--amber-text)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {s.chapter} · {step + 1}/{STEPS.length}
          </span>
          <button onClick={finish} style={{ fontSize: "11px", color: "var(--text-muted)" }} title="Close tutorial">Skip ✕</button>
        </div>

        <div className="wl-title mt-1.5" style={{ fontSize: "16px", color: "var(--text-hi)" }}>{s.title}</div>
        <p className="mt-1.5" style={{ fontSize: "12.5px", lineHeight: 1.5, color: "var(--text-lo)" }}>{s.body}</p>

        {s.objective && (
          <div
            className="mt-2.5 flex items-center gap-2 px-2.5 py-1.5"
            style={{ borderRadius: "var(--radius-sm)", border: `1px solid ${objDone ? "rgba(52,211,153,0.4)" : "rgba(245,179,1,0.3)"}`, background: objDone ? "rgba(52,211,153,0.08)" : "rgba(245,179,1,0.06)", fontSize: 12 }}
          >
            <span>{objDone ? "✅" : "🎯"}</span>
            <span style={{ color: objDone ? "var(--emerald-text)" : "var(--amber-text)" }}>
              {objDone ? "Done!" : s.objective.hint}
            </span>
          </div>
        )}

        {/* progress bar */}
        <div className="mt-3 h-1 w-full overflow-hidden" style={{ borderRadius: 999, background: "var(--surface-sunken)" }}>
          <div style={{ width: `${((step + 1) / STEPS.length) * 100}%`, height: "100%", background: "var(--amber)", transition: "width .25s ease" }} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          {first ? (
            <>
              <Button variant="primary" size="sm" onClick={() => go(1)}>Start the tour →</Button>
              <Button variant="ghost" size="sm" onClick={finish}>Skip</Button>
            </>
          ) : last ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => go(step - 1)}>← Back</Button>
              <Button variant="primary" size="sm" onClick={finish}>Finish ✓</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={() => go(step - 1)}>← Back</Button>
              <Button variant="primary" size="sm" onClick={() => go(step + 1)}>{objDone ? "Next ✓ →" : "Next →"}</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
