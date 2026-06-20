import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";

/** WARLANDS wordmark + angular emblem. */
export const Logo: React.FC<{
  startFrame?: number;
  size?: number;
  withEmblem?: boolean;
}> = ({ startFrame = 0, size = 96, withEmblem = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 16, stiffness: 110, mass: 0.8 },
  });
  const rise = interpolate(s, [0, 1], [24, 0]);
  const glint = interpolate(frame - startFrame, [10, 28], [-0.3, 1.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      {withEmblem && (
        <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity: s }}>
          {/* shield */}
          <path
            d="M50 6 L86 20 L86 50 Q86 82 50 96 Q14 82 14 50 L14 20 Z"
            fill={COLORS.panel2}
            stroke={COLORS.amber}
            strokeWidth={4}
          />
          {/* crossed blades */}
          <line x1="32" y1="34" x2="68" y2="70" stroke={COLORS.amber} strokeWidth={5} strokeLinecap="round" />
          <line x1="68" y1="34" x2="32" y2="70" stroke={COLORS.amber} strokeWidth={5} strokeLinecap="round" />
          <circle cx="50" cy="52" r="7" fill={COLORS.amber} />
        </svg>
      )}
      <div
        style={{
          position: "relative",
          fontFamily: FONTS.display,
          fontWeight: 700,
          fontSize: size,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: COLORS.textHi,
          transform: `translateY(${rise}px)`,
          opacity: s,
          lineHeight: 1,
          textShadow: "0 6px 30px rgba(0,0,0,0.6)",
        }}
      >
        WAR<span style={{ color: COLORS.amber }}>LANDS</span>
        {/* glint sweep */}
        <span
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%)`,
            transform: `translateX(${glint * 100}%)`,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};
