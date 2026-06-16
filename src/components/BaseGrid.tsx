"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type WheelEvent as RWheelEvent } from "react";
import { BUILDINGS, GRID_W, GRID_H, footprintTiles, type CocBase, type CocBuildingId } from "@/sim/coc";

/** One grid cell, in stage pixels (zoom multiplies this). */
export const TILE = 30;

/** Resolve a building (+level for the Town Hall) to its vendored faux-iso SVG. */
export function buildingArt(id: CocBuildingId, level: number): string {
  if (id === "commandCenter") return `/assets/buildings/commandCenter${Math.min(5, Math.max(1, level || 1))}.svg`;
  const map: Record<Exclude<CocBuildingId, "commandCenter">, string> = {
    goldCollector: "goldMine",
    elixirCollector: "elixirCollector",
    goldStorage: "goldStorage",
    elixirStorage: "elixirStorage",
    cannon: "cannon",
    mortar: "mortar",
    airDefense: "airDefense",
    barracks: "barracks",
    armyCamp: "armyCamp",
    builderHut: "buildersHut",
    clanCastle: "clanCastle",
  };
  return `/assets/buildings/${map[id as Exclude<CocBuildingId, "commandCenter">]}.svg`;
}
export function wallArt(level: number): string {
  return `/assets/buildings/wall${Math.min(3, Math.max(1, level || 1))}.svg`;
}

export interface BaseGridProps {
  base: CocBase;
  tick: number;
  readOnly?: boolean;
  /** anchor tile of the selected building */
  selected?: string | null;
  /** build mode: a building queued for placement (ghost preview) */
  placing?: CocBuildingId | null;
  /** wall mode: tapping empty tiles drops a wall */
  wallMode?: boolean;
  /** move mode: relocating the building anchored here */
  moveFrom?: string | null;
  /** validity predicate for the placement/move ghost */
  canPlace?: (anchorKey: string, id: CocBuildingId) => boolean;
  /** tap on a building anchor (view/select); null when the tap missed all buildings */
  onSelectBuilding?: (anchor: string | null) => void;
  /** tap on a tile (used by build / wall / move-destination flows) */
  onTile?: (tileKey: string) => void;
}

function num(n: number): string {
  return Math.floor(n).toLocaleString();
}

export function BaseGrid({ base, tick, readOnly, selected, placing, wallMode, moveFrom, canPlace, onSelectBuilding, onTile }: BaseGridProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [ghost, setGhost] = useState<string | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pan = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const pinch = useRef<{ dist: number; scale: number } | null>(null);

  const stageW = GRID_W * TILE;
  const stageH = GRID_H * TILE;

  // Fit-to-width on mount.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const scale = Math.max(0.25, Math.min(1.2, Math.min(w / stageW, h / stageH)));
    setView({ x: (w - stageW * scale) / 2, y: (h - stageH * scale) / 2, scale });
  }, [stageW, stageH]);

  // tile under a client point, honoring the current pan/zoom
  const tileAt = useCallback((clientX: number, clientY: number): { tx: number; ty: number } | null => {
    const el = wrapRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const lx = (clientX - r.left - view.x) / view.scale;
    const ly = (clientY - r.top - view.y) / view.scale;
    const tx = Math.floor(lx / TILE);
    const ty = Math.floor(ly / TILE);
    if (tx < 0 || ty < 0 || tx >= GRID_W || ty >= GRID_H) return null;
    return { tx, ty };
  }, [view]);

  // building anchor occupying a tile (search footprints)
  const anchorAtTile = useCallback((key: string): string | null => {
    for (const [anchor, b] of Object.entries(base.buildings)) {
      if (footprintTiles(anchor, b.id).includes(key)) return anchor;
    }
    return null;
  }, [base.buildings]);

  const onPointerDown = (e: RPointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale };
      pan.current = null;
    } else {
      pan.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
    }
  };

  const onPointerMove = (e: RPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) {
      if ((placing || wallMode || moveFrom) && !readOnly) {
        const t = tileAt(e.clientX, e.clientY);
        setGhost(t ? `${t.tx},${t.ty}` : null);
      }
      return;
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const next = Math.max(0.3, Math.min(2.4, pinch.current.scale * (dist / pinch.current.dist)));
      setView((v) => ({ ...v, scale: next }));
      return;
    }
    if (pan.current) {
      const dx = e.clientX - pan.current.x;
      const dy = e.clientY - pan.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) pan.current.moved = true;
      setView((v) => ({ ...v, x: pan.current!.vx + dx, y: pan.current!.vy + dy }));
    }
  };

  const onPointerUp = (e: RPointerEvent) => {
    const wasPanning = pan.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (wasPanning && !wasPanning.moved) {
      const t = tileAt(e.clientX, e.clientY);
      if (t) {
        const key = `${t.tx},${t.ty}`;
        if (!readOnly && (placing || wallMode || moveFrom)) {
          onTile?.(key);
        } else {
          onSelectBuilding?.(anchorAtTile(key));
        }
      } else if (!placing && !wallMode && !moveFrom) {
        onSelectBuilding?.(null);
      }
    }
    pan.current = null;
    if (pointers.current.size === 0) setGhost(null);
  };

  const onWheel = (e: RWheelEvent) => {
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    setView((v) => ({ ...v, scale: Math.max(0.3, Math.min(2.4, v.scale * factor)) }));
  };

  const jobByTile = new Map(base.jobs.map((j) => [j.tileKey, j]));

  return (
    <div
      ref={wrapRef}
      style={wrap}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      <div className="wl-scanline" style={{ opacity: 0.5 }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: stageW, height: stageH, transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`, transformOrigin: "0 0" }}>
        {/* ground + placement grid */}
        <div style={{ position: "absolute", inset: 0, background: "var(--bb-earth)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: gridLines, backgroundSize: `${TILE}px ${TILE}px` }} />

        {/* walls */}
        {Object.entries(base.walls).map(([key, level]) => {
          const [x, y] = key.split(",").map(Number);
          return (
            <img key={`w${key}`} src={wallArt(level)} alt="wall" draggable={false}
              style={{ position: "absolute", left: x * TILE, top: y * TILE, width: TILE, height: TILE, pointerEvents: "none" }} />
          );
        })}

        {/* buildings */}
        {Object.entries(base.buildings).map(([anchor, b]) => {
          const [x, y] = anchor.split(",").map(Number);
          const def = BUILDINGS[b.id];
          const { w, h } = def.footprint;
          const job = jobByTile.get(anchor);
          const remaining = job ? Math.max(0, job.finishesAtTick - tick) : 0;
          const isSel = selected === anchor || moveFrom === anchor;
          const constructing = b.level < 1 || !!job;
          const range = def.category === "defense" && isSel ? def.levels[Math.max(0, b.level - 1)]?.range : undefined;
          const buffer = def.category === "collector" && b.level >= 1 ? b.buffer ?? 0 : 0;
          return (
            <div key={anchor} style={{ position: "absolute", left: x * TILE, top: y * TILE, width: w * TILE, height: h * TILE }}>
              {range != null && (
                <div style={{ position: "absolute", left: "50%", top: "50%", width: range * 2 * TILE, height: range * 2 * TILE, transform: "translate(-50%,-50%)", borderRadius: "50%", border: "1px dashed var(--bb-range-line)", background: "var(--bb-range-fill)", pointerEvents: "none" }} />
              )}
              <img src={buildingArt(b.id, b.level)} alt={def.name} draggable={false}
                style={{ width: "100%", height: "100%", display: "block", filter: "drop-shadow(var(--bb-shadow))", opacity: moveFrom === anchor ? 0.5 : 1 }} />
              {constructing && (
                <>
                  <div style={{ position: "absolute", inset: "6%", border: "1.5px dashed var(--amber)", borderRadius: 6, background: "var(--bb-build-tint)", pointerEvents: "none" }} />
                  {job && (
                    <div style={{ position: "absolute", left: "50%", bottom: -9, transform: "translateX(-50%)", padding: "1px 6px", borderRadius: 4, background: "#0c1018", border: "1px solid rgba(245,179,1,0.4)", font: "600 9px var(--font-mono)", color: "var(--amber-text)", whiteSpace: "nowrap" }}>{remaining}s</div>
                  )}
                </>
              )}
              {b.level >= 1 && b.id !== "builderHut" && (
                <div style={badge}>{b.level}</div>
              )}
              {buffer > 0 && !job && (
                <div className="wl-glow" style={collectBubble}>
                  <span style={{ width: 8, height: 8, background: def.produces === "gold" ? "#0c0a04" : "var(--teal)", transform: def.produces === "gold" ? "rotate(45deg)" : undefined, borderRadius: def.produces === "gold" ? 0 : "50%", display: "block" }} />
                  {num(buffer)}
                </div>
              )}
              {isSel && (["tl", "tr", "bl", "br"] as const).map((c) => <span key={c} style={bracket(c)} />)}
            </div>
          );
        })}

        {/* placement / wall / move ghost */}
        {ghost && (placing || wallMode || moveFrom) && (() => {
          const id: CocBuildingId | null = placing ?? (moveFrom ? base.buildings[moveFrom]?.id ?? null : null);
          const { w, h } = wallMode ? { w: 1, h: 1 } : id ? BUILDINGS[id].footprint : { w: 1, h: 1 };
          const [gx, gy] = ghost.split(",").map(Number);
          const valid = wallMode ? !canPlace || canPlace(ghost, "builderHut") : id ? !canPlace || canPlace(ghost, id) : false;
          return (
            <div style={{ position: "absolute", left: gx * TILE, top: gy * TILE, width: w * TILE, height: h * TILE, background: valid ? "var(--bb-valid)" : "var(--bb-invalid)", border: `2px solid ${valid ? "var(--bb-valid-line)" : "var(--bb-invalid-line)"}`, borderRadius: 4, pointerEvents: "none" }} />
          );
        })()}
      </div>
    </div>
  );
}

const wrap: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "clamp(360px, 60vh, 620px)",
  background: "var(--bb-tac)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--hairline)",
  overflow: "hidden",
  touchAction: "none",
  userSelect: "none",
  WebkitUserSelect: "none",
};
const gridLines = "repeating-linear-gradient(0deg, var(--bb-grid-line) 0 1px, transparent 1px var(--bb-tile,30px)), repeating-linear-gradient(90deg, var(--bb-grid-line) 0 1px, transparent 1px var(--bb-tile,30px))";
const badge: CSSProperties = { position: "absolute", top: -7, left: -7, minWidth: 16, height: 16, padding: "0 3px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bb-badge-bg)", border: "1.5px solid var(--bb-badge-ring)", borderRadius: 5, font: "700 10px var(--font-mono)", color: "var(--bb-badge-fg)", boxShadow: "0 1px 3px rgba(0,0,0,0.6)", pointerEvents: "none" };
const collectBubble: CSSProperties = { position: "absolute", left: "50%", top: -14, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 999, background: "var(--bb-collect-bg)", color: "var(--bb-collect-fg)", font: "700 10px var(--font-mono)", boxShadow: "0 3px 9px rgba(0,0,0,0.55)", pointerEvents: "none", whiteSpace: "nowrap" };
function bracket(corner: "tl" | "tr" | "bl" | "br"): CSSProperties {
  const c = "var(--bb-select-ring)";
  const base: CSSProperties = { position: "absolute", width: 11, height: 11, pointerEvents: "none" };
  const v = "2.5px solid " + c;
  if (corner === "tl") return { ...base, top: -3, left: -3, borderTop: v, borderLeft: v };
  if (corner === "tr") return { ...base, top: -3, right: -3, borderTop: v, borderRight: v };
  if (corner === "bl") return { ...base, bottom: -3, left: -3, borderBottom: v, borderLeft: v };
  return { ...base, bottom: -3, right: -3, borderBottom: v, borderRight: v };
}
