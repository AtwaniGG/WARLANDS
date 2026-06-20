import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

/**
 * Military HUD atmosphere: faint grid, vignette, and a sweeping amber scan line.
 * Purely decorative; sits above scene content.
 */
export const ScanlineOverlay: React.FC<{
  intensity?: number;
  sweep?: boolean;
}> = ({ intensity = 1, sweep = true }) => {
  const frame = useCurrentFrame();
  const { height, durationInFrames } = useVideoConfig();

  const sweepY = interpolate(
    frame % 120,
    [0, 120],
    [-0.1 * height, 1.1 * height],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* faint grid */}
      <AbsoluteFill
        style={{
          opacity: 0.06 * intensity,
          backgroundImage: `linear-gradient(${COLORS.textLo} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.textLo} 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />
      {/* horizontal scanlines */}
      <AbsoluteFill
        style={{
          opacity: 0.05 * intensity,
          backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 4px)`,
        }}
      />
      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {/* sweeping amber line */}
      {sweep && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: sweepY,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${COLORS.amber}, transparent)`,
            opacity: 0.35 * intensity,
            boxShadow: `0 0 18px ${COLORS.amber}`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
