// WARLANDS War Room — side-rail panels (Plot management, Market, Army).
const DSp = window.WARLANDSDesignSystem_2e7699;
const { Button: Btn, Badge: Bdg, Stat: St, Panel: Pnl, ProgressBar: Prog, ResourceChip: Chip } = DSp;
const { TERRAIN: T, RESOURCES: RES, BUILDINGS: BLD, UNITS: UN } = window.WL_DATA;
const { Icon: Ic, fmt: f } = window.WL_SCREENS;

function Row({ label, value, valColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ color: valColor || "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

function PlotPanel({ hex, plot, war, onClaim, onBuild, onCollect, onUpgrade }) {
  if (!hex) return <div style={{ padding: 16, fontSize: 13, color: "var(--text-lo)" }}>Select a hex on the map to inspect or claim it.</div>;
  const def = T[hex.terrain];

  // Enemy hex
  if (hex.enemy && !plot) {
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="wl-title" style={{ fontSize: 18, color: def.color }}>{def.name}</div>
          <Bdg tone="blood" variant="solid">Hostile</Bdg>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-lo)" }}>Hex ({hex.q}, {hex.r}) · ring {hex.ring} · held by Iron Syndicate</div>
        <Pnl label="Scouted defenses" rim="blood" padding="12px">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Row label="Est. lootable Gold" value={`${f(4200)} $WAR`} valColor="var(--amber-text)" />
            <Row label="Defense power" value="2,840" />
            <Row label="Garrison" value="Infantry ×18 · Tanks ×4" />
          </div>
        </Pnl>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" full icon="🔭">Scout</Btn>
          <Btn variant="danger" full icon="⚔️">Siege</Btn>
        </div>
      </div>
    );
  }

  // Unclaimed
  if (!plot) {
    const canAfford = war >= def.stake;
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div className="wl-title" style={{ fontSize: 18, color: def.color }}>{def.name}</div>
          <div style={{ fontSize: 12, color: "var(--text-lo)" }}>Hex ({hex.q}, {hex.r}) · ring {hex.ring}</div>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{def.blurb}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: 12, borderRadius: "var(--radius-md)", background: "rgba(26,32,48,0.5)" }}>
          <Row label="Stake to claim" value={`${f(def.stake)} $WAR`} />
          <Row label="Defense mult" value={`×${def.def}`} />
          <Row label="Reward mult" value={`×${def.reward}`} />
          <Row label="Protection" value={hex.terrain === "warzone" ? "never (warzone)" : "eligible"} />
        </div>
        <Btn variant="primary" full icon="⚔️" disabled={!canAfford} onClick={() => onClaim(hex)}>
          {canAfford ? `Stake ${f(def.stake)} $WAR & Claim` : "Insufficient $WAR"}
        </Btn>
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
          Staked $WAR is <span style={{ color: "var(--text-secondary)" }}>locked, never spent</span>. Returned on unstake minus a 3% fee. Never lootable.
        </p>
      </div>
    );
  }

  // Owned
  const slotCap = 6;
  const used = plot.buildings.length;
  const ready = Object.values(plot.resources).some((v) => v > 1);
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="wl-title" style={{ fontSize: 18, color: def.color }}>{def.name}</div>
          <Bdg tone="amber">Owned</Bdg>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-lo)" }}>staked {f(def.stake)} $WAR · ring {hex.ring}</div>
        <div style={{ marginTop: 8 }}>
          <Prog value={plot.defensePct} max={100} tone={plot.defensePct < 60 ? "blood" : "emerald"} label="Defense" valueText={`${plot.defensePct}%`} />
        </div>
      </div>

      <div>
        <div className="wl-label" style={{ marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
          <span>Stockpile · cap 2,000</span>
          {ready && <Btn variant="success" size="sm" onClick={() => onCollect(hex.key)}>Collect</Btn>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {Object.entries(plot.resources).filter(([, v]) => v > 0.01).map(([id, v]) => (
            <Chip key={id} icon={<Ic src={RES[id].art} size={15} />} name={RES[id].name} amount={f(v)} tier={RES[id].tier} size="sm" />
          ))}
          {Object.keys(plot.resources).length === 0 && <div style={{ fontSize: 12, color: "var(--text-muted)", gridColumn: "1/3" }}>Empty — build an extractor to start production.</div>}
        </div>
      </div>

      {plot.buildings.length > 0 && (
        <div>
          <div className="wl-label" style={{ marginBottom: 6, display: "flex", justifyContent: "space-between" }}><span>Buildings</span><span style={{ color: "var(--text-muted)" }}>slots {used}/{slotCap}</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {plot.buildings.map((b, i) => {
              const bd = BLD.find((x) => x.id === b.id);
              const cost = Math.round(bd.cost * Math.pow(1.6, b.level));
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 8, borderRadius: "var(--radius-sm)", background: "rgba(26,32,48,0.5)", fontSize: 12 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Ic src={bd.art} size={18} /> {bd.name} <span style={{ color: "var(--text-muted)" }}>L{b.level}</span></span>
                  <Btn variant="info" size="sm" disabled={war < cost} onClick={() => onUpgrade(hex.key, i)}>⬆ {f(cost)}</Btn>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="wl-label" style={{ marginBottom: 6 }}>Construct</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {BLD.map((bd) => {
            const blocked = used >= slotCap || war < bd.cost;
            return (
              <button key={bd.id} onClick={() => !blocked && onBuild(hex.key, bd)} disabled={blocked}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 8px", textAlign: "left", borderRadius: "var(--radius-sm)", border: "1px solid var(--hairline)", background: "rgba(26,32,48,0.6)", fontSize: 12, color: "var(--text-hi)", cursor: blocked ? "not-allowed" : "pointer", opacity: blocked ? 0.4 : 1 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Ic src={bd.art} size={18} /> {bd.name}</span>
                <span className="wl-num" style={{ fontSize: 10, color: "var(--text-lo)" }}>{f(bd.cost)} $WAR</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MarketPanel() {
  const orders = [
    { side: "BUY", res: "steel", qty: 240, px: 12, who: "Vanguard" },
    { side: "SELL", res: "oil", qty: 600, px: 7, who: "Cartel-9" },
    { side: "SELL", res: "rifles", qty: 80, px: 34, who: "you" },
    { side: "BUY", res: "electronics", qty: 120, px: 41, who: "TechRuin DAO" },
    { side: "SELL", res: "iron", qty: 1200, px: 4, who: "Northwall" },
  ];
  return (
    <div style={{ padding: 16, maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
      <Pnl title="Player Marketplace" accent headerRight={<Bdg tone="teal">P2P order book</Bdg>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {orders.map((o, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "56px 1fr auto auto", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "rgba(26,32,48,0.5)" }}>
              <Bdg tone={o.side === "BUY" ? "emerald" : "blood"} variant="solid">{o.side}</Bdg>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-hi)" }}><Ic src={RES[o.res] ? RES[o.res].art : RES.iron.art} size={16} /> {RES[o.res] ? RES[o.res].name : o.res} <span className="wl-num" style={{ color: "var(--text-muted)", fontSize: 11 }}>×{o.qty}</span></span>
              <span className="wl-num" style={{ fontSize: 13, color: "var(--amber-text)" }}>{o.px} $WAR</span>
              <Btn variant={o.who === "you" ? "ghost" : "secondary"} size="sm">{o.who === "you" ? "Cancel" : "Fill"}</Btn>
            </div>
          ))}
        </div>
      </Pnl>
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Market fees are a token sink — every fill burns a slice of $WAR.</div>
    </div>
  );
}

function ArmyPanel({ war, army, onTrain }) {
  return (
    <div style={{ padding: 16, maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
      <Pnl title="Barracks · Train Units" accent headerRight={<St label="Housing" value={`${Object.values(army).reduce((a, b) => a + b, 0)}/120`} accent="amber" />}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
          {Object.entries(UN).map(([id, u]) => (
            <div key={id} style={{ padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--hairline)", background: "rgba(26,32,48,0.5)", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Ic src={u.art} size={32} />
                <div style={{ flex: 1 }}>
                  <div className="wl-title" style={{ fontSize: 14 }}>{u.name}</div>
                  <div className="wl-num" style={{ fontSize: 11, color: "var(--text-muted)" }}>ATK {u.atk} · DEF {u.def}</div>
                </div>
                <Bdg tone="neutral">×{army[id] || 0}</Bdg>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4, minHeight: 30 }}>{u.desc}</div>
              <Btn variant="primary" size="sm" full icon="🎖️" disabled={war < u.war} onClick={() => onTrain(id)}>Train · {f(u.war)} $WAR</Btn>
            </div>
          ))}
        </div>
      </Pnl>
    </div>
  );
}

function PlaceholderPanel({ icon, title, note }) {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100%", textAlign: "center", padding: 32 }}>
      <div>
        <div style={{ fontSize: 40, opacity: 0.5 }}>{icon}</div>
        <div className="wl-title" style={{ fontSize: 20, marginTop: 10 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6, maxWidth: 320 }}>{note}</div>
      </div>
    </div>
  );
}

window.WL_PANELS = { PlotPanel, MarketPanel, ArmyPanel, PlaceholderPanel };
