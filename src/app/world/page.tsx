"use client";
import { useState, type CSSProperties } from "react";
import { useBaseSocket } from "@/lib/useBaseSocket";
import { axialToPixel } from "@/game/world";
import { Badge, Button, Panel, ProgressBar, Stat } from "@/components/ui";
import { BaseTutorial } from "@/components/BaseTutorial";
import {
  BUILDINGS, WALL, ccTier, edgeKey, levelDef, maxLevelOf, maxWallLevel,
  type CocBase, type CocBuildingId, type CocResource, type CocWorld, type PlacedBuilding,
} from "@/sim/coc";

const SERVER_URL = process.env.NEXT_PUBLIC_GAME_SERVER_URL ?? "ws://localhost:8080";
const SIZE = 16;
const ICON: Record<CocBuildingId, string> = {
  commandCenter: "🏛️", goldCollector: "⛏️", elixirCollector: "🛢️", goldStorage: "🏦", elixirStorage: "🛍️",
  cannon: "🔫", mortar: "💣", airDefense: "🛰️",
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
function terrainFill(t: string): string {
  return `var(--terrain-${t.toLowerCase()})`;
}
function num(n: number): string {
  return Math.floor(n).toLocaleString();
}
function center(key: string): { x: number; y: number } {
  const [q, r] = key.split(",").map(Number);
  return axialToPixel(q, r, SIZE);
}

export default function WorldPage() {
  const { state, playerId, connected, error, send } = useBaseSocket(SERVER_URL);
  const [sel, setSel] = useState<string | null>(null);
  const [selWall, setSelWall] = useState<string | null>(null);
  const [wallMode, setWallMode] = useState(false);
  const [wallFrom, setWallFrom] = useState<string | null>(null);

  if (!state) {
    return (
      <main style={page}>
        <div className="wl-title" style={{ fontSize: 20 }}>{connected ? "LOADING WORLD…" : "ESTABLISHING UPLINK…"}</div>
        <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 6 }}>{SERVER_URL}</div>
      </main>
    );
  }

  const myBase: CocBase | null = playerId ? state.bases[playerId] ?? null : null;
  const tier = myBase ? ccTier(ccLevelOf(myBase)) : null;
  const freeBuilders = myBase ? myBase.builders - myBase.jobs.length : 0;
  const jobByHex = new Map(myBase?.jobs.map((j) => [j.hexKey, j]) ?? []);
  const selBuilding = myBase && sel ? myBase.buildings[sel] : null;

  function clearSel() {
    setSel(null);
    setSelWall(null);
  }

  function onHexClick(key: string, q: number, r: number) {
    if (!myBase) { send({ type: "claimBase", q, r }); return; }
    if (!myBase.ownedHexes.includes(key)) return;
    if (wallMode) {
      if (!wallFrom) { setWallFrom(key); return; }
      if (wallFrom === key) { setWallFrom(null); return; }
      send({ type: "placeWall", aKey: wallFrom, bKey: key });
      setWallFrom(null);
      return;
    }
    setSelWall(null);
    setSel(key);
  }

  function onWallClick(ek: string) {
    if (wallMode) return;
    setSel(null);
    setSelWall(ek);
  }

  const buildable: CocBuildingId[] = tier ? (Object.keys(tier.caps) as CocBuildingId[]) : [];
  const resourceBuildings = buildable.filter((id) => BUILDINGS[id].category === "collector" || BUILDINGS[id].category === "storage");
  const defenseBuildings = buildable.filter((id) => BUILDINGS[id].category === "defense");

  return (
    <main style={page}>
      {/* Title bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span className="wl-title" style={{ fontSize: 22 }}>LIVE WORLD MAP</span>
        <Badge tone={connected ? "emerald" : "blood"} variant="soft">{connected ? "● ONLINE" : "● OFFLINE"}</Badge>
        <span className="wl-num" style={{ fontSize: 11, color: "var(--text-secondary)" }}>TICK {state.tick} · {Object.keys(state.players).length} CMDR</span>
        {myBase && (
          <Button size="sm" variant={wallMode ? "primary" : "outline"} icon="🧱"
            onClick={() => { setWallMode((w) => !w); setWallFrom(null); clearSel(); }}>
            {wallMode ? "WALL MODE: ON" : "WALL MODE"}
          </Button>
        )}
      </div>
      {error && <div style={{ marginTop: 8 }}><Badge tone="blood" variant="soft" icon="⚠">{error}</Badge></div>}

      {/* HUD */}
      {myBase ? (
        <Panel label="HEADQUARTERS" accent padding="10px 14px" style={{ marginTop: 12 }}
          headerRight={<Button size="sm" variant="primary" icon="📥" onClick={() => send({ type: "collect" })}>COLLECT</Button>}>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            <Stat label="🪙 GOLD" value={`${num(myBase.gold)} / ${num(storageCapOf(myBase, "gold"))}`} accent="amber" />
            <Stat label="🧪 ELIXIR" value={`${num(myBase.elixir)} / ${num(storageCapOf(myBase, "elixir"))}`} accent="violet" />
            <Stat label="CMD CENTER" value={`L${ccLevelOf(myBase)}`} accent="sky" />
            <Stat label="BUILDERS" value={`${freeBuilders}/${myBase.builders}`} accent={freeBuilders > 0 ? "emerald" : "neutral"} />
            <Stat label="WALLS" value={`${Object.keys(myBase.walls).length}`} accent="neutral" />
          </div>
        </Panel>
      ) : (
        <Panel title="CLAIM YOUR GROUND" rim="amber" padding="12px 14px" style={{ marginTop: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
            Tap an unclaimed hex with all six neighbours free to stake your Command Center and the ring around it.
            The land is staked, never spent.
          </p>
        </Panel>
      )}
      {wallMode && (
        <div style={{ marginTop: 8 }}>
          <Badge tone="amber" variant="soft" icon="🧱">{wallFrom ? `WALL FROM ${wallFrom} — tap an adjacent hex` : "TAP TWO ADJACENT OWNED HEXES"}</Badge>
        </div>
      )}

      {/* Map */}
      <div style={mapWrap}>
        <div className="wl-hexgrid" style={{ position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none" }} />
        <div className="wl-scanline" />
        <svg viewBox="-260 -260 520 520" style={{ width: "100%", height: "100%", display: "block", position: "relative" }}>
          {/* hexes */}
          {Object.values(state.hexes).map((h) => {
            const key = `${h.q},${h.r}`;
            const { x, y } = axialToPixel(h.q, h.r, SIZE);
            const owner = state.claimedHexes[key];
            const mine = owner && owner === playerId;
            const active = mine && (sel === key || wallFrom === key);
            const b = mine ? myBase!.buildings[key] : undefined;
            const job = mine ? jobByHex.get(key) : undefined;
            const fill = mine ? "var(--panel-2)" : owner ? "var(--panel)" : terrainFill(h.terrain);
            const rim = active ? "var(--rim-selected)" : mine ? "var(--rim-owned)" : owner ? "var(--rim-enemy)" : "var(--rim-neutral)";
            return (
              <g key={key} transform={`translate(${x},${y})`} onClick={() => onHexClick(key, h.q, h.r)}
                style={{ cursor: "pointer", filter: active ? "drop-shadow(0 0 4px rgba(245,179,1,0.6))" : undefined }}>
                <polygon points={hexPoints(SIZE)} fill={fill} stroke={rim} strokeWidth={mine || owner ? 1.4 : 0.5} />
                {b && <text textAnchor="middle" dy="3" fontSize="11">{ICON[b.id]}</text>}
                {b && b.level >= 1 && <text textAnchor="middle" dy="13" fontSize="6" fill="var(--amber-text)" style={{ fontFamily: "var(--font-mono)" }}>L{b.level}</text>}
                {job && <text textAnchor="middle" dy="-7" fontSize="6" fill="var(--warning)" style={{ fontFamily: "var(--font-mono)" }}>{Math.max(0, job.finishesAtTick - state.tick)}s</text>}
              </g>
            );
          })}
          {/* walls (on edges between owned hexes) */}
          {myBase && Object.entries(myBase.walls).map(([ek, level]) => {
            const [aK, bK] = ek.split("|");
            const a = center(aK), b = center(bK);
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            const dx = b.x - a.x, dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const px = -dy / len, py = dx / len; // perpendicular = the shared edge direction
            const half = SIZE * 0.5;
            const x1 = mx + px * half, y1 = my + py * half, x2 = mx - px * half, y2 = my - py * half;
            return (
              <g key={ek} onClick={() => onWallClick(ek)} style={{ cursor: "pointer" }}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={10} />
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={selWall === ek ? "var(--rim-selected)" : "var(--concrete)"} strokeWidth={2 + level * 1.5} strokeLinecap="round" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Wall panel */}
      {myBase && selWall && (
        <Panel title="WALL" accent padding="12px 14px" style={{ marginTop: 12 }}
          headerRight={<button onClick={() => setSelWall(null)} style={closeBtn} aria-label="Close">✕</button>}>
          <WallInfo base={myBase} ek={selWall} onUpgrade={() => send({ type: "upgradeWall", edgeKey: selWall })} />
        </Panel>
      )}

      {/* Selected-hex panel */}
      {myBase && sel && (
        <Panel
          title={selBuilding ? BUILDINGS[selBuilding.id].name : `HEX ${sel}`}
          accent={!!selBuilding}
          padding="12px 14px"
          style={{ marginTop: 12 }}
          headerRight={<button onClick={() => setSel(null)} style={closeBtn} aria-label="Close">✕</button>}
        >
          {selBuilding ? (
            <BuildingInfo base={myBase} building={selBuilding} job={jobByHex.get(sel)} tick={state.tick} freeBuilders={freeBuilders}
              onUpgrade={() => send({ type: "upgradeBuilding", hexKey: sel })} />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <BuildGroup label="RESOURCES" ids={resourceBuildings} base={myBase} tier={tier!} freeBuilders={freeBuilders}
                onBuild={(id) => send({ type: "placeBuilding", hexKey: sel, buildingId: id })} />
              {defenseBuildings.length > 0 && (
                <BuildGroup label="DEFENSE" ids={defenseBuildings} base={myBase} tier={tier!} freeBuilders={freeBuilders}
                  onBuild={(id) => send({ type: "placeBuilding", hexKey: sel, buildingId: id })} />
              )}
              <ExpandRow base={myBase} state={state} onExpand={(q, r) => send({ type: "expandCluster", q, r })} />
            </div>
          )}
        </Panel>
      )}

      <BaseTutorial base={myBase} />
    </main>
  );
}

function BuildGroup({ label, ids, base, tier, freeBuilders, onBuild }: {
  label: string; ids: CocBuildingId[]; base: CocBase; tier: ReturnType<typeof ccTier>; freeBuilders: number; onBuild: (id: CocBuildingId) => void;
}) {
  if (ids.length === 0) return null;
  return (
    <div>
      <span className="wl-label">{label}</span>
      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
        {ids.map((id) => {
          const lv = levelDef(id, 1)!;
          const count = Object.values(base.buildings).filter((x) => x.id === id).length;
          const cap = tier.caps[id]!;
          const atCap = count >= cap.maxCount;
          const afford = base.gold >= (lv.cost.gold ?? 0) && base.elixir >= (lv.cost.elixir ?? 0);
          const ok = !atCap && afford && freeBuilders > 0;
          return (
            <Button key={id} variant="secondary" full disabled={!ok} style={rowBtn} onClick={() => onBuild(id)}>
              <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <span aria-hidden>{ICON[id]}</span> {BUILDINGS[id].name}
              </span>
              <span className="wl-num" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                {atCap ? "AT LIMIT" : `${costStr(lv.cost)} · ${lv.buildTimeSec}s`}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function BuildingInfo({ base, building, job, tick, freeBuilders, onUpgrade }: {
  base: CocBase; building: PlacedBuilding; job?: { toLevel: number; buildingId: CocBuildingId; finishesAtTick: number }; tick: number; freeBuilders: number; onUpgrade: () => void;
}) {
  const def = BUILDINGS[building.id];
  const next = building.level + 1;
  const maxed = next > maxLevelOf(building.id);
  const cap = ccTier(base.buildings[base.centerKey]?.level ?? 1).caps[building.id];
  const ccBlocked = building.id !== "commandCenter" && (!cap || next > cap.maxLevel);
  const lv = !maxed ? levelDef(building.id, next) : undefined;
  const cost = lv?.cost ?? {};
  const afford = base.gold >= (cost.gold ?? 0) && base.elixir >= (cost.elixir ?? 0);
  const ok = building.level >= 1 && !job && !maxed && !ccBlocked && afford && freeBuilders > 0;
  const total = job ? levelDef(job.buildingId, job.toLevel)?.buildTimeSec ?? 1 : 1;
  const remaining = job ? Math.max(0, job.finishesAtTick - tick) : 0;
  const stats = levelDef(building.id, Math.max(1, building.level));

  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <Badge tone={building.level >= 1 ? "amber" : "sky"} variant="soft">
          {building.level >= 1 ? `LEVEL ${building.level}` : "UNDER CONSTRUCTION"}
        </Badge>
        {def.category === "defense" && stats && (
          <>
            <Badge tone="blood" variant="soft">DEF {stats.hp}</Badge>
            <Badge tone="teal" variant="soft">RNG {stats.range}</Badge>
            <Badge tone="neutral" variant="soft">{stats.targets?.toUpperCase()}</Badge>
          </>
        )}
        {building.buffer != null && building.level >= 1 && def.category === "collector" && (
          <span className="wl-num" style={{ fontSize: 11, color: "var(--text-secondary)" }}>BUFFER {num(building.buffer)}</span>
        )}
      </div>

      {job ? (
        <ProgressBar tone="amber" label="BUILDING" valueText={`${remaining}s`} value={total - remaining} max={total} />
      ) : maxed ? (
        <Badge tone="neutral" variant="soft">MAX LEVEL</Badge>
      ) : (
        <Button variant="primary" full disabled={!ok} icon="⬆" onClick={onUpgrade}>
          UPGRADE → L{next} · {costStr(cost)} · {lv?.buildTimeSec}s{ccBlocked ? "  · RAISE CC" : ""}
        </Button>
      )}
    </div>
  );
}

function WallInfo({ base, ek, onUpgrade }: { base: CocBase; ek: string; onUpgrade: () => void }) {
  const level = base.walls[ek] ?? 1;
  const cc = base.buildings[base.centerKey]?.level ?? 1;
  const next = level + 1;
  const maxed = next > WALL.levels.length;
  const ccBlocked = next > maxWallLevel(cc);
  const cost = !maxed ? WALL.levels[next - 1].cost : {};
  const afford = base.gold >= (cost.gold ?? 0);
  const ok = !maxed && !ccBlocked && afford;
  const stats = WALL.levels[level - 1];
  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <Badge tone="amber" variant="soft">LEVEL {level}</Badge>
        <Badge tone="blood" variant="soft">HP {stats.hp}</Badge>
      </div>
      {maxed ? <Badge tone="neutral" variant="soft">MAX LEVEL</Badge> : (
        <Button variant="primary" full disabled={!ok} icon="⬆" onClick={onUpgrade}>
          REINFORCE → L{next} · {costStr(cost)}{ccBlocked ? "  · RAISE CC" : ""}
        </Button>
      )}
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
        return (
          <Button variant="outline" full icon="➕" style={{ justifyContent: "flex-start" }} onClick={() => onExpand(q, r)}>
            ANNEX {k} · up to {tier.maxHexes} hexes
          </Button>
        );
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
  return parts.join(" ") || "FREE";
}

const page: CSSProperties = {
  minHeight: "100dvh", background: "var(--bg-app)", color: "var(--text-primary)",
  padding: "max(16px, env(safe-area-inset-top)) 16px 96px", fontFamily: "var(--font-ui)",
};
const mapWrap: CSSProperties = {
  position: "relative", marginTop: 12, width: "100%", maxWidth: 560, aspectRatio: "1 / 1",
  background: "var(--surface-sunken)", borderRadius: "var(--radius-lg)", border: "1px solid var(--hairline)",
  overflow: "hidden", touchAction: "none",
};
const rowBtn: CSSProperties = { justifyContent: "space-between", textAlign: "left", fontWeight: 500 };
const closeBtn: CSSProperties = { background: "transparent", color: "var(--text-secondary)", border: 0, cursor: "pointer", fontSize: 14, lineHeight: 1 };
