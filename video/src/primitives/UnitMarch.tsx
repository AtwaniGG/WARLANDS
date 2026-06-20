import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";

/** A column of stylized troop markers marching from fromX → toX with a bob. */
export const UnitMarch: React.FC<{
  count?: number;
  startFrame?: number;
  durationInFrames?: number;
  fromX: number;
  toX: number;
  y: number;
  color?: string;
  scale?: number;
}> = ({
  count = 6,
  startFrame = 0,
  durationInFrames = 70,
  fromX,
  toX,
  y,
  color = COLORS.amber,
  scale = 1,
}) => {
  const frame = useCurrentFrame();
  const dir = Math.sign(toX - fromX) || 1;

  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const delay = startFrame + i * 4;
        const p = interpolate(frame - delay, [0, durationInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const x = interpolate(p, [0, 1], [fromX - i * 26 * dir, toX - i * 18 * dir]);
        const bob = Math.sin((frame - delay) * 0.5) * 3 * (p > 0 && p < 1 ? 1 : 0);
        const op = interpolate(p, [0, 0.06, 0.9, 1], [0, 1, 1, 0.85]);
        const s = 14 * scale;
        return (
          <g key={i} transform={`translate(${x} ${y + bob})`} opacity={op}>
            {/* shadow */}
            <ellipse cx={0} cy={s * 0.7} rx={s * 0.7} ry={s * 0.25} fill="rgba(0,0,0,0.35)" />
            {/* body */}
            <rect x={-s * 0.32} y={-s * 0.5} width={s * 0.64} height={s} rx={2} fill={color} />
            {/* helmet */}
            <circle cx={0} cy={-s * 0.6} r={s * 0.32} fill={color} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
            {/* forward chevron */}
            <polygon
              points={`${dir * s * 0.6},0 ${dir * s * 0.95},${-s * 0.28} ${dir * s * 0.95},${s * 0.28}`}
              fill={color}
              opacity={0.8}
            />
          </g>
        );
      })}
    </g>
  );
};
