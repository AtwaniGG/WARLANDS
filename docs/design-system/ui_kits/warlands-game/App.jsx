/* WARLANDS UI kit — game shell orchestrator. */
const R = 4;

function GameShell() {
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

  const push = (line) => setLog((l) => [line, ...l].slice(0, 30));

  // gentle tick so the HUD feels alive
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2200);
    return () => clearInterval(id);
  }, []);

  const hex = selected ? hexes.find((h) => h.key === selected) : null;
  const plot = selected ? plots[selected] : null;

  function claim(h) {
    const def = TERRAIN[h.terrain];
    if (war < def.stake) return;
    setWar((w) => w - def.stake);
    setStaked((s) => s + def.stake);
    setPlots((p) => ({
      ...p,
      [h.key]: { terrain: h.terrain, name: `${def.name.split(" ")[0]} Outpost`, claimIndex: Object.keys(p).length + 1, defense: Math.round(def.def * 60), buildings: ["camp"], stock: { food: 120, wood: 80 } },
    }));
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
    const ret = Math.round(def.stake * 0.97);
    const fee = def.stake - ret;
    setWar((w) => w + ret);
    setStaked((s) => s - def.stake);
    setBurned((b) => b + Math.round(fee / 2));
    setPool((p) => p + Math.round(fee / 2));
    setPlots((p) => { const n = { ...p }; delete n[key]; return n; });
    setSelected(key);
    push(`↩️ Unstaked plot — ${fmt(ret)} $WAR returned (3% fee).`);
  }

  function scout() {
    if (war < 50) return;
    setWar((w) => w - 50);
    setBurned((b) => b + 25); setPool((p) => p + 25);
    push("🔭 Scouted hostile camp — garrison revealed.");
  }
  function raid() {
    if (!hex) return;
    setDefeated((d) => ({ ...d, [hex.key]: true }));
    push(`⚔️ VICTORY — hostile camp at (${hex.q}, ${hex.r}) cleared. Loot hauled back.`);
  }

  function trade(verb, item, qty, price) {
    const gross = qty * price;
    const fee = Math.round(gross * 0.04);
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
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--panel-void)", color: "var(--text-hi)" }}>
      <TopBar war={war} staked={staked} burned={burned} pool={pool} plots={Object.keys(plots).length} tick={tick} />
      <Tabs tabs={TABS} value={view} onChange={setView} />

      <div style={{ display: "flex", minHeight: 0, flex: 1 }}>
        {view === "map" ? (
          <React.Fragment>
            <main style={{ position: "relative", minWidth: 0, flex: 1 }}>
              <HexMap hexes={hexes} plots={plots} selected={selected} onSelect={setSelected} defeated={defeated} R={R} />
            </main>
            <aside style={{ display: "flex", flexDirection: "column", width: 360, borderLeft: "1px solid var(--hairline)", background: "var(--panel)" }}>
              <div style={{ minHeight: 0, flex: 1, overflowY: "auto" }}>
                <PlotPanel hex={hex} plot={plot} war={war} defeated={defeated}
                  onClaim={claim} onBuild={buildOn} onScout={scout} onRaid={raid} onUnstake={unstake} />
              </div>
              <EventLog log={log} />
            </aside>
          </React.Fragment>
        ) : (
          <div style={{ minHeight: 0, flex: 1, overflowY: "auto" }}>
            {view === "market" && <MarketPanel war={war} onTrade={trade} />}
            {view === "season" && <SeasonPanel pool={pool} burned={burned} plots={plots} war={war} />}
            {view === "allegiance" && <AllegianceStub />}
          </div>
        )}
      </div>
    </div>
  );
}

function AllegianceStub() {
  const { Panel, Badge, Button } = window.WARLANDSDesignSystem_e0d283;
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

ReactDOM.createRoot(document.getElementById("root")).render(<GameShell />);
