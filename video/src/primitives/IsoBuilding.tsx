import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { isoPos, Pt, shade, TILE_H, TILE_W } from "./iso";

export type BuildingKind =
  | "hq"
  | "extractor"
  | "factory"
  | "barracks"
  | "storage";

type Spec = { h: number; base: string; accent: string; lit: boolean; fw: number };

const SPECS: Record<BuildingKind, Spec> = {
  hq: { h: 84, base: COLORS.gunmetal, accent: COLORS.amber, lit: true, fw: 0.64 },
  factory: { h: 54, base: COLORS.terrainIndustrial, accent: COLORS.teal, lit: true, fw: 0.7 },
  extractor: { h: 46, base: COLORS.ash, accent: COLORS.toxic, lit: true, fw: 0.58 },
  barracks: { h: 40, base: COLORS.oliveDrab, accent: COLORS.blood, lit: false, fw: 0.74 },
  storage: { h: 38, base: COLORS.dirtBrown, accent: COLORS.terrainDesert, lit: false, fw: 0.6 },
};

/** Parametric isometric building. Pops up from the ground (spring) at appearAtFrame. */
export const IsoBuilding: React.FC<{
  kind: BuildingKind;
  col: number;
  row: number;
  origin: Pt;
  appearAtFrame?: number;
  scale?: number;
}> = ({ kind, col, row, origin, appearAtFrame = 0, scale = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spec = SPECS[kind];
  const { x: cx, y: cy } = isoPos(col, row, origin);

  const s = spring({
    frame: frame - appearAtFrame,
    fps,
    config: { damping: 12, stiffness: 130, mass: 0.7 },
  });
  if (s <= 0.001) return null;

  const bw = TILE_W * spec.fw * scale;
  const bh = TILE_H * spec.fw * scale;
  const h = spec.h * scale * s; // grows from ground
  const hw = bw / 2;
  const hh = bh / 2;

  const top = shade(spec.base, 1.22);
  const right = shade(spec.base, 0.9);
  const left = shade(spec.base, 0.62);

  // faces
  const leftFace = `${cx - hw},${cy} ${cx},${cy + hh} ${cx},${cy + hh - h} ${cx - hw},${cy - h}`;
  const rightFace = `${cx},${cy + hh} ${cx + hw},${cy} ${cx + hw},${cy - h} ${cx},${cy + hh - h}`;
  const topFace = `${cx},${cy - hh - h} ${cx + hw},${cy - h} ${cx},${cy + hh - h} ${cx - hw},${cy - h}`;

  return (
    <g opacity={Math.min(1, s * 1.4)}>
      {/* ground shadow */}
      <ellipse cx={cx} cy={cy + hh * 0.5} rx={hw * 1.05} ry={hh * 0.6} fill="rgba(0,0,0,0.4)" />
      <polygon points={leftFace} fill={left} />
      <polygon points={rightFace} fill={right} />
      <polygon points={topFace} fill={top} stroke={shade(spec.base, 1.4)} strokeWidth={1} />

      {/* lit windows on the right face */}
      {spec.lit &&
        [0.3, 0.6].map((fy, r) =>
          [0.35, 0.65].map((fx, c) => (
            <rect
              key={`${r}-${c}`}
              x={cx + fx * hw - 4}
              y={cy - h + fy * h - 4}
              width={7}
              height={9}
              fill={spec.accent}
              opacity={0.85}
            />
          ))
        )}

      {/* roof accent strip */}
      <polygon
        points={`${cx},${cy - hh - h} ${cx + hw * 0.5},${cy - hh * 0.5 - h} ${cx},${cy - h} ${cx - hw * 0.5},${cy - hh * 0.5 - h}`}
        fill={spec.accent}
        opacity={0.55}
      />

      {/* HQ gets a beacon mast */}
      {kind === "hq" && (
        <>
          <line x1={cx} y1={cy - h} x2={cx} y2={cy - h - 30 * scale} stroke={shade(spec.base, 1.3)} strokeWidth={3} />
          <circle cx={cx} cy={cy - h - 30 * scale} r={5} fill={spec.accent} style={{ filter: `drop-shadow(0 0 6px ${spec.accent})` }} />
        </>
      )}
      {/* extractor gets a derrick */}
      {kind === "extractor" && (
        <line x1={cx} y1={cy - h} x2={cx + 10} y2={cy - h - 26 * scale} stroke={shade(spec.base, 1.2)} strokeWidth={3} />
      )}
    </g>
  );
};
