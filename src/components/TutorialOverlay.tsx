"use client";

import { useGame } from "@/game/store";
import { useSettings } from "@/game/settings";
import { Button } from "./ui";

const STEPS = [
  { title: "Welcome, Commander", body: "This is one shared, always-running war world. Click any hex on the World map, then Stake & Claim to secure your first plot." },
  { title: "Build your economy", body: "On your plot, use Construct to build extractors (Farm, Iron Mine…). They mine resources every tick. Terrain decides what you can build." },
  { title: "Raise an army", body: "Build a factory, then Train units in the plot's Military section. Counters matter — tanks beat infantry, drones beat aircraft." },
  { title: "Go to war & beyond", body: "Hit the 💀 camps and rival empires to loot & conquer. Then explore Research, Commanders, the Market, Allegiances and Quests. Good hunting." },
];

export function TutorialOverlay() {
  const done = useSettings((s) => s.tutorialDone);
  const set = useSettings((s) => s.set);
  const plots = useGame((s) => s.plots);

  if (done) return null;

  // Derive the current step from game progress.
  const plotList = Object.values(plots);
  const hasExtractor = plotList.some((p) => p.buildings.some((b) => b.id !== "camp"));
  const hasArmy = plotList.some((p) => Object.values(p.army).some((n) => (n ?? 0) > 0));
  const step = plotList.length === 0 ? 0 : !hasExtractor ? 1 : !hasArmy ? 2 : 3;
  const s = STEPS[step];

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-40" style={{ maxWidth: 320 }}>
      <div
        className="pointer-events-auto p-4"
        style={{ borderRadius: "var(--radius-lg)", border: "1px solid rgba(245,179,1,0.4)", background: "var(--panel)", boxShadow: "var(--shadow-2)" }}
      >
        <div className="flex items-center justify-between">
          <span className="wl-label" style={{ color: "var(--amber-text)" }}>Tutorial · {step + 1}/{STEPS.length}</span>
          <button onClick={() => set("tutorialDone", true)} style={{ fontSize: "11px", color: "var(--text-muted)" }}>Skip ✕</button>
        </div>
        <div className="wl-title mt-1" style={{ fontSize: "15px", color: "var(--text-hi)" }}>{s.title}</div>
        <p className="mt-1.5" style={{ fontSize: "12px", lineHeight: 1.45, color: "var(--text-lo)" }}>{s.body}</p>
        <div className="mt-2 flex gap-1.5">
          {STEPS.map((_, i) => (
            <span key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= step ? "var(--amber)" : "var(--surface-sunken)" }} />
          ))}
        </div>
        {step === STEPS.length - 1 && (
          <Button variant="primary" size="sm" full className="mt-3" onClick={() => set("tutorialDone", true)}>Got it — let me play</Button>
        )}
      </div>
    </div>
  );
}
