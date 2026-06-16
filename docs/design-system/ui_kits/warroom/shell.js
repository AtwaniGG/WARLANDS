// WARLANDS War Room — interactive game shell.
// Recreates GameShell + TopBar + HexMap + PlotPanel from the codebase using DS primitives.
const DS = window.WARLANDSDesignSystem_2e7699;
const { Button, Badge, Stat, Tabs, Panel, ProgressBar, ResourceChip } = DS;
const { TERRAIN, RESOURCES, BUILDINGS, UNITS, HEX_SIZE, buildWorld } = window.WL_DATA;
const { useState, useMemo, useRef, useEffect } = React;

const fmt = (n) => Math.floor(n).toLocaleString();
const Icon = ({ src, size = 16 }) => <img src={src} width={size} height={size} alt="" style={{ display: "block" }} />;

function hexPoints(cx, cy, size) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    pts.push(`${cx + size * Math.cos(a)},${cy + size * Math.sin(a)}`);
  }
  return pts.join(" ");
}

// ---------------- Top HUD ----------------
function TopBar({ war, staked, burned, pool, plots }) {
  return (
    <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", borderBottom: "1px solid var(--hairline)", background: "var(--panel-void)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ display: "grid", placeItems: "center", height: 24, width: 24, background: "var(--amber)", color: "#000", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15 }}>W</span>
        <span className="wl-title" style={{ fontSize: 17, color: "var(--amber)", letterSpacing: "0.04em" }}>WARLANDS</span>
        <span style={{ display: "none" }} className="sm-show"><Badge tone="blood" variant="solid">Prototype</Badge></span>
      </div>
      <div className="no-scrollbar" style={{ display: "flex", minWidth: 0, flex: 1, alignItems: "center", gap: 16, overflowX: "auto" }}>
        <Stat label="$WAR" value={fmt(war)} accent="amber" />
        <Stat label="Staked" value={fmt(staked)} accent="sky" />
        <Stat label="Burned" value={fmt(burned)} accent="blood" />
        <Stat label="Pool" value={fmt(pool)} accent="emerald" />
        <Stat label="Plots" value={String(plots)} accent="emerald" />
        <Stat label="S4·t" value="14,920" accent="neutral" />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(245,179,1,0.4)", background: "rgba(245,179,1,0.08)", color: "var(--amber-text)", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-ui)", cursor: "pointer" }}>
          <span style={{ height: 6, width: 6, borderRadius: 999, background: "var(--success)" }} />7a3f…9c2b
        </button>
        <button aria-label="Settings" style={{ background: "none", border: "none", color: "var(--text-lo)", fontSize: 17, cursor: "pointer", minWidth: 32 }}>⚙️</button>
      </div>
    </header>
  );
}

// ---------------- Hex world map ----------------
function HexMap({ hexes, plots, selected, onSelect }) {
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const drag = useRef(null);
  const bounds = useMemo(() => {
    let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
    hexes.forEach((h) => { a = Math.min(a, h.x); b = Math.min(b, h.y); c = Math.max(c, h.x); d = Math.max(d, h.y); });
    return { minX: a, minY: b, maxX: c, maxY: d };
  }, [hexes]);
  const W = bounds.maxX - bounds.minX + HEX_SIZE * 4;
  const H = bounds.maxY - bounds.minY + HEX_SIZE * 4;
  const offX = -bounds.minX + HEX_SIZE * 2;
  const offY = -bounds.minY + HEX_SIZE * 2;

  const down = (e) => { drag.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false }; };
  const move = (e) => { if (!drag.current) return; const dx = e.clientX - drag.current.sx, dy = e.clientY - drag.current.sy; if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true; setView((v) => ({ ...v, x: drag.current.ox + dx, y: drag.current.oy + dy })); };
  const up = () => { drag.current = null; };
  const zoom = (f) => setView((v) => ({ ...v, scale: Math.min(2.4, Math.max(0.55, v.scale * f)) }));

  return (
    <div style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden", background: "var(--panel-void)", cursor: drag.current ? "grabbing" : "grab", touchAction: "none" }}
      onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`, transition: "transform 60ms linear" }}>
        {hexes.map((h) => {
          const owned = plots[h.key];
          const isSel = selected === h.key;
          const enemy = h.enemy;
          const cx = h.x + offX, cy = h.y + offY;
          const stroke = isSel ? "var(--rim-selected)" : owned ? "var(--rim-owned)" : enemy ? "var(--rim-enemy)" : "var(--rim-neutral)";
          const sw = isSel ? 3 : owned || enemy ? 2 : 1;
          return (
            <g key={h.key} onClick={(e) => { e.stopPropagation(); if (!drag.current?.moved) onSelect(h.key); }} style={{ cursor: "pointer" }}>
              <polygon points={hexPoints(cx, cy, HEX_SIZE - 1)} style={{ fill: TERRAIN[h.terrain].color, fillOpacity: owned ? 1 : enemy ? 0.85 : 0.62, stroke, strokeWidth: sw, filter: isSel ? "drop-shadow(0 0 6px rgba(255,210,74,0.7))" : "none" }} />
              {owned && <text x={cx} y={cy + 6} textAnchor="middle" fontSize={17} style={{ pointerEvents: "none" }}>🏕️</text>}
              {enemy && <text x={cx} y={cy + 5} textAnchor="middle" fontSize={14} style={{ pointerEvents: "none" }}>💀</text>}
              {!owned && !enemy && h.ring <= 1 && <text x={cx} y={cy + 4} textAnchor="middle" fontSize={12} fill="#fff" fillOpacity={0.45} style={{ pointerEvents: "none" }}>⚔</text>}
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: 12, top: 12, padding: "8px 12px", borderRadius: "var(--radius-md)", background: "rgba(0,0,0,0.6)", pointerEvents: "none" }}>
        <div className="wl-title" style={{ fontSize: 13, color: "var(--amber-text)" }}>Live World Map</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Drag to explore · click a hex</div>
        <div style={{ marginTop: 4, fontSize: 10, color: "var(--text-muted)" }}>⚔ Crucible (center, high risk) · edge = newbie ring</div>
      </div>
      <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        {[["＋", () => zoom(1.3)], ["－", () => zoom(1 / 1.3)], ["⟳", () => setView({ x: 0, y: 0, scale: 1 })]].map(([t, fn]) => (
          <button key={t} onClick={fn} style={{ width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", background: "rgba(0,0,0,0.62)", border: "1px solid var(--hairline)", color: "var(--amber-text)", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>{t}</button>
        ))}
      </div>
    </div>
  );
}

window.WL_SCREENS = { TopBar, HexMap, Icon, fmt };
