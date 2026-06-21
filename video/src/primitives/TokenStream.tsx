import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";

type XY = { x: number; y: number };

/** $HEXAR coins arc from `from` → `to`, staggered. Used for loot / payout. */
export const TokenStream: React.FC<{
  from: XY;
  to: XY;
  count?: number;
  startFrame?: number;
  step?: number;
  durationInFrames?: number;
  size?: number;
  color?: string;
}> = ({
  from,
  to,
  count = 10,
  startFrame = 0,
  step = 3,
  durationInFrames = 40,
  size = 16,
  color = COLORS.amber,
}) => {
  const frame = useCurrentFrame();

  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const delay = startFrame + i * step;
        const p = interpolate(frame - delay, [0, durationInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        if (p <= 0 || p >= 1) return null;
        // lateral arc
        const arc = Math.sin(p * Math.PI) * (60 + (i % 3) * 24);
        const x = interpolate(p, [0, 1], [from.x, to.x]) + (i % 2 === 0 ? arc : -arc);
        const y = interpolate(p, [0, 1], [from.y, to.y]) - Math.sin(p * Math.PI) * 70;
        const op = interpolate(p, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);
        const spin = (frame - delay) * 18;
        return (
          <g key={i} transform={`translate(${x} ${y})`} opacity={op}>
            <g transform={`scale(${interpolate(Math.cos((spin * Math.PI) / 180), [-1, 1], [0.4, 1])} 1)`}>
              <circle r={size / 2} fill={color} stroke="rgba(0,0,0,0.35)" strokeWidth={1.5} />
              <circle r={size / 2 - 3} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={1} />
              <text
                x={0}
                y={size * 0.18}
                fontSize={size * 0.6}
                fontWeight={800}
                textAnchor="middle"
                fill="#0c0a04"
                fontFamily="Oswald, sans-serif"
              >
                H
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
};
