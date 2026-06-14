/* WARLANDS Game Shell — consolidated, exportable React component for the
   `templates/` Design Component. Reads game data from window.WL (data.js) and
   UI primitives from the compiled design-system bundle. Exports window.GameShell. */
(function () {
  const R = 4;

  // Wait for the DS bundle to finish loading (ds-base.js appends it async).
  function useDS() {
    const NS = "WARLANDSDesignSystem_e0d283";
    const [ds, setDs] = React.useState(window[NS]);
    React.useEffect(() => {
      if (ds) return;
      const id = setInterval(() => {
        if (window[NS]) { setDs(window[NS]); clearInterval(id); }
      }, 30);
      return () => clearInterval(id);
    }, [ds]);
    return ds;
  }

  /* ---------------- hex helpers ---------------- */
  function hexPoints(cx, cy, size) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 90);
      pts.push((cx + size * Math.cos(a)).toFixed(1) + "," + (cy + size * Math.sin(a)).toFixed(1));
    }
    return pts.join(" ");
  }

  /* ---------------- HexMap ---------------- */
  function HexMap({ hexes, plots, selected, onSelect, defeated }) {
    const { TERRAIN, SIZE, zoneOf } = window.WL;
    const { useMemo, useRef, useState, useCallback } = React;
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
      <div style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden", background: "var(--panel-void)" }}
        onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(156,43,43,0.22), transparent 42%)", pointerEvents: "none" }} />
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}
          style={{ transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`, cursor: drag ? "grabbing" : "grab" }}>
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
                <polygon points={hexPoints(cx, cy, SIZE - 1)} fill={def.color} fillOpacity={owned ? 1 : 0.6} stroke={stroke} strokeWidth={sw} style={{ transition: "fill-opacity .15s" }} />
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

  /* ---------------- HUD panels ---------------- */
  function TopBar({ war, staked, burned, pool, plots, tick }) {
    const { Badge, Stat } = window.WARLANDSDesignSystem_e0d283;
    return (
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", borderBottom: "1px solid var(--hairline)", background: "var(--panel-void)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, letterSpacing: "-0.01em", textTransform: "uppercase", color: "var(--amber)" }}>WARLANDS</span>
          <Badge tone="blood" variant="solid">Prototype</Badge>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Stat label="$WAR" value={window.WL.fmt(war)} accent="amber" />
          <Stat label="Staked" value={window.WL.fmt(staked)} accent="sky" />
          <Stat label="Burned" value={window.WL.fmt(burned)} accent="blood" />
          <Stat label="Pool" value={window.WL.fmt(pool)} accent="emerald" />
          <Stat label="Plots" value={String(plots)} accent="emerald" />
          <Stat label="S3·t" value={String(tick)} accent="neutral" />
        </div>
      </header>
    );
  }

  function EventLog({ log }) {
    return (
      <div style={{ borderTop: "1px solid var(--hairline)", background: "rgba(8,11,17,0.8)", padding: "9px 14px" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 5 }}>Event Log</div>
        <div style={{ maxHeight: 88, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
          {log.map((line, i) => <div key={i} style={{ fontSize: 12, color: i === 0 ? "var(--text-hi)" : "var(--text-lo)" }}>{line}</div>)}
        </div>
      </div>
    );
  }

  function Row({ label, value }) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span style={{ color: "var(--text-muted)" }}>{label}</span>
        <span style={{ color: "var(--text-hi)" }}>{value}</span>
      </div>
    );
  }

  function PlotPanel({ hex, plot, war, defeated, onClaim, onBuild, onScout, onRaid, onUnstake }) {
    const { Button, Badge, Panel, ResourceChip } = window.WARLANDSDesignSystem_e0d283;
    const { TERRAIN, BUILD, RES, fmt } = window.WL;
    if (!hex) return <div style={{ padding: 18, fontSize: 13, color: "var(--text-lo)" }}>Select a hex on the map to inspect or claim it.</div>;
    const def = TERRAIN[hex.terrain];
    const npcActive = hex.npc && !defeated[hex.key];

    if (!plot) {
      const canAfford = war >= def.stake;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
          {npcActive && (
            <Panel label="⚔ Hostile Camp" rim="blood" padding="12px" headerRight={<Badge tone="blood">Tier {hex.npcTier}</Badge>}>
              <p style={{ fontSize: 12, color: "var(--text-lo)", margin: "0 0 10px" }}>Unknown strength. Scout first (50 $WAR) to reveal the garrison.</p>
              <div style={{ display: "flex", gap: 6 }}>
                <Button variant="info" size="sm" icon="🔭" onClick={onScout}>Scout (50$)</Button>
                <Button variant="primary" size="sm" icon="🗡️" onClick={onRaid}>Raid</Button>
                <Button variant="danger" size="sm" icon="🏰" onClick={onRaid}>Siege</Button>
              </div>
            </Panel>
          )}
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.01em", color: def.color }}>{def.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Hex ({hex.q}, {hex.r}) · ring {hex.ring}</div>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-lo)", margin: 0, lineHeight: 1.5 }}>{def.blurb}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, background: "rgba(26,32,48,0.5)", borderRadius: "var(--radius-md)", padding: 12 }}>
            <Row label="Stake to claim" value={`${fmt(def.stake)} $WAR`} />
            <Row label="Defense mult" value={`×${def.def}`} />
            <Row label="Reward mult" value={`×${def.reward}`} />
            <Row label="Protection" value={hex.terrain === "warzone" ? "never (warzone)" : "eligible"} />
          </div>
          <Button variant="primary" full disabled={!canAfford} icon="⚔️" onClick={() => onClaim(hex)}>
            {canAfford ? `Stake ${fmt(def.stake)} $WAR & Claim` : "Insufficient $WAR"}
          </Button>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
            Staked $WAR is <span style={{ color: "var(--text-lo)" }}>locked, never spent</span>. You get it back on unstake (minus a small fee). It can never be looted.
          </p>
        </div>
      );
    }

    const slotCap = 5;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, textTransform: "uppercase", color: def.color }}>{plot.name}</div>
            <Badge tone="amber">Owned</Badge>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{def.name} · staked {fmt(def.stake)} $WAR · plot #{plot.claimIndex}</div>
          <div style={{ fontSize: 12, marginTop: 4, color: "var(--text-lo)" }}>Defense: <span style={{ color: "var(--emerald-text)" }}>{plot.defense}%</span></div>
        </div>

        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 7 }}>Stockpile</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {Object.entries(plot.stock).map(([r, v]) => <ResourceChip key={r} icon={RES[r].i} name={RES[r].n} amount={fmt(v)} tier={RES[r].t} size="sm" />)}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Buildings</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>slots {plot.buildings.length}/{slotCap}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {plot.buildings.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(26,32,48,0.5)", borderRadius: "var(--radius-sm)", padding: "7px 9px", fontSize: 12 }}>
                <span>{BUILD[b].i} {BUILD[b].n} <span style={{ color: "var(--text-muted)" }}>L1</span></span>
                <Badge tone="sky">Active</Badge>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 7 }}>Construct</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {def.build.filter((id) => !plot.buildings.includes(id)).map((id) => {
              const blocked = plot.buildings.length >= slotCap || war < BUILD[id].cost;
              return (
                <button key={id} disabled={blocked} onClick={() => onBuild(hex.key, id)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(26,32,48,0.6)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-sm)", padding: "7px 9px", fontSize: 12, color: "var(--text-hi)", cursor: blocked ? "not-allowed" : "pointer", opacity: blocked ? 0.4 : 1, fontFamily: "var(--font-ui)" }}>
                  <span>{BUILD[id].i} {BUILD[id].n}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-lo)" }}>{BUILD[id].cost}$</span>
                </button>
              );
            })}
          </div>
        </div>

        <Button variant="outline" full size="sm" onClick={() => onUnstake(hex.key)}>Unstake plot (return {fmt(def.stake * 0.97)} $WAR · 3% fee)</Button>
      </div>
    );
  }

  function MarketPanel({ onTrade }) {
    const { Button, Tabs } = window.WARLANDSDesignSystem_e0d283;
    const { RES, REF } = window.WL;
    const [tab, setTab] = React.useState("raw");
    const [qty, setQty] = React.useState(50);
    const items = Object.keys(RES).filter((r) => RES[r].t === tab);
    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, textTransform: "uppercase", color: "var(--amber)", margin: 0 }}>Open Marketplace</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
            <span>Trade size</span>
            <input type="number" value={qty} min={1} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              style={{ width: 72, background: "var(--panel-2)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-sm)", padding: "5px 8px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-hi)" }} />
          </div>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 16px" }}>Player-driven order book. 4% transaction fee + 5 $WAR listing fee are token sinks (½ burned, ½ to the season reward pool).</p>
        <div style={{ marginBottom: 12 }}>
          <Tabs tabs={[{ id: "raw", label: "Raw" }, { id: "intermediate", label: "Intermediate" }, { id: "finished", label: "Finished" }]} value={tab} onChange={setTab}
            style={{ border: "1px solid var(--hairline)", borderRadius: "var(--radius-md)", display: "inline-flex" }} />
        </div>
        <div style={{ border: "1px solid var(--hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: "var(--panel)" }}>
              <tr style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
                <th style={{ textAlign: "left", padding: "9px 12px" }}>Item</th>
                <th style={{ textAlign: "right", padding: "9px 8px" }}>Bid</th>
                <th style={{ textAlign: "right", padding: "9px 8px" }}>Ref</th>
                <th style={{ textAlign: "right", padding: "9px 8px" }}>Ask</th>
                <th style={{ textAlign: "right", padding: "9px 12px" }}>Trade</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const ref = REF[it];
                return (
                  <tr key={it} style={{ borderTop: "1px solid var(--hairline)" }}>
                    <td style={{ padding: "9px 12px" }}>{RES[it].i} {RES[it].n}</td>
                    <td style={{ padding: "9px 8px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--emerald-text)" }}>{(ref * 0.97).toFixed(2)}</td>
                    <td style={{ padding: "9px 8px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{ref.toFixed(2)}</td>
                    <td style={{ padding: "9px 8px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--blood-text)" }}>{(ref * 1.04).toFixed(2)}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 5 }}>
                        <Button variant="success" size="sm" onClick={() => onTrade("Bought", it, qty, ref * 1.04)}>Buy</Button>
                        <Button variant="danger" size="sm" onClick={() => onTrade("Sold", it, qty, ref * 0.97)}>Sell</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>Buy fills the cheapest asks; Sell hits the best bids. Prices drift each tick and AI liquidity refreshes — in the full game these orders are other players (GDD §7).</p>
      </div>
    );
  }

  function SeasonPanel({ pool, burned, plots }) {
    const { Panel, Stat, ProgressBar } = window.WARLANDSDesignSystem_e0d283;
    const { fmt, TERRAIN } = window.WL;
    const territory = Object.values(plots).reduce((s, p) => s + Math.round(TERRAIN[p.terrain].reward * 100), 0);
    const score = { econ: 2840, military: 1200, territory, allegiance: 640 };
    const total = score.econ + score.military + score.territory + score.allegiance;
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, textTransform: "uppercase", color: "var(--amber)", margin: 0 }}>Season 3</h2>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>148s remaining</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 18px" }}>Rewards are redistributed sinks — payouts can never exceed what the season's sinks collected (GDD §12.2).</p>
        <div style={{ marginBottom: 18 }}><ProgressBar value={62} tone="amber" /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <Panel padding="14px"><Stat label="Season Reward Pool (sink-funded)" value={`${fmt(pool)} $WAR`} accent="emerald" align="stack" size="lg" /></Panel>
          <Panel padding="14px"><Stat label="Total $WAR Burned (all sinks)" value={`${fmt(burned)} $WAR`} accent="blood" align="stack" size="lg" /></Panel>
        </div>
        <Panel title="Your Season Score">
          {[["w₁","Economic output (goods sold)",score.econ],["w₂","Military (raids & sieges won)",score.military],["w₃","Territory (control × reward mult)",score.territory],["w₄","Allegiance contribution (CS)",score.allegiance]].map(([w,l,v]) => (
            <div key={w} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
              <span style={{ color: "var(--text-lo)" }}><span style={{ color: "var(--text-muted)" }}>{w}</span> {l}</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-hi)" }}>{fmt(v)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--hairline)", marginTop: 8, paddingTop: 9, fontWeight: 700, fontSize: 14 }}>
            <span>Total Score</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--amber-text)" }}>{fmt(total)}</span>
          </div>
        </Panel>
      </div>
    );
  }

  function AllegianceStub() {
    const { Button } = window.WARLANDSDesignSystem_e0d283;
    const orgs = [
      { name: "Iron Concord", gov: "council", members: 13, treasury: "32,000", b: "🏛️ 🏰" },
      { name: "Crimson Pact", gov: "weighted", members: 9, treasury: "44,000", b: "🏛️ 🔬 📡" },
      { name: "Desert Wolves", gov: "democracy", members: 11, treasury: "20,000", b: "🏛️ 🏰" },
      { name: "Northern Vanguard", gov: "founder", members: 7, treasury: "56,000", b: "🏛️ 🔬 📡" },
    ];
    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: 22 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, textTransform: "uppercase", color: "var(--amber)", margin: "0 0 4px" }}>Allegiances</h2>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 18px" }}>Political/military/economic orgs. Pool specialization, treasury & defense. Buildings grant region-wide buffs (GDD §10–11).</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orgs.map((a) => (
            <div key={a.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--hairline)", borderRadius: "var(--radius-lg)", background: "var(--panel)", padding: "14px 16px" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{a.name} <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.06em" }}>{a.gov}</span></div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{a.members} members · treasury {a.treasury} $WAR · {a.b}</div>
              </div>
              <Button variant="info" size="sm">Join</Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------- Orchestrator ---------------- */
  function GameShell() {
    const DS = useDS();
    const { TERRAIN, BUILD, RES, fmt } = window.WL;
    const hexes = React.useMemo(() => window.WL.buildWorld(R), []);
    const [view, setView] = React.useState("map");
    const [selected, setSelected] = React.useState(null);
    const [plots, setPlots] = React.useState({});
    const [defeated, setDefeated] = React.useState({});
    const [war, setWar] = React.useState(85000);
    const [staked, setStaked] = React.useState(0);
    const [burned, setBurned] = React.useState(0);
    const [pool, setPool] = React.useState(4200);
    const [tick, setTick] = React.useState(128);
    const [log, setLog] = React.useState(["Welcome, Commander. Claim your first plot to begin.", "Hostile camps seeded toward the Crucible (💀)."]);

    React.useEffect(() => {
      const id = setInterval(() => setTick((t) => t + 1), 2200);
      return () => clearInterval(id);
    }, []);

    if (!DS) {
      return <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--panel-void)", color: "var(--text-lo)", fontFamily: "var(--font-display)", letterSpacing: "0.2em", textTransform: "uppercase", fontSize: 13 }}>Loading WARLANDS…</div>;
    }
    const { Tabs } = DS;
    const push = (line) => setLog((l) => [line, ...l].slice(0, 30));
    const hex = selected ? hexes.find((h) => h.key === selected) : null;
    const plot = selected ? plots[selected] : null;

    function claim(h) {
      const def = TERRAIN[h.terrain];
      if (war < def.stake) return;
      setWar((w) => w - def.stake); setStaked((s) => s + def.stake);
      setPlots((p) => ({ ...p, [h.key]: { terrain: h.terrain, name: `${def.name.split(" ")[0]} Outpost`, claimIndex: Object.keys(p).length + 1, defense: Math.round(def.def * 60), buildings: ["camp"], stock: { food: 120, wood: 80 } } }));
      push(`🏕️ Claimed ${def.name} at (${h.q}, ${h.r}) — staked ${fmt(def.stake)} $WAR.`);
    }
    function buildOn(key, id) {
      if (war < BUILD[id].cost) return;
      setWar((w) => w - BUILD[id].cost);
      setPlots((p) => ({ ...p, [key]: { ...p[key], buildings: [...p[key].buildings, id] } }));
      push(`🔨 Built ${BUILD[id].n}.`);
    }
    function unstake(key) {
      const def = TERRAIN[plots[key].terrain];
      const ret = Math.round(def.stake * 0.97), fee = def.stake - ret;
      setWar((w) => w + ret); setStaked((s) => s - def.stake);
      setBurned((b) => b + Math.round(fee / 2)); setPool((p) => p + Math.round(fee / 2));
      setPlots((p) => { const n = { ...p }; delete n[key]; return n; });
      setSelected(key);
      push(`↩️ Unstaked plot — ${fmt(ret)} $WAR returned (3% fee).`);
    }
    function scout() {
      if (war < 50) return;
      setWar((w) => w - 50); setBurned((b) => b + 25); setPool((p) => p + 25);
      push("🔭 Scouted hostile camp — garrison revealed.");
    }
    function raid() {
      if (!hex) return;
      setDefeated((d) => ({ ...d, [hex.key]: true }));
      push(`⚔️ VICTORY — hostile camp at (${hex.q}, ${hex.r}) cleared. Loot hauled back.`);
    }
    function trade(verb, item, qty, price) {
      const gross = qty * price, fee = Math.round(gross * 0.04);
      if (verb === "Bought") setWar((w) => w - Math.round(gross) - fee);
      else setWar((w) => w + Math.round(gross) - fee);
      setBurned((b) => b + Math.round(fee / 2)); setPool((p) => p + Math.round(fee / 2));
      push(`💱 ${verb} ${qty} ${RES[item].i} ${RES[item].n} @ ${price.toFixed(2)} (fee ${fee} $WAR).`);
    }

    const TABS = [
      { id: "map", label: "World", icon: "🗺️" },
      { id: "market", label: "Market", icon: "💱" },
      { id: "allegiance", label: "Allegiance", icon: "🤝" },
      { id: "season", label: "Season", icon: "🏆" },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--panel-void)", color: "var(--text-hi)", fontFamily: "var(--font-ui)" }}>
        <TopBar war={war} staked={staked} burned={burned} pool={pool} plots={Object.keys(plots).length} tick={tick} />
        <Tabs tabs={TABS} value={view} onChange={setView} />
        <div style={{ display: "flex", minHeight: 0, flex: 1 }}>
          {view === "map" ? (
            <React.Fragment>
              <main style={{ position: "relative", minWidth: 0, flex: 1 }}>
                <HexMap hexes={hexes} plots={plots} selected={selected} onSelect={setSelected} defeated={defeated} />
              </main>
              <aside style={{ display: "flex", flexDirection: "column", width: 360, borderLeft: "1px solid var(--hairline)", background: "var(--panel)" }}>
                <div style={{ minHeight: 0, flex: 1, overflowY: "auto" }}>
                  <PlotPanel hex={hex} plot={plot} war={war} defeated={defeated} onClaim={claim} onBuild={buildOn} onScout={scout} onRaid={raid} onUnstake={unstake} />
                </div>
                <EventLog log={log} />
              </aside>
            </React.Fragment>
          ) : (
            <div style={{ minHeight: 0, flex: 1, overflowY: "auto" }}>
              {view === "market" && <MarketPanel onTrade={trade} />}
              {view === "season" && <SeasonPanel pool={pool} burned={burned} plots={plots} />}
              {view === "allegiance" && <AllegianceStub />}
            </div>
          )}
        </div>
      </div>
    );
  }

  window.GameShell = GameShell;
})();
