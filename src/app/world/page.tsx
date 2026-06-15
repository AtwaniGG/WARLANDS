"use client";
import { useState, useRef } from "react";
import { useWorldSocket } from "@/lib/useWorldSocket";
import { PLOT_TYPES } from "@/game/plotTypes";
import { axialToPixel } from "@/game/world";
import { BUILDINGS, isBuildingAllowedOnTerrain, type BuildingId } from "@/game/buildings";
import { RESOURCES, type ResourceId } from "@/game/resources";
import { UNITS, UNIT_IDS, armySize, type Army } from "@/game/units";
import { upgradeCost } from "@/game/formulas";
import { ALLEGIANCE_BUILDINGS, type AllegianceBuildingId } from "@/game/allegiance";

const SERVER_URL = process.env.NEXT_PUBLIC_GAME_SERVER_URL ?? "ws://localhost:8080";
const SIZE = 16;

const OFFER: BuildingId[] = [
  "farm", "well", "lumberCamp", "quarry", "ironMine", "mineralMine", "oilDerrick", "dataExcavator",
  "refinery", "foundry", "armsFactory", "heavyWorks", "electronicsLab", "warehouse",
];

function fmtArmy(a: Army): string {
  return UNIT_IDS.filter((id) => (a[id] ?? 0) > 0).map((id) => `${UNITS[id].icon}${a[id]}`).join(" ") || "—";
}

export default function WorldPage() {
  const { state, playerId, connected, error, report, send, clearReport } = useWorldSocket(SERVER_URL);
  const [sel, setSel] = useState<string | null>(null);

  // map pan/zoom (mouse + touch + wheel)
  const [wv, setWv] = useState({ x: 0, y: 0, s: 1 });
  const wdrag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const wtouch = useRef<{ mode: "pan" | "pinch"; sx: number; sy: number; ox: number; oy: number; d0: number; s0: number } | null>(null);
  const clampS = (s: number) => Math.min(3, Math.max(1, s));
  const wZoom = (f: number) => setWv((v) => ({ ...v, s: clampS(v.s * f) }));
  const wReset = () => setWv({ x: 0, y: 0, s: 1 });
  const wWheel = (e: React.WheelEvent) => setWv((v) => ({ ...v, s: clampS(v.s - e.deltaY * 0.0015) }));
  const wDown = (e: React.MouseEvent) => { wdrag.current = { sx: e.clientX, sy: e.clientY, ox: wv.x, oy: wv.y }; };
  const wMove = (e: React.MouseEvent) => { const d = wdrag.current; if (!d) return; setWv((v) => ({ ...v, x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) })); };
  const wUp = () => { wdrag.current = null; };
  const wtd = (a: React.Touch, b: React.Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const wTStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) { const t = e.touches[0]; wtouch.current = { mode: "pan", sx: t.clientX, sy: t.clientY, ox: wv.x, oy: wv.y, d0: 0, s0: wv.s }; }
    else if (e.touches.length === 2) { wtouch.current = { mode: "pinch", sx: 0, sy: 0, ox: wv.x, oy: wv.y, d0: wtd(e.touches[0], e.touches[1]), s0: wv.s }; }
  };
  const wTMove = (e: React.TouchEvent) => {
    const t = wtouch.current; if (!t) return;
    if (t.mode === "pan" && e.touches.length === 1) { const p = e.touches[0]; setWv((v) => ({ ...v, x: t.ox + (p.clientX - t.sx), y: t.oy + (p.clientY - t.sy) })); }
    else if (t.mode === "pinch" && e.touches.length === 2) { const d = wtd(e.touches[0], e.touches[1]); setWv((v) => ({ ...v, s: clampS(t.s0 * (d / (t.d0 || 1))) })); }
  };
  const wTEnd = (e: React.TouchEvent) => { if (e.touches.length === 0) wtouch.current = null; };

  if (!state) {
    return <main style={page}>{connected ? "Loading world…" : `Connecting to ${SERVER_URL}…`}</main>;
  }

  const me = playerId ? state.players[playerId] : null;
  const myPlots = Object.entries(state.plots).filter(([, p]) => p.owner === playerId);
  const selPlot = sel ? state.plots[sel] : null;
  const selHex = sel ? state.hexes[sel] : null;

  // strongest owned plot with an army = default raid origin
  const origin = myPlots
    .map(([k, p]) => ({ k, size: armySize(p.army ?? {}) }))
    .filter((x) => x.size > 0)
    .sort((a, b) => b.size - a.size)[0];

  // where market purchases / cancellations deposit goods: selected owned plot, else first owned plot
  const destKey: string | null = selPlot?.owner === playerId ? sel : myPlots[0]?.[0] ?? null;

  return (
    <main style={page}>
      <h1 style={{ margin: "0 0 8px", fontSize: 20 }}>WARLANDS · Live World</h1>
      <div style={{ fontSize: 13, opacity: 0.85 }}>
        {connected ? "🟢 connected" : "🔴 offline"} · tick {state.tick} · players{" "}
        {Object.keys(state.players).length} · burned {Math.round(state.burned ?? 0).toLocaleString()} ·{" "}
        you: {me ? `${Math.round(me.war).toLocaleString()} $WAR · ${myPlots.length} plots` : "—"}
      </div>
      {error && <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 4 }}>⚠ {error}</div>}

      <div
        style={{ position: "relative", marginTop: 12, width: "100%", maxWidth: 540, aspectRatio: "1 / 1", background: "#11141b", borderRadius: 8, overflow: "hidden", touchAction: "none", cursor: "grab" }}
        onWheel={wWheel}
        onMouseDown={wDown}
        onMouseMove={wMove}
        onMouseUp={wUp}
        onMouseLeave={wUp}
        onTouchStart={wTStart}
        onTouchMove={wTMove}
        onTouchEnd={wTEnd}
      >
        <svg viewBox="-180 -180 360 360" style={{ width: "100%", height: "100%", display: "block", transform: `translate(${wv.x}px,${wv.y}px) scale(${wv.s})`, transformOrigin: "center", transition: wtouch.current || wdrag.current ? "none" : "transform .08s linear" }}>
          {Object.values(state.hexes).map((h) => {
            const key = `${h.q},${h.r}`;
            const { x, y } = axialToPixel(h.q, h.r, SIZE);
            const plot = state.plots[key];
            const owned = plot?.owner === playerId;
            const enemy = plot && !owned;
            return (
              <circle key={key} cx={x} cy={y} r={SIZE * 0.62}
                fill={PLOT_TYPES[h.terrain].color}
                stroke={owned ? "#ffffff" : enemy ? "#ff5252" : sel === key ? "#ffd54f" : "#00000088"}
                strokeWidth={owned || enemy || sel === key ? 2 : 0.5}
                onClick={() => setSel(key)} style={{ cursor: "pointer" }} />
            );
          })}
        </svg>
        <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={() => wZoom(1.3)} aria-label="Zoom in" style={zoomBtn}>＋</button>
          <button onClick={() => wZoom(1 / 1.3)} aria-label="Zoom out" style={zoomBtn}>－</button>
          <button onClick={wReset} aria-label="Reset view" style={{ ...zoomBtn, fontSize: 15 }}>⟳</button>
        </div>
        <div style={{ position: "absolute", top: 8, right: 10, fontSize: 10, color: "#6b7280", pointerEvents: "none" }}>drag · pinch · ＋－</div>
      </div>

      {selHex && (
        <div style={{ marginTop: 12, fontSize: 13, maxWidth: 560 }}>
          <div style={{ marginBottom: 6 }}>
            Selected <b>{sel}</b> · {PLOT_TYPES[selHex.terrain].name} · stake {PLOT_TYPES[selHex.terrain].stake.toLocaleString()} $WAR
          </div>

          {!selPlot && (
            <button onClick={() => { const [q, r] = sel!.split(",").map(Number); send({ type: "stake", q, r }); }} style={btn}>
              Stake this plot
            </button>
          )}

          {/* ---- OWNED PLOT ---- */}
          {selPlot?.owner === playerId && (
            <div>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>
                {Object.entries(selPlot.resources).filter(([, v]) => (v ?? 0) > 0.5)
                  .map(([k, v]) => `${RESOURCES[k as ResourceId]?.icon ?? ""}${Math.round(v ?? 0)}`).join("  ") || "no resources yet"}
              </div>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>
                🛡 defense {Math.round((selPlot.defensePct ?? 1) * 100)}% · army {fmtArmy(selPlot.army ?? {})}
                {selPlot.trainQueue.length > 0 && ` · training ${selPlot.trainQueue.map((o) => UNITS[o.unit].icon + o.ticksLeft).join(" ")}`}
              </div>

              {/* buildings */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                {selPlot.buildings.map((b, i) => {
                  const def = BUILDINGS[b.id];
                  const cost = upgradeCost(def.baseCost || 200, b.level + 1);
                  const maxed = b.level >= def.maxLevel;
                  return (
                    <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ minWidth: 150 }}>{def.icon} {def.name} L{b.level}</span>
                      <button onClick={() => send({ type: "upgrade", key: sel!, index: i })} style={btnSm} disabled={maxed}>
                        {maxed ? "max" : `↑ (${cost.toLocaleString()})`}
                      </button>
                      {def.kind === "factory" && def.makes && (
                        <select value={b.activeProduct ?? def.makes[0]} style={select}
                          onChange={(e) => send({ type: "setProduct", key: sel!, index: i, product: e.target.value as ResourceId })}>
                          {def.makes.map((p) => <option key={p} value={p}>{RESOURCES[p].name}</option>)}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* build */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {OFFER.filter((id) => isBuildingAllowedOnTerrain(BUILDINGS[id], PLOT_TYPES[selPlot.terrain].produces)).map((id) => (
                  <button key={id} onClick={() => send({ type: "build", key: sel!, buildingId: id })} style={btnSm}>
                    + {BUILDINGS[id].name} ({BUILDINGS[id].baseCost})
                  </button>
                ))}
              </div>

              {/* train */}
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>Train units:</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {UNIT_IDS.map((id) => (
                  <button key={id} onClick={() => send({ type: "train", key: sel!, unit: id })} style={btnSm}
                    title={UNITS[id].desc}>
                    {UNITS[id].icon} {UNITS[id].name} ({UNITS[id].costWar})
                  </button>
                ))}
              </div>

              {/* sell on market */}
              {Object.entries(selPlot.resources).some(([, v]) => (v ?? 0) >= 10) && (
                <>
                  <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>Sell on market (lists 50 @ ref price):</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {(Object.keys(selPlot.resources) as ResourceId[])
                      .filter((it) => (selPlot.resources[it] ?? 0) >= 10)
                      .map((it) => {
                        const qty = Math.min(50, Math.floor(selPlot.resources[it] ?? 0));
                        const price = state.market.refPrices[it] ?? 1;
                        return (
                          <button key={it} style={btnSm}
                            onClick={() => send({ type: "list", key: sel!, item: it, qty, price })}>
                            {RESOURCES[it].icon} ×{qty} @{price}
                          </button>
                        );
                      })}
                  </div>
                </>
              )}

              <button onClick={() => { send({ type: "unstake", key: sel! }); setSel(null); }} style={btnDanger}>Unstake (3% fee)</button>
            </div>
          )}

          {/* ---- ENEMY PLOT: raid ---- */}
          {selPlot && selPlot.owner !== playerId && (
            <div>
              <div style={{ color: "#ff8a80", marginBottom: 6 }}>
                Enemy plot · 🛡 {Math.round((selPlot.defensePct ?? 1) * 100)}% · garrison {fmtArmy(selPlot.army ?? {})}
              </div>
              {origin ? (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Attack from {origin.k} ({fmtArmy(state.plots[origin.k].army)}):</span>
                  <button style={btn} onClick={() => send({ type: "raid", fromKey: origin.k, targetKey: sel!, army: state.plots[origin.k].army, intent: "raid" })}>⚔ Raid</button>
                  <button style={btn} onClick={() => send({ type: "raid", fromKey: origin.k, targetKey: sel!, army: state.plots[origin.k].army, intent: "siege" })}>🏰 Siege</button>
                </div>
              ) : (
                <div style={{ fontSize: 12, opacity: 0.7 }}>Train an army on one of your plots to raid.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---- MARKETPLACE ---- */}
      <div style={{ marginTop: 16, maxWidth: 560 }}>
        <div style={{ fontSize: 13, marginBottom: 4 }}>🏪 Marketplace {destKey ? "" : "(stake a plot to trade)"}</div>
        {state.market.book.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.6 }}>No listings yet — sell something from one of your plots.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {[...state.market.book].sort((a, b) => a.item.localeCompare(b.item) || a.price - b.price).slice(0, 16).map((o) => {
              const mine = o.owner === playerId;
              return (
                <div key={o.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
                  <span style={{ minWidth: 150 }}>{RESOURCES[o.item].icon} {RESOURCES[o.item].name} ×{o.qty} @ {o.price} $WAR</span>
                  {mine ? (
                    <button style={btnSm} disabled={!destKey} onClick={() => send({ type: "cancel", orderId: o.id, toKey: destKey! })}>Cancel</button>
                  ) : (
                    <button style={btnSm} disabled={!destKey} onClick={() => send({ type: "buy", item: o.item, qty: o.qty, toKey: destKey! })}>
                      Buy ×{o.qty}
                    </button>
                  )}
                  <span style={{ fontSize: 11, opacity: 0.5 }}>{mine ? "yours" : ""}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- ALLEGIANCES ---- */}
      <div style={{ marginTop: 16, maxWidth: 560 }}>
        <div style={{ fontSize: 13, marginBottom: 4 }}>🤝 Allegiances</div>
        {(() => {
          const myAllyId = me?.allegianceId ?? null;
          const myAlly = myAllyId ? state.allegiances[myAllyId] : null;
          if (myAlly) {
            const isFounder = myAlly.founder === playerId;
            const owned = new Set(myAlly.buildings);
            return (
              <div style={{ fontSize: 12 }}>
                <div style={{ marginBottom: 4 }}>
                  <b>{myAlly.name}</b> · {myAlly.members.length} members · treasury {Math.round(myAlly.treasuryWar).toLocaleString()} $WAR ·
                  your contribution {Math.round(myAlly.contributions[playerId!] ?? 0).toLocaleString()}
                </div>
                <div style={{ marginBottom: 6, opacity: 0.85 }}>
                  buildings: {myAlly.buildings.map((b) => `${ALLEGIANCE_BUILDINGS[b].icon}${ALLEGIANCE_BUILDINGS[b].name}`).join(", ")}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                  {[1000, 5000].map((amt) => (
                    <button key={amt} style={btnSm} onClick={() => send({ type: "contribute", amount: amt })}>Contribute {amt.toLocaleString()}</button>
                  ))}
                  <button style={btnDanger} onClick={() => send({ type: "leaveAllegiance" })}>Leave</button>
                </div>
                {isFounder && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, opacity: 0.6, alignSelf: "center" }}>founder build:</span>
                    {(["fortress", "research", "tradeHub", "radar", "factory", "shield"] as AllegianceBuildingId[])
                      .filter((b) => !owned.has(b))
                      .map((b) => (
                        <button key={b} style={btnSm} disabled={myAlly.treasuryWar < ALLEGIANCE_BUILDINGS[b].cost}
                          title={ALLEGIANCE_BUILDINGS[b].benefit}
                          onClick={() => send({ type: "allegianceBuild", buildingId: b })}>
                          + {ALLEGIANCE_BUILDINGS[b].icon}{ALLEGIANCE_BUILDINGS[b].name} ({ALLEGIANCE_BUILDINGS[b].cost.toLocaleString()})
                        </button>
                      ))}
                  </div>
                )}

                {/* governance: propose + vote (any member) */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, opacity: 0.6, alignSelf: "center" }}>propose:</span>
                  {(["fortress", "research", "tradeHub", "radar", "factory", "shield"] as AllegianceBuildingId[])
                    .filter((b) => !owned.has(b) && !myAlly.proposals.some((p) => !p.resolved && p.buildingId === b))
                    .map((b) => (
                      <button key={b} style={btnSm} title={ALLEGIANCE_BUILDINGS[b].benefit}
                        onClick={() => send({ type: "propose", buildingId: b })}>
                        🗳 {ALLEGIANCE_BUILDINGS[b].icon}{ALLEGIANCE_BUILDINGS[b].name}
                      </button>
                    ))}
                </div>
                {myAlly.proposals.filter((p) => !p.resolved).map((p) => {
                  const voted = p.for.includes(playerId!) || p.against.includes(playerId!);
                  return (
                    <div key={p.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                      <span style={{ minWidth: 170 }}>
                        🗳 {ALLEGIANCE_BUILDINGS[p.buildingId].name} · {p.for.length}✓/{p.against.length}✗ · closes t{p.closesAtTick}
                      </span>
                      {!voted ? (
                        <>
                          <button style={btnSm} onClick={() => send({ type: "vote", proposalId: p.id, support: true })}>For</button>
                          <button style={btnSm} onClick={() => send({ type: "vote", proposalId: p.id, support: false })}>Against</button>
                        </>
                      ) : <span style={{ fontSize: 11, opacity: 0.5 }}>voted</span>}
                    </div>
                  );
                })}
              </div>
            );
          }
          // not in an allegiance: found or join
          const others = Object.values(state.allegiances);
          return (
            <div style={{ fontSize: 12 }}>
              <button style={btn} disabled={!me || me.war < 5000}
                onClick={() => { const name = window.prompt("Allegiance name?"); if (name) send({ type: "found", name }); }}>
                Found an allegiance (5,000 $WAR)
              </button>
              {others.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                  {others.map((a) => (
                    <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ minWidth: 180 }}>{a.name} · {a.members.length} members · {a.buildings.length} bldgs</span>
                      <button style={btnSm} onClick={() => send({ type: "joinAllegiance", id: a.id })}>Join</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ---- BATTLE REPORT ---- */}
      {report && (
        <div onClick={clearReport} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} style={modal}>
            <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>
              {report.result.attackerWins ? "⚔ Victory" : "🛡 Repelled"} — raid on {report.targetKey}
            </h2>
            <div style={{ fontSize: 13, marginBottom: 8 }}>{report.result.summary}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>win chance was {Math.round(report.result.winChance * 100)}%</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>
              your losses: {fmtArmy(report.result.attackerLosses)} · enemy losses: {fmtArmy(report.result.defenderLosses)}
            </div>
            {Object.keys(report.result.loot).length > 0 && (
              <div style={{ fontSize: 12, marginTop: 8 }}>
                looted: {Object.entries(report.result.loot).map(([k, v]) => `${RESOURCES[k as ResourceId]?.icon ?? ""}${Math.round(v as number)}`).join("  ")}
              </div>
            )}
            <button onClick={clearReport} style={{ ...btn, marginTop: 12 }}>Close</button>
          </div>
        </div>
      )}
    </main>
  );
}

const page: React.CSSProperties = { padding: "14px max(12px, env(safe-area-inset-left)) calc(32px + env(safe-area-inset-bottom))", fontFamily: "monospace", color: "#e8e8e8", background: "#0d0f14", minHeight: "100vh" };
const btn: React.CSSProperties = { background: "#1f2a44", color: "#e8e8e8", border: "1px solid #2f3e63", borderRadius: 6, padding: "9px 13px", fontFamily: "monospace", fontSize: 13, cursor: "pointer", minHeight: 38, touchAction: "manipulation" };
const btnSm: React.CSSProperties = { ...btn, padding: "7px 10px", fontSize: 12, minHeight: 34 };
const btnDanger: React.CSSProperties = { ...btn, background: "#3a1d1d", border: "1px solid #6b2f2f" };
const select: React.CSSProperties = { background: "#1f2a44", color: "#e8e8e8", border: "1px solid #2f3e63", borderRadius: 6, padding: "6px 8px", fontFamily: "monospace", fontSize: 12, minHeight: 34 };
const zoomBtn: React.CSSProperties = { width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: 7, background: "rgba(0,0,0,0.6)", border: "1px solid #2f3e63", color: "#ffd54f", fontSize: 19, fontWeight: 700, lineHeight: 1, cursor: "pointer", touchAction: "manipulation" };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
const modal: React.CSSProperties = { background: "#141821", border: "1px solid #2f3e63", borderRadius: 10, padding: 20, maxWidth: 420, fontFamily: "monospace", color: "#e8e8e8" };
