"use client";
import { useState } from "react";
import { useWorldSocket } from "@/lib/useWorldSocket";
import { PLOT_TYPES } from "@/game/plotTypes";
import { axialToPixel } from "@/game/world";
import { BUILDINGS, isBuildingAllowedOnTerrain, type BuildingId } from "@/game/buildings";
import { RESOURCES, type ResourceId } from "@/game/resources";
import { upgradeCost } from "@/game/formulas";

const SERVER_URL = process.env.NEXT_PUBLIC_GAME_SERVER_URL ?? "ws://localhost:8080";
const SIZE = 16;

// Buildings offered in the slice UI; filtered by terrain.
const OFFER: BuildingId[] = [
  "farm", "well", "lumberCamp", "quarry", "ironMine", "mineralMine", "oilDerrick", "dataExcavator",
  "refinery", "foundry", "armsFactory", "heavyWorks", "electronicsLab", "warehouse",
];

export default function WorldPage() {
  const { state, playerId, connected, error, send } = useWorldSocket(SERVER_URL);
  const [sel, setSel] = useState<string | null>(null);

  if (!state) {
    return (
      <main style={page}>{connected ? "Loading world…" : `Connecting to ${SERVER_URL}…`}</main>
    );
  }

  const me = playerId ? state.players[playerId] : null;
  const selPlot = sel ? state.plots[sel] : null;
  const selHex = sel ? state.hexes[sel] : null;
  const mine = Object.values(state.plots).filter((p) => p.owner === playerId).length;

  return (
    <main style={page}>
      <h1 style={{ margin: "0 0 8px", fontSize: 20 }}>WARLANDS · Live World</h1>
      <div style={{ fontSize: 13, opacity: 0.85 }}>
        {connected ? "🟢 connected" : "🔴 offline"} · tick {state.tick} · players{" "}
        {Object.keys(state.players).length} · burned {Math.round(state.burned ?? 0).toLocaleString()} ·{" "}
        you: {me ? `${Math.round(me.war).toLocaleString()} $WAR · ${mine} plots` : "—"}
      </div>
      {error && <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 4 }}>⚠ {error}</div>}

      <svg viewBox="-180 -180 360 360" width={540} height={540} style={{ marginTop: 12, background: "#11141b", borderRadius: 8 }}>
        {Object.values(state.hexes).map((h) => {
          const key = `${h.q},${h.r}`;
          const { x, y } = axialToPixel(h.q, h.r, SIZE);
          const plot = state.plots[key];
          const owned = plot?.owner === playerId;
          const enemy = plot && !owned;
          return (
            <circle
              key={key}
              cx={x}
              cy={y}
              r={SIZE * 0.62}
              fill={PLOT_TYPES[h.terrain].color}
              stroke={owned ? "#ffffff" : enemy ? "#ff5252" : sel === key ? "#ffd54f" : "#00000088"}
              strokeWidth={owned || enemy || sel === key ? 2 : 0.5}
              onClick={() => setSel(key)}
              style={{ cursor: "pointer" }}
            />
          );
        })}
      </svg>

      {selHex && (
        <div style={{ marginTop: 12, fontSize: 13, maxWidth: 540 }}>
          <div style={{ marginBottom: 6 }}>
            Selected <b>{sel}</b> · {PLOT_TYPES[selHex.terrain].name} · stake{" "}
            {PLOT_TYPES[selHex.terrain].stake.toLocaleString()} $WAR
          </div>

          {!selPlot && (
            <button onClick={() => { const [q, r] = sel!.split(",").map(Number); send({ type: "stake", q, r }); }} style={btn}>
              Stake this plot
            </button>
          )}

          {selPlot?.owner === playerId && (
            <div>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>
                {Object.entries(selPlot.resources)
                  .filter(([, v]) => (v ?? 0) > 0.5)
                  .map(([k, v]) => `${RESOURCES[k as ResourceId]?.icon ?? ""}${Math.round(v ?? 0)}`)
                  .join("  ") || "no resources yet"}
              </div>

              {/* per-building: level, upgrade, factory product select */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                {selPlot.buildings.map((b, i) => {
                  const def = BUILDINGS[b.id];
                  const cost = upgradeCost(def.baseCost || 200, b.level + 1);
                  const maxed = b.level >= def.maxLevel;
                  return (
                    <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ minWidth: 150 }}>{def.icon} {def.name} L{b.level}</span>
                      {b.id !== "camp" || def.maxLevel > 1 ? (
                        <button onClick={() => send({ type: "upgrade", key: sel!, index: i })} style={btnSm} disabled={maxed}>
                          {maxed ? "max" : `↑ L${b.level + 1} (${cost.toLocaleString()})`}
                        </button>
                      ) : null}
                      {def.kind === "factory" && def.makes && (
                        <select
                          value={b.activeProduct ?? def.makes[0]}
                          onChange={(e) => send({ type: "setProduct", key: sel!, index: i, product: e.target.value as ResourceId })}
                          style={select}
                        >
                          {def.makes.map((p) => (
                            <option key={p} value={p}>{RESOURCES[p].name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* build new */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {OFFER.filter((id) => isBuildingAllowedOnTerrain(BUILDINGS[id], PLOT_TYPES[selPlot.terrain].produces)).map((id) => (
                  <button key={id} onClick={() => send({ type: "build", key: sel!, buildingId: id })} style={btnSm}>
                    + {BUILDINGS[id].name} ({BUILDINGS[id].baseCost})
                  </button>
                ))}
              </div>

              <button onClick={() => { send({ type: "unstake", key: sel! }); setSel(null); }} style={btnDanger}>
                Unstake (3% fee)
              </button>
            </div>
          )}

          {selPlot && selPlot.owner !== playerId && <div style={{ color: "#ff8a80" }}>Held by another commander.</div>}
        </div>
      )}
    </main>
  );
}

const page: React.CSSProperties = {
  padding: 16,
  fontFamily: "monospace",
  color: "#e8e8e8",
  background: "#0d0f14",
  minHeight: "100vh",
};
const btn: React.CSSProperties = {
  background: "#1f2a44",
  color: "#e8e8e8",
  border: "1px solid #2f3e63",
  borderRadius: 6,
  padding: "6px 10px",
  fontFamily: "monospace",
  fontSize: 12,
  cursor: "pointer",
};
const btnSm: React.CSSProperties = { ...btn, padding: "3px 7px", fontSize: 11 };
const btnDanger: React.CSSProperties = { ...btn, background: "#3a1d1d", border: "1px solid #6b2f2f" };
const select: React.CSSProperties = {
  background: "#1f2a44",
  color: "#e8e8e8",
  border: "1px solid #2f3e63",
  borderRadius: 6,
  padding: "2px 4px",
  fontFamily: "monospace",
  fontSize: 11,
};
