"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type WheelEvent as RWheelEvent } from "react";
import { BUILDINGS, GRID_W, GRID_H, footprintTiles, type BattleFrame, type CocBase, type CocBuildingId, type CocUnitId } from "@/sim/coc";
import { BaseGround } from "@/components/BaseGround";

/** One grid cell, in stage pixels (zoom multiplies this). */
export const TILE = 30;

export const UNIT_COLOR: Record<CocUnitId, string> = {
  grunt: "#e6e9ef", marksman: "#4a90d9", breacher: "#f5b301", juggernaut: "#9c2b2b", gunship: "#8b5cf6",
};

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
  /** tap on a tile (used by build / wall / move-destination / deploy flows) */
  onTile?: (tileKey: string) => void;
  /** ✕ on the placement confirm cluster — cancel the active build/move intent */
  onCancelPlace?: () => void;
  /** deploy phase: tapping an open tile drops a troop */
  deployMode?: boolean;
  /** placed troop markers shown during the deploy phase */
  deployMarkers?: { unit: CocUnitId; x: number; y: number }[];
  /** build mode: a trap queued for placement (tap an open tile) */
  placingTrap?: string | null;
  /** render the owner's own (hidden) traps — only in MY BASE, never on a scout */
  showTraps?: boolean;
  /** battle playback: render troops + structure damage from this frame */
  frame?: BattleFrame | null;
}

function num(n: number): string {
  return Math.floor(n).toLocaleString();
}

export function BaseGrid({ base, tick, readOnly, selected, placing, wallMode, moveFrom, canPlace, onSelectBuilding, onTile, onCancelPlace, deployMode, deployMarkers, placingTrap, showTraps, frame }: BaseGridProps) {
  const tilePlacing = wallMode || deployMode || !!placingTrap;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [ghost, setGhost] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null); // building/move tile awaiting ✓ confirm
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pan = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const pinch = useRef<{ dist: number; scale: number } | null>(null);

  const stageW = GRID_W * TILE;
  const stageH = GRID_H * TILE;

  // Zoom in + center on the base on mount (CoC-style: you pan a large village, not see all 20×20).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;
    // show ~11 tiles across so buildings read large; clamp so it never looks tiny or absurd
    const scale = Math.max(0.7, Math.min(1.6, w / (11 * TILE)));
    // center on the Town Hall if placed, else the grid middle
    const th = Object.entries(base.buildings).find(([, b]) => b.id === "commandCenter")?.[0];
    const [cxT, cyT] = th ? th.split(",").map(Number) : [GRID_W / 2 - 2, GRID_H / 2 - 2];
    const cx = (cxT + 2) * TILE, cy = (cyT + 2) * TILE; // building footprint center-ish
    setView({ x: w / 2 - cx * scale, y: h / 2 - cy * scale, scale });
  }, [stageW, stageH]); // eslint-disable-line react-hooks/exhaustive-deps

  // drop any pending placement when the active build/move intent changes
  useEffect(() => { setPending(null); }, [placing, moveFrom, wallMode, placingTrap]);

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
      if ((placing || tilePlacing || moveFrom) && !readOnly) {
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
        if (!readOnly && (placing || moveFrom)) {
          setPending(key); // footprint buildings + move use a place → ✓ confirm step
        } else if (!readOnly && tilePlacing) {
          onTile?.(key); // walls / traps / deploy place instantly (rapid)
        } else if (!tilePlacing) {
          onSelectBuilding?.(anchorAtTile(key));
        }
      } else if (!placing && !tilePlacing && !moveFrom) {
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
  const frameStruct = frame ? new Map(frame.structures.map((s) => [s.key, s])) : null;
  const isOpenTile = (key: string) => anchorAtTile(key) === null && !base.walls[key];

  // px center of a building's footprint (for tracers / hit fx)
  const structCenter = useCallback((key: string): [number, number] | null => {
    const b = base.buildings[key];
    if (!b) return null;
    const [x, y] = key.split(",").map(Number);
    const { w, h } = BUILDINGS[b.id].footprint;
    return [(x + w / 2) * TILE, (y + h / 2) * TILE];
  }, [base.buildings]);

  // ---- combat juice: spawn transient effects from frame-to-frame deltas ----
  type Fx = { id: number; kind: "spark" | "smoke" | "poof" | "dmg" | "detonate"; x: number; y: number; val?: number; color?: string };
  const [fx, setFx] = useState<Fx[]>([]);
  const prevFrame = useRef<BattleFrame | null>(null);
  const fxId = useRef(0);
  useEffect(() => {
    if (!frame) { prevFrame.current = null; if (fx.length) setFx([]); return; }
    const prev = prevFrame.current;
    prevFrame.current = frame;
    if (!prev) return;
    const add: Fx[] = [];
    const push = (kind: Fx["kind"], x: number, y: number, val?: number, color?: string) => add.push({ id: fxId.current++, kind, x, y, val, color });
    const prevS = new Map(prev.structures.map((s) => [s.key, s.hp]));
    for (const s of frame.structures) {
      const p = prevS.get(s.key);
      if (p == null || s.hp >= p) continue;
      const c = structCenter(s.key);
      if (!c) continue;
      push("spark", c[0], c[1]);
      push("dmg", c[0], c[1], Math.round(p - s.hp));
      if (s.hp <= 0 && p > 0) push("smoke", c[0], c[1]);
    }
    const prevW = new Map(prev.walls.map((w) => [w.key, w.hp]));
    for (const w of frame.walls) {
      const p = prevW.get(w.key);
      if (p != null && p > 0 && w.hp <= 0) { const [x, y] = w.key.split(",").map(Number); push("smoke", (x + 0.5) * TILE, (y + 0.5) * TILE); }
    }
    for (let i = 0; i < frame.troops.length; i++) {
      const c = frame.troops[i], pp = prev.troops[i];
      if (pp && pp.alive && !c.alive) push("poof", (c.x + 0.5) * TILE, (c.y + 0.5) * TILE, undefined, UNIT_COLOR[c.unit]);
    }
    const prevT = new Map(prev.traps.map((t) => [t.key, t.armed]));
    for (const t of frame.traps) {
      const p = prevT.get(t.key);
      if (p && !t.armed) { const [x, y] = t.key.split(",").map(Number); push("detonate", (x + 0.5) * TILE, (y + 0.5) * TILE); }
    }
    if (add.length) {
      setFx((f) => [...f, ...add]);
      const ids = new Set(add.map((a) => a.id));
      setTimeout(() => setFx((f) => f.filter((it) => !ids.has(it.id))), 1000);
    }
  }, [frame]); // eslint-disable-line react-hooks/exhaustive-deps

  // defenses firing: a tracer from each live defense to its nearest in-range attacker (current frame)
  const tracers = useMemo(() => {
    if (!frame) return [] as { x1: number; y1: number; x2: number; y2: number }[];
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const atk = frame.troops.filter((t) => t.alive && t.side === "atk");
    for (const s of frame.structures) {
      if (s.hp <= 0) continue;
      const b = base.buildings[s.key];
      if (!b) continue;
      const def = BUILDINGS[b.id];
      const stat = def.levels[Math.max(0, b.level - 1)];
      if (def.category !== "defense" || !stat?.range) continue;
      const c = structCenter(s.key);
      if (!c) continue;
      const [sx, sy] = c;
      let best: typeof atk[number] | null = null, bd = Infinity;
      for (const t of atk) {
        if (def.levels[0] && stat.targets === "air" && !["gunship"].includes(t.unit)) continue;
        const tx = (t.x + 0.5) * TILE, ty = (t.y + 0.5) * TILE;
        const d = Math.hypot(tx - sx, ty - sy);
        if (d <= (stat.range + 1.5) * TILE && d < bd) { best = t; bd = d; }
      }
      if (best) lines.push({ x1: sx, y1: sy, x2: (best.x + 0.5) * TILE, y2: (best.y + 0.5) * TILE });
    }
    return lines;
  }, [frame, base.buildings, structCenter]);

  // live destruction % + star pips during playback
  const battleStatus = useMemo(() => {
    if (!frame || frame.structures.length === 0) return null;
    const total = frame.structures.length;
    const destroyed = frame.structures.filter((s) => s.hp <= 0).length;
    const pct = destroyed / total;
    const thKey = Object.entries(base.buildings).find(([, b]) => b.id === "commandCenter")?.[0];
    const ccDead = thKey ? (frame.structures.find((s) => s.key === thKey)?.hp ?? 1) <= 0 : false;
    let stars = 0;
    if (pct >= 0.5) stars++;
    if (ccDead) stars++;
    if (destroyed >= total) stars++;
    return { pct, stars };
  }, [frame, base.buildings]);

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
      {battleStatus && (
        <div style={{ position: "absolute", top: 8, left: 8, right: 8, zIndex: 20, display: "flex", alignItems: "center", gap: 8, pointerEvents: "none" }}>
          <div style={{ display: "flex", gap: 2 }}>
            {[0, 1, 2].map((i) => <span key={i} style={{ fontSize: 18, lineHeight: 1, color: i < battleStatus.stars ? "var(--amber)" : "rgba(255,255,255,0.18)", textShadow: "0 1px 2px #000" }}>★</span>)}
          </div>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(0,0,0,0.55)", overflow: "hidden", border: "1px solid rgba(0,0,0,0.6)" }}>
            <div style={{ height: "100%", width: `${Math.round(battleStatus.pct * 100)}%`, background: "var(--blood)", transition: "width 120ms linear" }} />
          </div>
          <span className="wl-num" style={{ fontSize: 11, color: "var(--text-primary)", minWidth: 34, textAlign: "right", textShadow: "0 1px 2px #000" }}>{Math.round(battleStatus.pct * 100)}%</span>
        </div>
      )}
      <div style={{ position: "absolute", left: 0, top: 0, width: stageW, height: stageH, transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`, transformOrigin: "0 0" }}>
        {/* layered war-camp ground: cracked earth → battlefield decor → tactical grid → vignette → fortified perimeter */}
        <div style={{ position: "absolute", inset: 0, background: "var(--bb-earth)" }} />
        <BaseGround seed={base.location} w={stageW} h={stageH} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: minorGrid }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: majorGrid }} />
        <div style={{ position: "absolute", inset: 0, background: vignette, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(245,179,1,0.16)", boxShadow: "inset 0 0 34px rgba(245,179,1,0.05), inset 0 0 0 1px rgba(0,0,0,0.45)", pointerEvents: "none" }} />
        {(["tl", "tr", "bl", "br"] as const).map((c) => <span key={`pc${c}`} style={plotCorner(c)} />)}

        {/* walls */}
        {Object.entries(base.walls).map(([key, level]) => {
          const [x, y] = key.split(",").map(Number);
          return (
            <img key={`w${key}`} src={wallArt(level)} alt="wall" draggable={false}
              style={{ position: "absolute", left: x * TILE, top: y * TILE, width: TILE, height: TILE, pointerEvents: "none" }} />
          );
        })}

        {/* own hidden traps (never shown on a scout) */}
        {showTraps && Object.entries(base.traps ?? {}).map(([key, tp]) => {
          const [x, y] = key.split(",").map(Number);
          return (
            <span key={`tp${key}`} title={tp.id} style={{ position: "absolute", left: x * TILE + TILE / 2 - 6, top: y * TILE + TILE / 2 - 6, width: 12, height: 12, borderRadius: "50%", border: "1.5px solid var(--blood-text)", background: "rgba(156,43,43,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, pointerEvents: "none", zIndex: 7 }}>{tp.id === "airMine" ? "▲" : "●"}</span>
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
          const fs = frameStruct?.get(anchor) ?? null;
          const destroyed = fs ? fs.hp <= 0 : false;
          return (
            <div key={anchor} style={{ position: "absolute", left: x * TILE, top: y * TILE, width: w * TILE, height: h * TILE }}>
              {range != null && (
                <div style={{ position: "absolute", left: "50%", top: "50%", width: range * 2 * TILE, height: range * 2 * TILE, transform: "translate(-50%,-50%)", borderRadius: "50%", border: "1px dashed var(--bb-range-line)", background: "var(--bb-range-fill)", pointerEvents: "none" }} />
              )}
              <div style={{ position: "absolute", left: "14%", right: "14%", bottom: "3%", height: Math.max(6, h * TILE * 0.16), borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(0,0,0,0.6), transparent 72%)", pointerEvents: "none" }} />
              <img src={buildingArt(b.id, b.level)} alt={def.name} draggable={false}
                className={destroyed ? "bb-collapse" : undefined}
                style={{ width: "100%", height: "100%", display: "block", transition: "transform 120ms var(--ease-out)", transform: isSel && !destroyed ? "translateY(-2px)" : undefined, filter: destroyed ? "grayscale(1) brightness(0.5)" : isSel ? "drop-shadow(0 0 6px rgba(255,210,74,0.55)) drop-shadow(var(--bb-shadow))" : "drop-shadow(var(--bb-shadow))", opacity: !destroyed && moveFrom === anchor ? 0.5 : 1 }} />
              {fs && !destroyed && fs.hp < fs.max && (
                <div style={{ position: "absolute", left: "8%", right: "8%", top: -6, height: 4, borderRadius: 2, background: "#0a0d14", overflow: "hidden", pointerEvents: "none" }}>
                  <div style={{ height: "100%", width: `${(fs.hp / fs.max) * 100}%`, background: "var(--success)" }} />
                </div>
              )}
              {destroyed && <div style={{ position: "absolute", inset: "10%", borderRadius: 6, background: "var(--bb-damage-tint)", pointerEvents: "none" }} />}
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

        {/* deploy markers (pending placements) */}
        {deployMarkers?.map((m, i) => (
          <span key={`dm${i}`} style={{ ...dot, left: m.x * TILE + TILE / 2 - 4, top: m.y * TILE + TILE / 2 - 4, background: UNIT_COLOR[m.unit] }} />
        ))}

        {/* defenses firing — tracer lines to their nearest target */}
        {tracers.length > 0 && (
          <svg width={stageW} height={stageH} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 9 }} aria-hidden>
            {tracers.map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="rgba(245,179,1,0.75)" strokeWidth="1.3" strokeLinecap="round" />)}
          </svg>
        )}

        {/* live battle troops (playback): attackers solid, defenders ringed red */}
        {frame?.troops.filter((t) => t.alive).map((t, i) => (
          <span key={`bt${i}`} style={{ ...dot, left: t.x * TILE + TILE / 2 - 4, top: t.y * TILE + TILE / 2 - 4, background: UNIT_COLOR[t.unit], border: t.side === "def" ? "2px solid var(--blood-text)" : undefined }} />
        ))}

        {/* transient combat effects (sparks, smoke, death poofs, damage numbers, trap detonations) */}
        {fx.map((f) => {
          if (f.kind === "dmg") return <span key={f.id} className="fx-float" style={{ position: "absolute", left: f.x, top: f.y, transform: "translate(-50%,-50%)", font: "700 11px var(--font-mono)", color: "var(--blood-text)", textShadow: "0 1px 2px #000", pointerEvents: "none", zIndex: 12 }}>-{f.val}</span>;
          if (f.kind === "smoke") return <span key={f.id} className="fx-smoke" style={{ position: "absolute", left: f.x - 9, top: f.y - 9, width: 18, height: 18, borderRadius: "50%", background: "radial-gradient(circle, rgba(82,82,90,0.85), transparent 70%)", pointerEvents: "none", zIndex: 10 }} />;
          if (f.kind === "poof") return <span key={f.id} className="fx-spark" style={{ position: "absolute", left: f.x - 6, top: f.y - 6, width: 12, height: 12, borderRadius: "50%", background: `radial-gradient(circle, ${f.color ?? "#aaa"}, transparent 70%)`, pointerEvents: "none", zIndex: 10 }} />;
          if (f.kind === "detonate") return <span key={f.id} className="fx-detonate" style={{ position: "absolute", left: f.x - 11, top: f.y - 11, width: 22, height: 22, borderRadius: "50%", background: "radial-gradient(circle, #fff, #ff5a3c 45%, transparent 72%)", pointerEvents: "none", zIndex: 12 }} />;
          return <span key={f.id} className="fx-spark" style={{ position: "absolute", left: f.x - 7, top: f.y - 7, width: 14, height: 14, borderRadius: "50%", background: "radial-gradient(circle, #fff6cf, #f5b301 50%, transparent 72%)", pointerEvents: "none", zIndex: 11 }} />;
        })}

        {/* live hover ghost (hidden once a tile is pending confirm) */}
        {ghost && !pending && (placing || tilePlacing || moveFrom) && (() => {
          const id: CocBuildingId | null = placing ?? (moveFrom ? base.buildings[moveFrom]?.id ?? null : null);
          const { w, h } = tilePlacing ? { w: 1, h: 1 } : id ? BUILDINGS[id].footprint : { w: 1, h: 1 };
          const [gx, gy] = ghost.split(",").map(Number);
          const valid = tilePlacing ? isOpenTile(ghost) : id ? !canPlace || canPlace(ghost, id) : false;
          return (
            <div style={{ position: "absolute", left: gx * TILE, top: gy * TILE, width: w * TILE, height: h * TILE, background: valid ? "var(--bb-valid)" : "var(--bb-invalid)", border: `2px solid ${valid ? "var(--bb-valid-line)" : "var(--bb-invalid-line)"}`, borderRadius: 4, pointerEvents: "none" }} />
          );
        })()}

        {/* pending placement: faux-iso ghost on a tinted footprint, awaiting ✓ */}
        {pending && (() => {
          const id: CocBuildingId | null = placing ?? (moveFrom ? base.buildings[moveFrom]?.id ?? null : null);
          if (!id) return null;
          const { w, h } = BUILDINGS[id].footprint;
          const [gx, gy] = pending.split(",").map(Number);
          const valid = placing ? !canPlace || canPlace(pending, id) : true;
          const lvl = placing ? 1 : base.buildings[moveFrom!]?.level ?? 1;
          return (
            <div style={{ position: "absolute", left: gx * TILE, top: gy * TILE, width: w * TILE, height: h * TILE, pointerEvents: "none" }}>
              <div style={{ position: "absolute", inset: 0, background: valid ? "var(--bb-valid)" : "var(--bb-invalid)", border: `2px solid ${valid ? "var(--bb-valid-line)" : "var(--bb-invalid-line)"}`, borderRadius: 4 }} />
              <img src={buildingArt(id, lvl)} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.9, filter: "drop-shadow(var(--bb-shadow))" }} />
            </div>
          );
        })()}
      </div>

      {/* placement status chip + ✕/✓ confirm cluster (screen space) */}
      {pending && (placing || moveFrom) && (() => {
        const id: CocBuildingId | null = placing ?? (moveFrom ? base.buildings[moveFrom]?.id ?? null : null);
        if (!id) return null;
        const { w, h } = BUILDINGS[id].footprint;
        const [gx, gy] = pending.split(",").map(Number);
        const valid = placing ? !canPlace || canPlace(pending, id) : true;
        const left = view.x + (gx + w / 2) * TILE * view.scale;
        const top = view.y + (gy + h) * TILE * view.scale;
        const stop = (e: RPointerEvent) => e.stopPropagation();
        return (
          <>
            <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: 22, pointerEvents: "none", padding: "4px 11px", borderRadius: 999, background: "rgba(12,16,24,0.85)", border: `1px solid ${valid ? "var(--bb-valid-line)" : "var(--bb-invalid-line)"}`, font: "700 10px var(--font-display)", letterSpacing: "0.08em", color: valid ? "var(--success)" : "var(--danger-strong)", whiteSpace: "nowrap" }}>
              PLACING · {valid ? "VALID" : "INVALID"} — {BUILDINGS[id].name.toUpperCase()} · {w}×{h}
            </div>
            <div onPointerDown={stop} onPointerUp={stop} style={{ position: "absolute", left, top: top + 12, transform: "translateX(-50%)", display: "flex", gap: 14, zIndex: 22 }}>
              <button onClick={() => { setPending(null); onCancelPlace?.(); }} style={clusterBtn(false)} aria-label="cancel">✕</button>
              <button disabled={!valid} onClick={() => { onTile?.(pending); setPending(null); }} style={clusterBtn(true, valid)} aria-label="confirm">✓</button>
            </div>
          </>
        );
      })()}
    </div>
  );
}

function clusterBtn(confirm: boolean, enabled = true): CSSProperties {
  return {
    width: 44, height: 44, borderRadius: "50%",
    border: confirm ? 0 : "1px solid var(--hairline)",
    background: confirm ? (enabled ? "var(--success)" : "var(--disabled)") : "var(--panel-2)",
    color: confirm ? "#0c0a04" : "var(--text-primary)",
    fontSize: 19, fontWeight: 700, cursor: enabled ? "pointer" : "not-allowed",
    boxShadow: "var(--shadow-2), var(--bb-select-glow)", display: "inline-flex", alignItems: "center", justifyContent: "center",
  };
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
// Tactical grid aligned to the real tile size: faint per-tile lines + amber lines every 5 tiles.
const minorGrid = `repeating-linear-gradient(0deg, var(--bb-grid-line) 0 1px, transparent 1px ${TILE}px), repeating-linear-gradient(90deg, var(--bb-grid-line) 0 1px, transparent 1px ${TILE}px)`;
const majorGrid = `repeating-linear-gradient(0deg, var(--bb-grid-line-major) 0 1.5px, transparent 1.5px ${TILE * 5}px), repeating-linear-gradient(90deg, var(--bb-grid-line-major) 0 1.5px, transparent 1.5px ${TILE * 5}px)`;
const vignette = "radial-gradient(125% 120% at 50% 42%, transparent 52%, rgba(4,6,10,0.55) 100%)";
function plotCorner(c: "tl" | "tr" | "bl" | "br"): CSSProperties {
  const col = "rgba(245,179,1,0.55)";
  const v = `3px solid ${col}`;
  const base: CSSProperties = { position: "absolute", width: 20, height: 20, pointerEvents: "none", zIndex: 4 };
  if (c === "tl") return { ...base, top: 5, left: 5, borderTop: v, borderLeft: v };
  if (c === "tr") return { ...base, top: 5, right: 5, borderTop: v, borderRight: v };
  if (c === "bl") return { ...base, bottom: 5, left: 5, borderBottom: v, borderLeft: v };
  return { ...base, bottom: 5, right: 5, borderBottom: v, borderRight: v };
}
const dot: CSSProperties = { position: "absolute", width: 8, height: 8, borderRadius: "50%", boxShadow: "0 0 0 1px #0a0d14, 0 1px 2px rgba(0,0,0,0.7)", pointerEvents: "none", zIndex: 8 };
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
