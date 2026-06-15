"use client";
import { useState, type CSSProperties } from "react";
import { useBaseSocket } from "@/lib/useBaseSocket";
import { axialToPixel } from "@/game/world";
import {
  BUILDINGS, ccTier, levelDef, maxLevelOf,
  type CocBase, type CocBuildingId, type CocResource, type CocWorld, type PlacedBuilding,
} from "@/sim/coc";

const SERVER_URL = process.env.NEXT_PUBLIC_GAME_SERVER_URL ?? "ws://localhost:8080";
const SIZE = 16;
const ICON: Record<CocBuildingId, string> = {
  commandCenter: "🏛️", goldCollector: "⛏️", elixirCollector: "🛢️", goldStorage: "🏦", elixirStorage: "🛍️",
};

function ccLevelOf(base: CocBase): number {
  return base.buildings[base.centerKey]?.level ?? 1;
}
function storageCapOf(base: CocBase, res: CocResource): number {
  let cap = 1000;
  for (const b of Object.values(base.buildings)) {
    const def = BUILDINGS[b.id];
    if (def.stores === res && b.level >= 1) cap += def.levels[b.level - 1]?.storageCap ?? 0;
  }
  return cap;
}

export default function WorldPage() {
  const { state, playerId, connected, error, send } = useBaseSocket(SERVER_URL);
  const [sel, setSel] = useState<string | null>(null);

  if (!state) return <main style={page}>{connected ? "Loading world…" : `Connecting to ${SERVER_URL}…`}</main>;

  const myBase: CocBase | null = playerId ? state.bases[playerId] ?? null : null;
  const tier = myBase ? ccTier(ccLevelOf(myBase)) : null;
  const freeBuilders = myBase ? myBase.builders - myBase.jobs.length : 0;
  const jobByHex = new Map(myBase?.jobs.map((j) => [j.hexKey, j]) ?? []);
  const selBuilding = myBase && sel ? myBase.buildings[sel] : null;

  function onHexClick(key: string, q: number, r: number) {
    if (!myBase) {
      send({ type: "claimBase", q, r });
      return;
    }
    if (myBase.ownedHexes.includes(key)) setSel(key);
  }

  const buildable: CocBuildingId[] = tier ? (Object.keys(tier.caps) as CocBuildingId[]) : [];

  return (
    <main style={page}>
      <h1 style={{ margin: "0 0 6px", fontSize: 20 }}>WARLANDS · Live World</h1>
      <div style={{ fontSize: 13, opacity: 0.85 }}>
        {connected ? "🟢" : "🔴"} tick {state.tick} · players {Object.keys(state.players).length}
      </div>
      {error && <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 4 }}>⚠ {error}</div>}

      {myBase && (
        <div style={hud}>
          <span>🪙 {Math.floor(myBase.gold)} / {storageCapOf(myBase, "gold")}</span>
          <span>🧪 {Math.floor(myBase.elixir)} / {storageCapOf(myBase, "elixir")}</span>
          <span>🏛️ CC {ccLevelOf(myBase)}</span>
          <span>🔨 {freeBuilders}/{myBase.builders} free</span>
          <button style={btn} onClick={() => send({ type: "collect" })}>Collect</button>
        </div>
      )}

      {!myBase && (
        <div style={{ ...hud, color: "#9fe" }}>👉 Tap an empty hex (with all 6 neighbors free) to claim your base.</div>
      )}

      <div style={mapWrap}>
        <svg viewBox="-260 -260 520 520" style={{ width: "100%", height: "100%", display: "block" }}>
          {Object.values(state.hexes).map((h) => {
            const key = `${h.q},${h.r}`;
            const { x, y } = axialToPixel(h.q, h.r, SIZE);
            const owner = state.claimedHexes[key];
            const mine = owner && owner === playerId;
            const b = mine ? myBase!.buildings[key] : undefined;
            const job = mine ? jobByHex.get(key) : undefined;
            const fill = mine ? (sel === key ? "#1d4ed8" : "#13335f") : owner ? "#3a1d1d" : "#11141b";
            return (
              <g key={key} transform={`translate(${x},${y})`} onClick={() => onHexClick(key, h.q, h.r)} style={{ cursor: "pointer" }}>
                <polygon points={hexPoints(SIZE)} fill={fill} stroke={mine ? "#5b8def" : "#222"} strokeWidth={0.6} />
                {b && <text textAnchor="middle" dy="3" fontSize="11">{ICON[b.id]}</text>}
                {b && b.level >= 1 && <text textAnchor="middle" dy="13" fontSize="6" fill="#bcd">L{b.level}</text>}
                {job && <text textAnchor="middle" dy="-7" fontSize="6" fill="#fb3">⏳{Math.max(0, job.finishesAtTick - state.tick)}s</text>}
              </g>
            );
          })}
        </svg>
      </div>

      {myBase && sel && (
        <div style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{sel}</strong>
            <button style={btnGhost} onClick={() => setSel(null)}>✕</button>
          </div>
          {selBuilding ? (
            <BuildingInfo base={myBase} building={selBuilding} busy={jobByHex.has(sel)} freeBuilders={freeBuilders}
              onUpgrade={() => send({ type: "upgradeBuilding", hexKey: sel })} />
          ) : (
            <div>
              <div style={{ opacity: 0.8, fontSize: 12, margin: "6px 0" }}>Empty hex — build:</div>
              {buildable.map((id) => {
                const lv = levelDef(id, 1)!;
                const count = Object.values(myBase.buildings).filter((x) => x.id === id).length;
                const cap = tier!.caps[id]!;
                const atCap = count >= cap.maxCount;
                const afford = myBase.gold >= (lv.cost.gold ?? 0) && myBase.elixir >= (lv.cost.elixir ?? 0);
                const ok = !atCap && afford && freeBuilders > 0;
                return (
                  <button key={id} style={{ ...rowBtn, opacity: ok ? 1 : 0.45 }} disabled={!ok}
                    onClick={() => send({ type: "placeBuilding", hexKey: sel, buildingId: id })}>
                    {ICON[id]} {BUILDINGS[id].name} · {costStr(lv.cost)} · ⏳{lv.buildTimeSec}s {atCap ? "· (limit)" : ""}
                  </button>
                );
              })}
              <ExpandRow base={myBase} state={state} onExpand={(q, r) => send({ type: "expandCluster", q, r })} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function BuildingInfo({ base, building, busy, freeBuilders, onUpgrade }: {
  base: CocBase; building: PlacedBuilding; busy: boolean; freeBuilders: number; onUpgrade: () => void;
}) {
  const next = building.level + 1;
  const maxed = next > maxLevelOf(building.id);
  const cap = ccTier(base.buildings[base.centerKey]?.level ?? 1).caps[building.id];
  const ccBlocked = building.id !== "commandCenter" && (!cap || next > cap.maxLevel);
  const lv = !maxed ? levelDef(building.id, next) : undefined;
  const cost = lv?.cost ?? {};
  const afford = base.gold >= (cost.gold ?? 0) && base.elixir >= (cost.elixir ?? 0);
  const ok = building.level >= 1 && !busy && !maxed && !ccBlocked && afford && freeBuilders > 0;
  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ margin: "6px 0" }}>{ICON[building.id]} {BUILDINGS[building.id].name} {building.level >= 1 ? `· L${building.level}` : "· building…"}</div>
      {building.buffer != null && <div style={{ opacity: 0.8 }}>buffer: {Math.floor(building.buffer)}</div>}
      {maxed ? <div style={{ opacity: 0.7 }}>Max level.</div> :
        <button style={{ ...rowBtn, opacity: ok ? 1 : 0.45 }} disabled={!ok} onClick={onUpgrade}>
          ⬆ Upgrade → L{next} · {costStr(cost)} · ⏳{lv?.buildTimeSec}s
          {ccBlocked ? " · (raise CC)" : busy ? " · (busy)" : ""}
        </button>}
    </div>
  );
}

function ExpandRow({ base, state, onExpand }: { base: CocBase; state: CocWorld; onExpand: (q: number, r: number) => void }) {
  const tier = ccTier(base.buildings[base.centerKey]?.level ?? 1);
  if (base.ownedHexes.length >= tier.maxHexes) return null;
  const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  for (const owned of base.ownedHexes) {
    const [oq, or] = owned.split(",").map(Number);
    for (const [dq, dr] of dirs) {
      const q = oq + dq, r = or + dr, k = `${q},${r}`;
      if (state.hexes[k] && !state.claimedHexes[k]) {
        return <button style={{ ...rowBtn, marginTop: 8 }} onClick={() => onExpand(q, r)}>➕ Annex {k} (free · up to {tier.maxHexes} hexes)</button>;
      }
    }
  }
  return null;
}

function hexPoints(size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${(size * Math.cos(a)).toFixed(2)},${(size * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}
function costStr(cost: Partial<Record<CocResource, number>>): string {
  const parts: string[] = [];
  if (cost.gold) parts.push(`🪙${cost.gold}`);
  if (cost.elixir) parts.push(`🧪${cost.elixir}`);
  return parts.join(" ") || "free";
}

const page: CSSProperties = { minHeight: "100dvh", background: "#0b0d12", color: "#e6eaec", padding: 16, fontFamily: "var(--font-geist-sans), system-ui" };
const hud: CSSProperties = { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 10, fontSize: 13, background: "#11141b", padding: "8px 12px", borderRadius: 8 };
const mapWrap: CSSProperties = { position: "relative", marginTop: 12, width: "100%", maxWidth: 560, aspectRatio: "1 / 1", background: "#0a0c0d", borderRadius: 8, overflow: "hidden", touchAction: "none" };
const panel: CSSProperties = { marginTop: 12, maxWidth: 560, background: "#11141b", borderRadius: 8, padding: 12 };
const btn: CSSProperties = { background: "#1d4ed8", color: "#fff", border: 0, borderRadius: 6, padding: "4px 10px", cursor: "pointer" };
const btnGhost: CSSProperties = { background: "transparent", color: "#9aa4ab", border: 0, cursor: "pointer" };
const rowBtn: CSSProperties = { display: "block", width: "100%", textAlign: "left", background: "#182030", color: "#e6eaec", border: "1px solid #2a3036", borderRadius: 6, padding: "8px 10px", margin: "4px 0", cursor: "pointer", fontSize: 12 };
