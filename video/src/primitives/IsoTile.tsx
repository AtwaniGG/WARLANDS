import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { diamond, isoPos, Pt, shade, TILE_H, TILE_W } from "./iso";

export type Rim = "owned" | "enemy" | "neutral" | "selected" | "none";

const RIM: Record<Rim, string | null> = {
  owned: COLORS.rimOwned,
  enemy: COLORS.rimEnemy,
  neutral: COLORS.rimNeutral,
  selected: COLORS.rimSelected,
  none: null,
};

/** A single isometric ground tile, optional ownership rim, pop-in animation. */
export const IsoTile: React.FC<{
  col: number;
  row: number;
  origin: Pt;
  fill?: string;
  rim?: Rim;
  appearAtFrame?: number;
  glow?: boolean;
}> = ({
  col,
  row,
  origin,
  fill = COLORS.oliveDrab,
  rim = "none",
  appearAtFrame = 0,
  glow = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { x, y } = isoPos(col, row, origin);

  const s = spring({
    frame: frame - appearAtFrame,
    fps,
    config: { damping: 18, stiffness: 140, mass: 0.6 },
  });
  if (s <= 0.001) return null;
  const drop = interpolate(s, [0, 1], [-22, 0]);
  const op = interpolate(s, [0, 1], [0, 1]);
  const rimColor = RIM[rim];

  return (
    <g transform={`translate(0 ${drop})`} opacity={op}>
      {/* side thickness for a little depth */}
      <polygon
        points={`${x - TILE_W / 2},${y} ${x},${y + TILE_H / 2} ${x + TILE_W / 2},${y} ${x + TILE_W / 2},${y + 10} ${x},${y + TILE_H / 2 + 10} ${x - TILE_W / 2},${y + 10}`}
        fill={shade(fill, 0.6)}
      />
      <polygon points={diamond(x, y)} fill={fill} stroke={shade(fill, 0.7)} strokeWidth={1} />
      {rimColor && (
        <polygon
          points={diamond(x, y, TILE_W - 8, TILE_H - 4)}
          fill="none"
          stroke={rimColor}
          strokeWidth={3}
          opacity={0.95}
          style={glow ? { filter: `drop-shadow(0 0 6px ${rimColor})` } : undefined}
        />
      )}
    </g>
  );
};
