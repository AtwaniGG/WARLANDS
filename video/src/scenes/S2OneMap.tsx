import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../primitives/Scene";
import { CaptionStack } from "../primitives/CaptionStack";
import { HUDChip } from "../primitives/HUDChip";
import { IsoTile, Rim } from "../primitives/IsoTile";
import { isoPos, Pt } from "../primitives/iso";
import { COLORS } from "../theme";

const GRID = 8;
const ORIGIN: Pt = { x: 960, y: 250 };

const OWNED = new Set(["3,3", "4,3", "3,4", "4,4", "2,3"]);
const ENEMY = new Set(["0,7", "1,7", "0,6", "7,0", "6,0", "7,1"]);
const SELECTED = "3,3";

const TERRAIN = [
  COLORS.terrainPlains,
  COLORS.oliveDrab,
  COLORS.terrainForest,
  COLORS.terrainMountain,
  COLORS.dirtBrown,
];

function rimFor(col: number, row: number): Rim {
  const k = `${col},${row}`;
  if (k === SELECTED) return "selected";
  if (OWNED.has(k)) return "owned";
  if (ENEMY.has(k)) return "enemy";
  return "neutral";
}

/** S2 — One live map: finite land, stake $WAR to claim it. */
export const S2OneMap: React.FC = () => {
  const frame = useCurrentFrame();

  // slow camera push-in
  const scale = interpolate(frame, [0, 180], [0.82, 1.08], { extrapolateRight: "clamp" });
  const drift = interpolate(frame, [0, 180], [30, -20], { extrapolateRight: "clamp" });

  // stake pulse on the selected tile
  const sel = isoPos(3, 3, ORIGIN);
  const pulseT = interpolate(frame, [64, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const tiles: React.ReactNode[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const dist = Math.abs(col - 3) + Math.abs(row - 3);
      tiles.push(
        <IsoTile
          key={`${col},${row}`}
          col={col}
          row={row}
          origin={ORIGIN}
          fill={TERRAIN[(col * 3 + row) % TERRAIN.length]}
          rim={rimFor(col, row)}
          glow={OWNED.has(`${col},${row}`) || ENEMY.has(`${col},${row}`)}
          appearAtFrame={6 + dist * 3}
        />
      );
    }
  }

  return (
    <Scene label="GLOBAL THEATER // ONE SHARED MAP" intensity={0.8}>
      <AbsoluteFill
        style={{
          transform: `translateY(${drift}px) scale(${scale})`,
          transformOrigin: "50% 45%",
        }}
      >
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {tiles}
          {/* stake pulse rings */}
          {pulseT > 0 && pulseT < 1 && (
            <>
              <circle cx={sel.x} cy={sel.y} r={20 + pulseT * 120} fill="none" stroke={COLORS.amber} strokeWidth={3} opacity={(1 - pulseT) * 0.9} />
              <circle cx={sel.x} cy={sel.y} r={10 + pulseT * 70} fill="none" stroke={COLORS.amber} strokeWidth={2} opacity={(1 - pulseT) * 0.7} />
            </>
          )}
        </svg>
      </AbsoluteFill>

      {/* stake callout chip */}
      <div style={{ position: "absolute", top: 150, right: 120, opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <HUDChip label="Plot claimed" value="STAKE 250 $WAR" accent={COLORS.amber} />
      </div>
      <div style={{ position: "absolute", top: 150, left: 120, opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <HUDChip label="Contested" value="1,024 PLAYERS" accent={COLORS.bloodStrong} />
      </div>

      <CaptionStack
        kicker="One live map"
        startFrame={40}
        lines={[
          { text: "Finite land.", size: 60 },
          { text: "Stake $WAR to claim it.", size: 60, accent: COLORS.amber },
        ]}
      />
    </Scene>
  );
};
