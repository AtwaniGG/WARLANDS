"use client";
import { useState } from "react";
import { useWorldSocket } from "@/lib/useWorldSocket";
import { PLOT_TYPES } from "@/game/plotTypes";
import { axialToPixel } from "@/game/world";
import { BUILDINGS, isBuildingAllowedOnTerrain, type BuildingId } from "@/game/buildings";

const SERVER_URL = process.env.NEXT_PUBLIC_GAME_SERVER_URL ?? "ws://localhost:8080";
const SIZE = 16;

// Buildings offered in the slice UI (extractors + storage); filtered by terrain.
const OFFER: BuildingId[] = ["farm", "well", "lumberCamp", "quarry", "ironMine", "oilDerrick", "warehouse"];

export default function WorldPage() {
  const { state, playerId, connected, error, send } = useWorldSocket(SERVER_URL);
  const [sel, setSel] = useState<string | null>(null);

  if (!state) {
    return (
      <main style={{ padding: 24, fontFamily: "monospace", color: "#e8e8e8", background: "#0d0f14", minHeight: "100vh" }}>
        {connected ? "Loading world…" : `Connecting to ${SERVER_URL}…`}
      </main>
    );
  }

  const me = playerId ? state.players[playerId] : null;
  const selPlot = sel ? state.plots[sel] : null;
  const selHex = sel ? state.hexes[sel] : null;
  const mine = Object.values(state.plots).filter((p) => p.owner === playerId).length;

  return (
    <main style={{ padding: 16, fontFamily: "monospace", color: "#e8e8e8", background: "#0d0f14", minHeight: "100vh" }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 20 }}>WARLANDS · Live World</h1>
      <div style={{ fontSize: 13, opacity: 0.85 }}>
        {connected ? "🟢 connected" : "🔴 offline"} · tick {state.tick} · players {Object.keys(state.players).length} ·{" "}
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
        <div style={{ marginTop: 12, fontSize: 13 }}>
          <div style={{ marginBottom: 6 }}>
            Selected <b>{sel}</b> · {PLOT_TYPES[selHex.terrain].name} · stake{" "}
            {PLOT_TYPES[selHex.terrain].stake.toLocaleString()} $WAR
          </div>

          {!selPlot && (
            <button
              onClick={() => {
                const [q, r] = sel!.split(",").map(Number);
                send({ type: "stake", q, r });
              }}
              style={btn}
            >
              Stake this plot
            </button>
          )}

          {selPlot?.owner === playerId && (
            <div>
              <div style={{ marginBottom: 6, opacity: 0.85 }}>
                Buildings: {selPlot.buildings.map((b) => BUILDINGS[b.id].name).join(", ")}
              </div>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>
                {Object.entries(selPlot.resources)
                  .filter(([, v]) => (v ?? 0) > 0)
                  .map(([k, v]) => `${k} ${Math.round(v ?? 0)}`)
                  .join(" · ") || "no resources yet"}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {OFFER.filter((id) => isBuildingAllowedOnTerrain(BUILDINGS[id], PLOT_TYPES[selPlot.terrain].produces)).map((id) => (
                  <button key={id} onClick={() => send({ type: "build", key: sel!, buildingId: id })} style={btn}>
                    Build {BUILDINGS[id].name} ({BUILDINGS[id].baseCost} $WAR)
                  </button>
                ))}
              </div>
            </div>
          )}

          {enemyOwned(selPlot, playerId) && <div style={{ color: "#ff8a80" }}>Held by another commander.</div>}
        </div>
      )}
    </main>
  );
}

function enemyOwned(plot: { owner: string } | null | undefined, playerId: string | null): boolean {
  return !!plot && plot.owner !== playerId;
}

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
