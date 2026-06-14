"use client";

import { useMemo } from "react";
import { useGame } from "@/game/store";
import { axialToPixel, hexKey } from "@/game/world";
import { PLOT_TYPES } from "@/game/plotTypes";
import { empireIndex } from "@/game/empire";

const BOX = 150;

/** A scaled-down overview of the whole world, rendered as a corner overlay on the map. */
export function Minimap() {
  const world = useGame((s) => s.world);
  const plots = useGame((s) => s.plots);
  const npcs = useGame((s) => s.npcs);
  const empires = useGame((s) => s.empires);
  const empIdx = useMemo(() => empireIndex(empires), [empires]);

  const { dots, vb } = useMemo(() => {
    const list = Array.from(world.hexes.values());
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const placed = list.map((h) => {
      const { x, y } = axialToPixel(h.q, h.r, 3);
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      return { h, x, y };
    });
    return { dots: placed, vb: { minX, minY, w: maxX - minX, h: maxY - minY } };
  }, [world]);

  return (
    <div
      className="pointer-events-none absolute bottom-3 right-3"
      style={{ width: BOX, height: BOX, borderRadius: "var(--radius-md)", border: "1px solid var(--hairline)", background: "rgba(0,0,0,0.55)", padding: 6 }}
    >
      <svg width="100%" height="100%" viewBox={`${vb.minX - 2} ${vb.minY - 2} ${vb.w + 4} ${vb.h + 4}`}>
        {dots.map(({ h, x, y }) => {
          const key = hexKey(h.q, h.r);
          const owned = plots[key];
          const empId = empIdx[key];
          const npc = npcs[key];
          const npcActive = npc && npc.defeatedAtTick === null;
          const fill = owned
            ? "var(--rim-owned)"
            : empId
              ? empires[empId].color
              : npcActive
                ? "var(--rim-enemy)"
                : PLOT_TYPES[h.terrain].color;
          const r = owned || empId || npcActive ? 2 : 1.2;
          return <circle key={key} cx={x} cy={y} r={r} fill={fill} fillOpacity={owned || empId || npcActive ? 1 : 0.5} />;
        })}
      </svg>
      <div className="wl-label" style={{ position: "absolute", top: 8, left: 10, fontSize: "8px", color: "var(--text-muted)" }}>Minimap</div>
    </div>
  );
}
