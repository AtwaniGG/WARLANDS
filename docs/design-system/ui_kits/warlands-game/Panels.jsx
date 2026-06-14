/* WARLANDS UI kit — HUD panels. Compose the design-system primitives. */
const DS = window.WARLANDSDesignSystem_e0d283;
const { Button, Badge, Stat, Panel, ResourceChip, ProgressBar, Tabs } = DS;

/* ---------------- Top resource bar ---------------- */
function TopBar({ war, staked, burned, pool, plots, tick }) {
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

/* ---------------- Event log ---------------- */
function EventLog({ log }) {
  return (
    <div style={{ borderTop: "1px solid var(--hairline)", background: "rgba(8,11,17,0.8)", padding: "9px 14px" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 5 }}>Event Log</div>
      <div style={{ maxHeight: 88, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {log.map((line, i) => (
          <div key={i} style={{ fontSize: 12, color: i === 0 ? "var(--text-hi)" : "var(--text-lo)" }}>{line}</div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Plot inspector / claim ---------------- */
function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ color: "var(--text-hi)" }}>{value}</span>
    </div>
  );
}

function PlotPanel({ hex, plot, war, defeated, onClaim, onBuild, onScout, onRaid, onUnstake, claimIndex }) {
  const { TERRAIN, BUILD, RES, fmt } = window.WL;
  if (!hex) {
    return <div style={{ padding: 18, fontSize: 13, color: "var(--text-lo)" }}>Select a hex on the map to inspect or claim it.</div>;
  }
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

  // Owned
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
          {Object.entries(plot.stock).map(([r, v]) => (
            <ResourceChip key={r} icon={RES[r].i} name={RES[r].n} amount={fmt(v)} tier={RES[r].t} size="sm" />
          ))}
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

/* ---------------- Marketplace ---------------- */
function MarketPanel({ war, onTrade }) {
  const { RES, REF, fmt } = window.WL;
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
        <Tabs
          tabs={[{ id: "raw", label: "Raw" }, { id: "intermediate", label: "Intermediate" }, { id: "finished", label: "Finished" }]}
          value={tab} onChange={setTab}
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

/* ---------------- Season ---------------- */
function SeasonPanel({ pool, burned, plots, war }) {
  const { fmt } = window.WL;
  const territory = Object.values(plots).reduce((s, p) => s + Math.round(window.WL.TERRAIN[p.terrain].reward * 100), 0);
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

Object.assign(window, { TopBar, EventLog, PlotPanel, MarketPanel, SeasonPanel });
