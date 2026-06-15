"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import { useGame, WORLD_RADIUS } from "@/game/store";
import { axialToPixel, hexKey, zoneForRing, type Hex } from "@/game/world";
import { PLOT_TYPES } from "@/game/plotTypes";
import { empireIndex } from "@/game/empire";
import { terrainArt, TERRAIN_PROBE } from "@/game/assets";
import { useImageReady } from "./Sprite";
import { Minimap } from "./Minimap";

const HEX_SIZE = 26;

function hexPoints(cx: number, cy: number, size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 90); // pointy-top
    pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

export function HexMap() {
  const world = useGame((s) => s.world);
  const plots = useGame((s) => s.plots);
  const npcs = useGame((s) => s.npcs);
  const empires = useGame((s) => s.empires);
  const selected = useGame((s) => s.selectedHex);
  const select = useGame((s) => s.select);

  const empIdx = useMemo(() => empireIndex(empires), [empires]);
  const terrainReady = useImageReady(TERRAIN_PROBE) === "ok";

  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragging = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const { hexes, bounds } = useMemo(() => {
    const list = Array.from(world.hexes.values());
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const placed = list.map((h) => {
      const { x, y } = axialToPixel(h.q, h.r, HEX_SIZE);
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      return { hex: h, x, y };
    });
    return { hexes: placed, bounds: { minX, minY, maxX, maxY } };
  }, [world]);

  const width = bounds.maxX - bounds.minX + HEX_SIZE * 4;
  const height = bounds.maxY - bounds.minY + HEX_SIZE * 4;
  const offX = -bounds.minX + HEX_SIZE * 2;
  const offY = -bounds.minY + HEX_SIZE * 2;

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setView((v) => ({ ...v, scale: Math.min(2.5, Math.max(0.5, v.scale - e.deltaY * 0.001)) }));
  }, []);

  const onDown = (e: React.MouseEvent) => {
    dragging.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
    setIsDragging(true);
  };
  const onMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const d = dragging.current;
    setView((v) => ({ ...v, x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) }));
  };
  const onUp = () => { dragging.current = null; setIsDragging(false); };

  // ---- touch: one-finger pan, two-finger pinch-zoom ----
  const touch = useRef<{ mode: "pan" | "pinch"; sx: number; sy: number; ox: number; oy: number; d0: number; s0: number } | null>(null);
  const tdist = (a: React.Touch, b: React.Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touch.current = { mode: "pan", sx: t.clientX, sy: t.clientY, ox: view.x, oy: view.y, d0: 0, s0: view.scale };
    } else if (e.touches.length === 2) {
      touch.current = { mode: "pinch", sx: 0, sy: 0, ox: view.x, oy: view.y, d0: tdist(e.touches[0], e.touches[1]), s0: view.scale };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const t = touch.current;
    if (!t) return;
    if (t.mode === "pan" && e.touches.length === 1) {
      const p = e.touches[0];
      setView((v) => ({ ...v, x: t.ox + (p.clientX - t.sx), y: t.oy + (p.clientY - t.sy) }));
    } else if (t.mode === "pinch" && e.touches.length === 2) {
      const d = tdist(e.touches[0], e.touches[1]);
      setView((v) => ({ ...v, scale: Math.min(2.5, Math.max(0.5, t.s0 * (d / (t.d0 || 1)))) }));
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => { if (e.touches.length === 0) touch.current = null; };
  const zoomBy = (f: number) => setView((v) => ({ ...v, scale: Math.min(2.5, Math.max(0.5, v.scale * f)) }));
  const resetView = () => setView({ x: 0, y: 0, scale: 1 });

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "var(--panel-void)", touchAction: "none" }}
      onWheel={onWheel}
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`, cursor: isDragging ? "grabbing" : "grab" }}
        className="select-none transition-transform duration-75"
      >
        <defs>
          <clipPath id="wl-hexclip" clipPathUnits="userSpaceOnUse">
            <polygon points={hexPoints(0, 0, HEX_SIZE - 1)} />
          </clipPath>
        </defs>
        {hexes.map(({ hex, x, y }) => {
          const key = hexKey(hex.q, hex.r);
          const owned = plots[key];
          const npc = npcs[key];
          const npcActive = npc && npc.defeatedAtTick === null;
          const empId = empIdx[key];
          const empire = empId ? empires[empId] : undefined;
          const def = PLOT_TYPES[hex.terrain];
          const isSel = selected === key;
          const zone = zoneForRing(hex.ring, WORLD_RADIUS);
          const cx = x + offX;
          const cy = y + offY;
          const stroke = isSel
            ? "var(--rim-selected)"
            : owned
              ? "var(--rim-owned)"
              : empire
                ? empire.color
                : npcActive
                  ? "var(--rim-enemy)"
                  : "var(--rim-neutral)";
          return (
            <g key={key} onClick={(e) => { e.stopPropagation(); select(key); }} style={{ cursor: "pointer" }}>
              {terrainReady && (
                <g transform={`translate(${cx},${cy})`} clipPath="url(#wl-hexclip)">
                  <image
                    href={terrainArt(hex.terrain)}
                    x={-HEX_SIZE}
                    y={-HEX_SIZE}
                    width={HEX_SIZE * 2}
                    height={HEX_SIZE * 2}
                    preserveAspectRatio="xMidYMid slice"
                  />
                </g>
              )}
              <polygon
                points={hexPoints(cx, cy, HEX_SIZE - 1)}
                strokeWidth={isSel ? 3 : owned || npcActive || empire ? 2 : 1}
                style={{
                  fill: empire ? empire.color : def.color,
                  // With real terrain art, only tint for ownership/empire; otherwise fill with terrain color.
                  fillOpacity: terrainReady ? (owned ? 0 : empire ? 0.4 : 0) : owned ? 1 : empire ? 0.78 : 0.62,
                  stroke,
                }}
              />
              {owned && (
                <text x={cx} y={cy + 5} textAnchor="middle" fontSize={16} pointerEvents="none">
                  🏕️
                </text>
              )}
              {!owned && empire && (
                <text x={cx} y={cy + 5} textAnchor="middle" fontSize={13} pointerEvents="none">
                  {empire.banner}
                </text>
              )}
              {!owned && !empire && npcActive && (
                <text x={cx} y={cy + 5} textAnchor="middle" fontSize={14} pointerEvents="none">
                  💀
                </text>
              )}
              {zone === "crucible" && !owned && !npcActive && !empire && (
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fillOpacity={0.5} fill="#fff" pointerEvents="none">
                  ⚔
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="pointer-events-none absolute left-3 top-3 px-3 py-2" style={{ borderRadius: "var(--radius-md)", background: "rgba(0,0,0,0.6)", fontSize: "12px", color: "var(--text-secondary)" }}>
        <div className="wl-title" style={{ fontSize: "13px", color: "var(--amber-text)" }}>Live World Map</div>
        <div>Drag or pinch to explore · tap a hex</div>
        <div className="mt-1 flex gap-2" style={{ fontSize: "10px", color: "var(--text-muted)" }}>
          <span>⚔ Crucible (center, high risk)</span>
          <span>· edge = newbie ring</span>
        </div>
      </div>

      {/* zoom controls (touch-friendly) */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
        <button onClick={() => zoomBy(1.3)} aria-label="Zoom in" style={zoomBtnStyle}>＋</button>
        <button onClick={() => zoomBy(1 / 1.3)} aria-label="Zoom out" style={zoomBtnStyle}>－</button>
        <button onClick={resetView} aria-label="Reset view" style={{ ...zoomBtnStyle, fontSize: "15px" }}>⟳</button>
      </div>

      <Minimap />
    </div>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  display: "grid",
  placeItems: "center",
  borderRadius: "var(--radius-md)",
  background: "rgba(0,0,0,0.62)",
  border: "1px solid var(--hairline)",
  color: "var(--amber-text)",
  fontSize: "20px",
  fontWeight: 700,
  lineHeight: 1,
  cursor: "pointer",
  touchAction: "manipulation",
};

export type { Hex };
