/* WARLANDS UI kit — interactive SVG hex world map. */
const { useMemo, useRef, useState, useCallback } = React;

function hexPoints(cx, cy, size) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90); // pointy-top
    pts.push((cx + size * Math.cos(a)).toFixed(1) + "," + (cy + size * Math.sin(a)).toFixed(1));
  }
  return pts.join(" ");
}

function HexMap({ hexes, plots, selected, onSelect, defeated, R }) {
  const { TERRAIN, SIZE, zoneOf } = window.WL;
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [drag, setDrag] = useState(false);
  const dref = useRef(null);

  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    hexes.forEach((h) => { minX = Math.min(minX, h.x); minY = Math.min(minY, h.y); maxX = Math.max(maxX, h.x); maxY = Math.max(maxY, h.y); });
    return { minX, minY, maxX, maxY };
  }, [hexes]);

  const width = bounds.maxX - bounds.minX + SIZE * 4;
  const height = bounds.maxY - bounds.minY + SIZE * 4;
  const offX = -bounds.minX + SIZE * 2;
  const offY = -bounds.minY + SIZE * 2;

  const onWheel = useCallback((e) => {
    setView((v) => ({ ...v, scale: Math.min(2.2, Math.max(0.55, v.scale - e.deltaY * 0.0012)) }));
  }, []);
  const onDown = (e) => { dref.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y }; setDrag(true); };
  const onMove = (e) => { if (!dref.current) return; const d = dref.current; setView((v) => ({ ...v, x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) })); };
  const onUp = () => { dref.current = null; setDrag(false); };

  return (
    <div
      style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden", background: "var(--panel-void)" }}
      onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
    >
      {/* faint radial crucible glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(156,43,43,0.22), transparent 42%)", pointerEvents: "none" }} />
      <svg
        width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}
        style={{ transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`, cursor: drag ? "grabbing" : "grab" }}
      >
        {hexes.map((h) => {
          const owned = plots[h.key];
          const npcActive = h.npc && !defeated[h.key];
          const def = TERRAIN[h.terrain];
          const isSel = selected === h.key;
          const zone = zoneOf(h.ring, R);
          const cx = h.x + offX, cy = h.y + offY;
          let stroke = "#1c2433", sw = 1;
          if (isSel) { stroke = "#ffd24a"; sw = 3; }
          else if (owned) { stroke = "#facc15"; sw = 2; }
          else if (npcActive) { stroke = "#dc2626"; sw = 2; }
          return (
            <g key={h.key} onClick={(e) => { e.stopPropagation(); onSelect(h.key); }} style={{ cursor: "pointer" }}>
              <polygon
                points={hexPoints(cx, cy, SIZE - 1)}
                fill={def.color} fillOpacity={owned ? 1 : 0.6}
                stroke={stroke} strokeWidth={sw}
                style={{ transition: "fill-opacity .15s" }}
              />
              {owned && <text x={cx} y={cy + 5} textAnchor="middle" fontSize={15} style={{ pointerEvents: "none" }}>🏕️</text>}
              {!owned && npcActive && <text x={cx} y={cy + 5} textAnchor="middle" fontSize={13} style={{ pointerEvents: "none" }}>💀</text>}
              {zone === "crucible" && !owned && !npcActive && <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fill="#fff" fillOpacity={0.45} style={{ pointerEvents: "none" }}>⚔</text>}
            </g>
          );
        })}
      </svg>

      <div style={{ position: "absolute", left: 12, top: 12, pointerEvents: "none", background: "rgba(0,0,0,0.6)", borderRadius: "var(--radius-md)", padding: "8px 11px", border: "1px solid var(--hairline)" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--amber-text)", fontWeight: 600 }}>Live World Map</div>
        <div style={{ fontSize: 11, color: "var(--text-lo)", marginTop: 2 }}>Drag to pan · scroll to zoom · click a hex</div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 5, display: "flex", gap: 10 }}>
          <span>⚔ Crucible — center, high risk</span><span>edge = newbie ring</span>
        </div>
      </div>
    </div>
  );
}

window.HexMap = HexMap;
