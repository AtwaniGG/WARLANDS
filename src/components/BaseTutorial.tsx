"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { Panel } from "@/components/ui";
import { BUILDINGS, type CocBase } from "@/sim/coc";

function currentStep(base: CocBase | null): { n: number; total: number; title: string; tip: string } | null {
  const total = 5;
  if (!base) return { n: 1, total, title: "CLAIM YOUR GROUND", tip: "Tap an unclaimed hex with all six neighbours free to stake your Command Center and the ring around it." };
  const has = (cat: string) => Object.values(base.buildings).some((b) => BUILDINGS[b.id].category === cat);
  if (!has("collector")) return { n: 2, total, title: "BUILD A COLLECTOR", tip: "Tap an owned empty hex → Resources → build a Gold or Elixir collector. It fills over time; tap COLLECT to bank it." };
  if (!has("storage")) return { n: 3, total, title: "RAISE A STORAGE", tip: "Storages lift your resource cap. Build one on an empty hex from the Resources group." };
  if (!has("defense")) return { n: 4, total, title: "RAISE A DEFENSE", tip: "Build a Cannon from the Defense group. Defenses stand inert until raids arrive in a later update." };
  if (Object.keys(base.walls).length === 0) return { n: 5, total, title: "WALL IT OFF", tip: "Toggle WALL MODE, then tap two adjacent owned hexes to raise a wall on their shared edge." };
  return null;
}

/**
 * Onboarding coachmark. Shows the full card while you still need to CLAIM (no base);
 * once you have a base it auto-collapses to a compact "NEXT: …" chip so it never
 * covers the map — tap the chip to re-expand the full tip for the current objective.
 */
export function BaseTutorial({ base }: { base: CocBase | null }) {
  const [expanded, setExpanded] = useState(true);
  const hasBase = !!base;
  // Collapse to the chip the moment a base exists; nothing to guide on the map until then.
  useEffect(() => { setExpanded(!hasBase); }, [hasBase]);

  const s = currentStep(base);
  if (!s) return null;

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} style={chip} aria-label="Show next objective">
        ❔ NEXT · {s.title}
      </button>
    );
  }
  return (
    <div style={wrap}>
      <Panel
        rim="amber"
        label={`ORDERS · ${s.n}/${s.total}`}
        padding="10px 12px"
        headerRight={<button onClick={() => setExpanded(false)} aria-label="Collapse" style={x}>✕</button>}
      >
        <div className="wl-title" style={{ fontSize: 14, marginBottom: 4 }}>{s.title}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>{s.tip}</div>
      </Panel>
    </div>
  );
}

const wrap: CSSProperties = { position: "fixed", left: 12, right: 12, bottom: "max(12px, env(safe-area-inset-bottom))", maxWidth: 560, margin: "0 auto", zIndex: 50 };
const x: CSSProperties = { background: "transparent", border: 0, color: "var(--text-secondary)", cursor: "pointer", fontSize: 13 };
const chip: CSSProperties = { position: "fixed", right: 12, bottom: "max(12px, env(safe-area-inset-bottom))", zIndex: 50, maxWidth: "calc(100vw - 24px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", background: "var(--cta-bg)", color: "var(--cta-fg)", border: 0, borderRadius: "var(--radius-pill)", padding: "8px 14px", fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.06em", fontSize: 12, cursor: "pointer", boxShadow: "var(--shadow-2)" };
