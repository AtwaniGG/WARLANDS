import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene } from "../primitives/Scene";
import { CaptionStack } from "../primitives/CaptionStack";
import { Bar } from "../primitives/Bar";
import { ResourceCounter } from "../primitives/ResourceCounter";
import { IsoTile } from "../primitives/IsoTile";
import { IsoBuilding, BuildingKind } from "../primitives/IsoBuilding";
import { UnitMarch } from "../primitives/UnitMarch";
import { TokenStream } from "../primitives/TokenStream";
import { isoPos, Pt } from "../primitives/iso";
import { COLORS, FONTS } from "../theme";

const ORIGIN: Pt = { x: 1180, y: 300 };

const BUILDINGS: { kind: BuildingKind; col: number; row: number }[] = [
  { kind: "factory", col: 1, row: 0 },
  { kind: "hq", col: 1, row: 1 },
  { kind: "barracks", col: 0, row: 1 },
].sort((a, b) => a.col + a.row - (b.col + b.row));

const IMPACTS = [
  { col: 1, row: 1, at: 46 },
  { col: 0, row: 1, at: 58 },
  { col: 1, row: 0, at: 70 },
];

export const S4Raid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tiles: React.ReactNode[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      tiles.push(
        <IsoTile key={`${col},${row}`} col={col} row={row} origin={ORIGIN} fill={COLORS.terrainMountain} rim="enemy" glow appearAtFrame={col + row} />
      );
    }
  }

  const base = isoPos(1, 1, ORIGIN);

  // VICTORY stamp
  const stamp = spring({ frame: frame - 96, fps, config: { damping: 9, stiffness: 120, mass: 0.8 } });

  // red battle flash
  const flash = IMPACTS.reduce((acc, im) => {
    const f = interpolate(frame - im.at, [0, 6], [0.25, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return Math.max(acc, f);
  }, 0);

  return (
    <Scene label="RAID IN PROGRESS // ENEMY SECTOR" intensity={0.9} sweep={false}>
      <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 70% 40%, rgba(156,43,43,${0.18}) 0%, transparent 60%)` }} />
      <AbsoluteFill style={{ background: COLORS.bloodStrong, opacity: flash, mixBlendMode: "screen" }} />

      <AbsoluteFill style={{ transform: "translateY(60px)" }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {tiles}
          {BUILDINGS.map((b, i) => (
            <IsoBuilding key={i} {...b} origin={ORIGIN} appearAtFrame={0} scale={1.1} />
          ))}

          {/* impacts */}
          {IMPACTS.map((im, i) => {
            const p = interpolate(frame - im.at, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            if (p <= 0 || p >= 1) return null;
            const pos = isoPos(im.col, im.row, ORIGIN);
            return (
              <g key={i}>
                <circle cx={pos.x} cy={pos.y - 30} r={10 + p * 60} fill="none" stroke={COLORS.bloodStrong} strokeWidth={4} opacity={1 - p} />
                <circle cx={pos.x} cy={pos.y - 30} r={6 + p * 24} fill={COLORS.amber} opacity={(1 - p) * 0.8} />
              </g>
            );
          })}

          {/* your troops marching in from the left */}
          <UnitMarch count={7} startFrame={6} durationInFrames={64} fromX={240} toX={base.x - 150} y={base.y + 70} color={COLORS.amber} scale={1.25} />
          <UnitMarch count={5} startFrame={20} durationInFrames={64} fromX={180} toX={base.x - 220} y={base.y + 130} color={COLORS.oliveDrab} scale={1.15} />

          {/* loot streaming out to the balance chip */}
          <TokenStream from={base} to={{ x: 300, y: 880 }} count={14} startFrame={82} step={3} durationInFrames={44} size={20} />
        </svg>
      </AbsoluteFill>

      {/* enemy defense bars */}
      <div style={{ position: "absolute", top: 150, right: 110, display: "flex", flexDirection: "column", gap: 16, opacity: interpolate(frame, [20, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <Bar label="Enemy walls" value={0.08} color={COLORS.bloodStrong} startFrame={42} durationInFrames={48} drain width={300} />
        <Bar label="Garrison" value={0.0} color={COLORS.bloodText} startFrame={50} durationInFrames={44} drain width={300} />
      </div>

      {/* loot balance */}
      <div style={{ position: "absolute", bottom: 150, left: 110, display: "flex", alignItems: "center", gap: 14, padding: "16px 22px", background: "rgba(12,16,24,0.9)", border: `1px solid ${COLORS.hairline}`, borderLeft: `3px solid ${COLORS.amber}`, borderRadius: 10, opacity: interpolate(frame, [80, 92], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <ResourceCounter from={0} to={1840} startFrame={86} durationInFrames={40} label="$WAR looted" accent={COLORS.amber} glyph={<span style={{ width: 16, height: 16, borderRadius: 999, background: COLORS.amber }} />} />
      </div>

      {/* VICTORY stamp */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", pointerEvents: "none" }}>
        <div
          style={{
            transform: `rotate(-7deg) scale(${interpolate(stamp, [0, 1], [1.6, 1])})`,
            opacity: stamp,
            padding: "14px 46px",
            border: `5px solid ${COLORS.amber}`,
            borderRadius: 6,
            background: "rgba(12,16,24,0.6)",
          }}
        >
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 96, letterSpacing: "0.08em", color: COLORS.amber, lineHeight: 1 }}>
            VICTORY
          </div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 22, letterSpacing: "0.3em", color: COLORS.textHi, textAlign: "center" }}>
            RAID COMPLETE
          </div>
        </div>
      </AbsoluteFill>

      <CaptionStack
        kicker="Raid"
        startFrame={8}
        lines={[
          { text: "Raid rivals.", size: 60 },
          { text: "Take their $WAR.", size: 60, accent: COLORS.bloodText },
        ]}
      />
    </Scene>
  );
};
