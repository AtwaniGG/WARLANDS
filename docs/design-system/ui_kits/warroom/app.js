// WARLANDS War Room — root shell: state, toasts, resource tick, tab routing.
const DSr = window.WARLANDSDesignSystem_2e7699;
const { Tabs: TabsR } = DSr;
const { TopBar, HexMap } = window.WL_SCREENS;
const { PlotPanel, MarketPanel, ArmyPanel, PlaceholderPanel } = window.WL_PANELS;
const { buildWorld, TERRAIN: TT, BUILDINGS: BB } = window.WL_DATA;
const { useState: uS, useEffect: uE, useMemo: uM, useRef: uR } = React;

const TABS = [
  { id: "map", label: "World", icon: "🗺️" },
  { id: "market", label: "Market", icon: "💱" },
  { id: "army", label: "Army", icon: "🎖️" },
  { id: "allegiance", label: "Allegiance", icon: "🤝" },
  { id: "season", label: "Season", icon: "🏆" },
  { id: "shop", label: "Shop", icon: "🔗" },
];

function WarRoom() {
  const hexes0 = uM(() => {
    const hs = buildWorld(4);
    // mark a couple inner hexes hostile
    const enemyKeys = new Set(["1,-2", "-1,1", "2,0"]);
    hs.forEach((h) => { if (enemyKeys.has(h.key)) h.enemy = true; });
    return hs;
  }, []);

  // starting owned cluster on the safe outer rings
  const startPlots = uM(() => {
    const ring3 = hexes0.filter((h) => h.ring === 3 && !h.enemy).slice(0, 2);
    const out = {};
    ring3.forEach((h, i) => {
      out[h.key] = {
        terrain: h.terrain,
        buildings: i === 0 ? [{ id: "farm", level: 2 }, { id: "lumberCamp", level: 1 }] : [{ id: "ironMine", level: 1 }],
        resources: i === 0 ? { food: 340, wood: 120 } : { iron: 86 },
        defensePct: i === 0 ? 72 : 48,
      };
    });
    return out;
  }, [hexes0]);

  const [war, setWar] = uS(80000);
  const [staked, setStaked] = uS(45000);
  const [burned, setBurned] = uS(6540);
  const [pool] = uS(312900);
  const [plots, setPlots] = uS(startPlots);
  const [army, setArmy] = uS({ infantry: 12, tanks: 3 });
  const [selected, setSelected] = uS(Object.keys(startPlots)[0] || null);
  const [view, setView] = uS("map");
  const [toast, setToast] = uS(null);

  const flash = (msg, tone = "amber") => { setToast({ msg, tone }); clearTimeout(window.__wlt); window.__wlt = setTimeout(() => setToast(null), 2200); };

  // resource tick — collectors fill up (juice)
  uE(() => {
    const id = setInterval(() => {
      setPlots((p) => {
        const next = { ...p };
        for (const k of Object.keys(next)) {
          const pl = next[k];
          if (!pl.buildings.length) continue;
          const res = { ...pl.resources };
          pl.buildings.forEach((b) => {
            const bd = BB.find((x) => x.id === b.id);
            if (bd && bd.makes) res[bd.makes] = Math.min(2000, (res[bd.makes] || 0) + b.level * 1.5);
          });
          next[k] = { ...pl, resources: res };
        }
        return next;
      });
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const selHex = hexes0.find((h) => h.key === selected);
  const selPlot = selected ? plots[selected] : null;

  const claim = (hex) => {
    const def = TT[hex.terrain];
    if (war < def.stake) return;
    setWar((w) => w - def.stake);
    setStaked((s) => s + def.stake);
    setPlots((p) => ({ ...p, [hex.key]: { terrain: hex.terrain, buildings: [], resources: {}, defensePct: 50 } }));
    flash(`Claimed ${def.name} · staked ${Math.floor(def.stake).toLocaleString()} $WAR`);
  };
  const build = (key, bd) => {
    if (war < bd.cost) return;
    setWar((w) => w - bd.cost);
    setBurned((b) => b + Math.round(bd.cost * 0.2));
    setPlots((p) => ({ ...p, [key]: { ...p[key], buildings: [...p[key].buildings, { id: bd.id, level: 1 }] } }));
    flash(`Built ${bd.name}`, "emerald");
  };
  const upgrade = (key, i) => {
    setPlots((p) => {
      const pl = p[key]; const b = pl.buildings[i]; const bd = BB.find((x) => x.id === b.id);
      const cost = Math.round(bd.cost * Math.pow(1.6, b.level));
      if (war < cost) return p;
      setWar((w) => w - cost); setBurned((x) => x + Math.round(cost * 0.2));
      const buildings = pl.buildings.map((x, j) => j === i ? { ...x, level: x.level + 1 } : x);
      flash(`Upgraded ${bd.name} → L${b.level + 1}`, "sky");
      return { ...p, [key]: { ...pl, buildings } };
    });
  };
  const collect = (key) => {
    let gained = 0;
    setPlots((p) => { const pl = p[key]; gained = Object.values(pl.resources).reduce((a, b) => a + b, 0); return { ...p, [key]: { ...pl, resources: {} } }; });
    flash(`Collected ${Math.floor(gained).toLocaleString()} resources`, "emerald");
  };
  const train = (id) => {
    const u = window.WL_DATA.UNITS[id];
    if (war < u.war) return;
    setWar((w) => w - u.war);
    setArmy((a) => ({ ...a, [id]: (a[id] || 0) + 1 }));
    flash(`Trained 1× ${u.name}`, "amber");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--panel-void)", color: "var(--text-hi)", overflow: "hidden" }}>
      <TopBar war={war} staked={staked} burned={burned} pool={pool} plots={Object.keys(plots).length} />
      <TabsR tabs={TABS} value={view} onChange={setView} />

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "row" }}>
        {view === "map" && (
          <>
            <main style={{ position: "relative", flex: 1, minWidth: 0 }}>
              <HexMap hexes={hexes0} plots={plots} selected={selected} onSelect={setSelected} />
            </main>
            <aside style={{ width: 360, flexShrink: 0, borderLeft: "1px solid var(--hairline)", background: "var(--panel)", overflowY: "auto" }}>
              <PlotPanel hex={selHex} plot={selPlot} war={war} onClaim={claim} onBuild={build} onCollect={collect} onUpgrade={upgrade} />
            </aside>
          </>
        )}
        {view === "market" && <div style={{ flex: 1, overflowY: "auto" }}><MarketPanel /></div>}
        {view === "army" && <div style={{ flex: 1, overflowY: "auto" }}><ArmyPanel war={war} army={army} onTrain={train} /></div>}
        {view === "allegiance" && <div style={{ flex: 1 }}><PlaceholderPanel icon="🤝" title="Allegiance" note="Found or join an Allegiance to pool treasury, build shared buffs, and govern territory together." /></div>}
        {view === "season" && <div style={{ flex: 1 }}><PlaceholderPanel icon="🏆" title="Season 4" note="18d 04h remaining. Ranked rewards funded entirely by sinks — payouts never exceed what was collected." /></div>}
        {view === "shop" && <div style={{ flex: 1 }}><PlaceholderPanel icon="🔗" title="$WAR Shop" note="Buy builders, instant-finishes, shield extensions and cosmetics. Earn $WAR from raids and league finishes." /></div>}
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 50, display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: "var(--radius-md)", background: "var(--panel-2)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow-2)", animation: "wl-toast 0.2s var(--ease-snap)" }}>
          <span style={{ height: 8, width: 8, borderRadius: 999, background: `var(--${toast.tone === "emerald" ? "success" : toast.tone === "sky" ? "sky" : toast.tone === "blood" ? "danger-strong" : "amber"})` }} />
          <span style={{ fontSize: 13, color: "var(--text-hi)" }}>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<WarRoom />);
