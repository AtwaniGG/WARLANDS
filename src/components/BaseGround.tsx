"use client";
import { useMemo, type ReactElement } from "react";

/** Deterministic PRNG so each village's terrain is fixed (never reshuffles on tick/zoom). */
function mulberry32(a: number): () => number {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) || 1;
}

/**
 * War-camp battlefield decor for the MY BASE / scout grid: a recon-satellite read of
 * cracked dirt scarred by craters, scorch, oil, rubble, scrub, sandbag emplacements and
 * tracked-vehicle ruts. Pure SVG, seeded by the village location so it's stable and cheap.
 */
export function BaseGround({ seed, w, h }: { seed: string; w: number; h: number }) {
  const items = useMemo<ReactElement[]>(() => {
    const rnd = mulberry32(hashStr(seed));
    const rf = (a: number, b: number) => a + rnd() * (b - a);
    const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
    const px = () => rf(10, w - 10);
    const py = () => rf(10, h - 10);
    const out: ReactElement[] = [];
    let k = 0;

    // blast craters — sunken bowl + raised ash rim
    for (let i = 0; i < 4; i++) {
      const x = px(), y = py(), r = rf(11, 21);
      out.push(
        <g key={k++} transform={`translate(${x} ${y})`}>
          <ellipse rx={r} ry={r * 0.68} fill="#07090d" opacity="0.55" />
          <ellipse rx={r} ry={r * 0.68} fill="none" stroke="#4b515c" strokeWidth="1.4" opacity="0.45" />
          <ellipse rx={r * 0.55} ry={r * 0.38} fill="#0c1015" opacity="0.7" />
        </g>,
      );
    }
    // scorch smears
    for (let i = 0; i < 7; i++) {
      const x = px(), y = py(), r = rf(13, 27);
      out.push(<ellipse key={k++} cx={x} cy={y} rx={r} ry={r * 0.78} fill="#06080b" opacity={rf(0.08, 0.18)} />);
    }
    // oil spills with a faint sheen
    for (let i = 0; i < 2; i++) {
      const x = px(), y = py(), r = rf(9, 15);
      out.push(
        <g key={k++} transform={`translate(${x} ${y})`}>
          <ellipse rx={r} ry={r * 0.6} fill="#04060a" opacity="0.72" />
          <ellipse cx={-r * 0.2} cy={-r * 0.15} rx={r * 0.38} ry={r * 0.18} fill="#26405a" opacity="0.45" />
        </g>,
      );
    }
    // rubble / rocks
    for (let i = 0; i < 13; i++) {
      const x = px(), y = py(), s = rf(2.5, 5.5), rot = rf(0, 360);
      const pts = `${-s},${s * 0.5} ${-s * 0.4},${-s} ${s * 0.7},${-s * 0.5} ${s},${s * 0.6} 0,${s}`;
      out.push(
        <g key={k++} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <polygon points={pts} fill="#3b424c" />
          <polygon points={pts} fill="none" stroke="#171b22" strokeWidth="0.5" />
        </g>,
      );
    }
    // scrub tufts (olive drab)
    for (let i = 0; i < 18; i++) {
      const x = px(), y = py();
      out.push(
        <g key={k++} transform={`translate(${x} ${y})`} stroke="#49512f" strokeWidth="1" strokeLinecap="round" opacity="0.7">
          <line x1="0" y1="0" x2="-2.4" y2="-5" /><line x1="0" y1="0" x2="0" y2="-6.5" /><line x1="0" y1="0" x2="2.4" y2="-5" />
        </g>,
      );
    }
    // sandbag emplacements — short defensive rows
    for (let i = 0; i < 3; i++) {
      const x = px(), y = py(), rot = rf(0, 360), n = ri(3, 5);
      const bags: ReactElement[] = [];
      for (let j = 0; j < n; j++) bags.push(<rect key={j} x={j * 7 - 2} y={-3} width="8.5" height="6" rx="3" fill="#7a6233" stroke="#46380f" strokeWidth="0.6" />);
      out.push(<g key={k++} transform={`translate(${x} ${y}) rotate(${rot})`} opacity="0.85">{bags}</g>);
    }
    // tracked-vehicle ruts
    for (let i = 0; i < 2; i++) {
      const x = px(), y = py(), rot = rf(0, 360), len = rf(45, 85);
      out.push(
        <g key={k++} transform={`translate(${x} ${y}) rotate(${rot})`} stroke="#1b2029" strokeWidth="1.4" strokeDasharray="3 4" opacity="0.5">
          <line x1="0" y1="-3" x2={len} y2="-3" /><line x1="0" y1="3" x2={len} y2="3" />
        </g>,
      );
    }
    return out;
  }, [seed, w, h]);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden>
      {items}
    </svg>
  );
}
