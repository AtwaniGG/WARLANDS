import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene } from "../primitives/Scene";
import { CaptionStack } from "../primitives/CaptionStack";
import { ResourceCounter } from "../primitives/ResourceCounter";
import { COLORS, FONTS } from "../theme";

type Row = { name: string; start: number; end: number; score: number; you?: boolean };
const ROWS: Row[] = [
  { name: "IRON LEGION", start: 0, end: 1, score: 23100 },
  { name: "CRIMSON PACT", start: 1, end: 2, score: 19850 },
  { name: "NIGHT WARDENS", start: 2, end: 3, score: 17400 },
  { name: "YOU", start: 3, end: 0, score: 24900, you: true },
  { name: "RUST KINGS", start: 4, end: 4, score: 12200 },
];

const ROW_H = 70;
const PANEL = { x: 120, y: 250, w: 620 };

export const S5Earn: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const climb = interpolate(frame, [22, 74], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ease = spring({ frame: frame - 22, fps, config: { damping: 18, stiffness: 90 }, durationInFrames: 52 });

  return (
    <Scene label="SEASON 1 // STANDINGS" intensity={0.7}>
      {/* leaderboard panel */}
      <div
        style={{
          position: "absolute",
          left: PANEL.x,
          top: PANEL.y,
          width: PANEL.w,
          height: ROWS.length * ROW_H + 60,
          background: "rgba(12,16,24,0.86)",
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 12,
          opacity: interpolate(frame, [2, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <div style={{ padding: "16px 22px", fontFamily: FONTS.display, fontWeight: 700, fontSize: 16, letterSpacing: "0.2em", color: COLORS.textLo, textTransform: "uppercase", borderBottom: `1px solid ${COLORS.hairline}` }}>
          Leaderboard
        </div>
        <div style={{ position: "relative", height: ROWS.length * ROW_H, margin: "10px 0" }}>
          {ROWS.map((r, i) => {
            const slot = interpolate(ease, [0, 1], [r.start, r.end]);
            const rank = Math.round(slot) + 1;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 14,
                  right: 14,
                  top: slot * ROW_H,
                  height: ROW_H - 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  padding: "0 18px",
                  borderRadius: 8,
                  background: r.you ? "rgba(245,179,1,0.14)" : "transparent",
                  border: r.you ? `1px solid ${COLORS.amber}` : `1px solid transparent`,
                }}
              >
                <span style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 26, color: rank === 1 ? COLORS.amber : COLORS.textLo, width: 44 }}>
                  {rank}
                </span>
                <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 24, letterSpacing: "0.06em", color: r.you ? COLORS.amber : COLORS.textHi, flex: 1, textTransform: "uppercase" }}>
                  {r.name}
                </span>
                <span style={{ fontFamily: FONTS.mono, fontSize: 22, color: COLORS.textHi }}>
                  {r.you
                    ? Math.round(interpolate(climb, [0, 1], [8400, r.score])).toLocaleString("en-US")
                    : r.score.toLocaleString("en-US")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* right column */}
      <div style={{ position: "absolute", right: 130, top: 270, width: 560, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 30 }}>
        {/* big balance */}
        <div style={{ opacity: interpolate(frame, [20, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 16, letterSpacing: "0.24em", color: COLORS.textLo, textTransform: "uppercase", textAlign: "right" }}>
            $WAR earned this season
          </div>
          <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 96, color: COLORS.amber, lineHeight: 1.05, textAlign: "right" }}>
            {Math.round(interpolate(climb, [0, 1], [8400, 24900])).toLocaleString("en-US")}
          </div>
        </div>

        {/* allegiance + season chips */}
        <Chip label="Allegiance" value="IRON LEGION" accent={COLORS.sky} delay={48} frame={frame} />
        <Chip label="Season ends" value="04 : 12 : 55" accent={COLORS.tealText} delay={58} frame={frame} />

        {/* on-chain badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 20px",
            borderRadius: 999,
            background: "rgba(110,231,168,0.12)",
            border: `1px solid ${COLORS.toxic}`,
            opacity: spring({ frame: frame - 70, fps, config: { damping: 12 } }),
          }}
        >
          <span style={{ width: 12, height: 12, borderRadius: 999, background: COLORS.toxic, boxShadow: `0 0 10px ${COLORS.toxic}` }} />
          <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 18, letterSpacing: "0.18em", color: COLORS.toxic, textTransform: "uppercase" }}>
            Settled on-chain · Solana
          </span>
        </div>
      </div>

      <CaptionStack
        kicker="Earn"
        startFrame={84}
        lines={[
          { text: "Real tokens. Real seasons.", size: 56, accent: COLORS.amber },
        ]}
      />
    </Scene>
  );
};

const Chip: React.FC<{ label: string; value: string; accent: string; delay: number; frame: number }> = ({ label, value, accent, delay, frame }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "12px 20px",
      background: "rgba(12,16,24,0.86)",
      border: `1px solid ${COLORS.hairline}`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 8,
      opacity: interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    }}
  >
    <span style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 12, letterSpacing: "0.16em", color: COLORS.textLo, textTransform: "uppercase" }}>{label}</span>
    <span style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 22, color: COLORS.textHi }}>{value}</span>
  </div>
);
