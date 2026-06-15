"use client";
import { useState, type CSSProperties } from "react";
import { useBaseSocket } from "@/lib/useBaseSocket";
import { axialToPixel } from "@/game/world";
import { Badge, Button, Panel, ProgressBar, Stat } from "@/components/ui";
import { BaseTutorial } from "@/components/BaseTutorial";
import {
  BUILDINGS, LOOT_PCT, MAX_BUILDERS, UNITS, UNIT_IDS, WALL, builderCost, ccTier, finishCost, housingCap, housingUsed, levelDef, maxLevelOf, maxWallLevel,
  type Army, type BattleReport, type CocBase, type CocBuildingId, type CocResource, type CocUnitId, type CocWorld, type PlacedBuilding,
} from "@/sim/coc";

const SERVER_URL = process.env.NEXT_PUBLIC_GAME_SERVER_URL ?? "ws://localhost:8080";
const SIZE = 16;
const ICON: Record<CocBuildingId, string> = {
  commandCenter: "🏛️", goldCollector: "⛏️", elixirCollector: "🛢️", goldStorage: "🏦", elixirStorage: "🛍️",
  cannon: "🔫", mortar: "💣", airDefense: "🛰️", barracks: "🏰", armyCamp: "⛺",
};
const UNIT_ICON: Record<CocUnitId, string> = { grunt: "🪖", marksman: "🎯", breacher: "🧨", juggernaut: "🛡️", gunship: "🚁" };

function ccLevelOf(base: CocBase): number { return base.buildings[base.centerKey]?.level ?? 1; }
function storageCapOf(base: CocBase, res: CocResource): number {
  let cap = 1000;
  for (const b of Object.values(base.buildings)) {
    const def = BUILDINGS[b.id];
    if (def.stores === res && b.level >= 1) cap += def.levels[b.level - 1]?.storageCap ?? 0;
  }
  return cap;
}
function terrainFill(t: string): string { return `var(--terrain-${t.toLowerCase()})`; }
function num(n: number): string { return Math.floor(n).toLocaleString(); }
function center(key: string): { x: number; y: number } {
  const [q, r] = key.split(",").map(Number);
  return axialToPixel(q, r, SIZE);
}
function armyTotal(a: Army): number { return UNIT_IDS.reduce((s, u) => s + (a[u] ?? 0), 0); }

export default function WorldPage() {
  const { state, playerId, connected, error, report, send, clearReport } = useBaseSocket(SERVER_URL);
  const [sel, setSel] = useState<string | null>(null);
  const [selWall, setSelWall] = useState<string | null>(null);
  const [wallMode, setWallMode] = useState(false);
  const [wallFrom, setWallFrom] = useState<string | null>(null);
  const [armyOpen, setArmyOpen] = useState(false);
  const [raidTarget, setRaidTarget] = useState<string | null>(null);
  const [deploy, setDeploy] = useState<Army>({});

  if (!state) {
    return (
      <main style={page}>
        <div className="wl-title" style={{ fontSize: 20 }}>{connected ? "LOADING WORLD…" : "ESTABLISHING UPLINK…"}</div>
        <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 6 }}>{SERVER_URL}</div>
      </main>
    );
  }

  const myBase: CocBase | null = playerId ? state.bases[playerId] ?? null : null;
  const me = playerId ? state.players[playerId] ?? null : null;
  const tier = myBase ? ccTier(ccLevelOf(myBase)) : null;
  const freeBuilders = myBase ? myBase.builders - myBase.jobs.length : 0;
  const jobByHex = new Map(myBase?.jobs.map((j) => [j.hexKey, j]) ?? []);
  const selBuilding = myBase && sel ? myBase.buildings[sel] : null;

  function onHexClick(key: string, q: number, r: number) {
    if (!myBase) { send({ type: "claimBase", q, r }); return; }
    const owner = state!.claimedHexes[key];
    if (owner && owner !== playerId) { setSel(null); setSelWall(null); setRaidTarget(owner); setDeploy({}); return; }
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

  const buildable: CocBuildingId[] = tier ? (Object.keys(tier.caps) as CocBuildingId[]) : [];
  const resourceBuildings = buildable.filter((id) => ["collector", "storage"].includes(BUILDINGS[id].category));
  const defenseBuildings = buildable.filter((id) => BUILDINGS[id].category === "defense");
  const armyBuildings = buildable.filter((id) => BUILDINGS[id].category === "army");

  return (
    <main style={page}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span className="wl-title" style={{ fontSize: 22 }}>LIVE WORLD MAP</span>
        <Badge tone={connected ? "emerald" : "blood"} variant="soft">{connected ? "● ONLINE" : "● OFFLINE"}</Badge>
        <span className="wl-num" style={{ fontSize: 11, color: "var(--text-secondary)" }}>TICK {state.tick} · {Object.keys(state.players).length} CMDR</span>
        {myBase && <Button size="sm" variant="outline" icon="⚔️" onClick={() => setArmyOpen(true)}>ARMY ({armyTotal(myBase.army)})</Button>}
        {myBase && (
          <Button size="sm" variant={wallMode ? "primary" : "outline"} icon="🧱"
            onClick={() => { setWallMode((w) => !w); setWallFrom(null); setSel(null); setSelWall(null); }}>
            {wallMode ? "WALL MODE: ON" : "WALL MODE"}
          </Button>
        )}
      </div>
      {error && <div style={{ marginTop: 8 }}><Badge tone="blood" variant="soft" icon="⚠">{error}</Badge></div>}

      {myBase ? (
        <Panel label="HEADQUARTERS" accent padding="10px 14px" style={{ marginTop: 12 }}
          headerRight={<Button size="sm" variant="primary" icon="📥" onClick={() => send({ type: "collect" })}>COLLECT</Button>}>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
            <Stat label="🪙 GOLD" value={`${num(myBase.gold)} / ${num(storageCapOf(myBase, "gold"))}`} accent="amber" />
            <Stat label="🧪 ELIXIR" value={`${num(myBase.elixir)} / ${num(storageCapOf(myBase, "elixir"))}`} accent="violet" />
            <Stat label="💎 $WAR" value={num(me?.war ?? 0)} accent="amber" />
            <Stat label="🏆 TROPHIES" value={`${myBase.trophies}`} accent="amber" />
            <Stat label="CMD CENTER" value={`L${ccLevelOf(myBase)}`} accent="sky" />
            <Stat label="BUILDERS" value={`${freeBuilders}/${myBase.builders}`} accent={freeBuilders > 0 ? "emerald" : "neutral"} />
            <Stat label="ARMY" value={`${housingUsed(myBase)}/${housingCap(myBase)}`} accent="blood" />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {myBase.builders < MAX_BUILDERS && (
              <Button size="sm" variant="outline" icon="🔨" onClick={() => send({ type: "buyBuilder" })}>
                +BUILDER · 💎{num(builderCost(myBase.builders))}
              </Button>
            )}
            <Button size="sm" variant="outline" icon="🛡️" onClick={() => send({ type: "extendShield", hours: 2 })}>
              +2h SHIELD · 💎1,000
            </Button>
            {myBase.shieldUntil > state.tick && (
              <Badge tone="emerald" variant="soft">SHIELDED {Math.ceil((myBase.shieldUntil - state.tick) / 3600)}h</Badge>
            )}
          </div>
        </Panel>
      ) : (
        <Panel title="CLAIM YOUR GROUND" rim="amber" padding="12px 14px" style={{ marginTop: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
            Tap an unclaimed hex with all six neighbours free to stake your Command Center and the ring around it.
          </p>
        </Panel>
      )}
      {wallMode && <div style={{ marginTop: 8 }}><Badge tone="amber" variant="soft" icon="🧱">{wallFrom ? `WALL FROM ${wallFrom} — tap an adjacent hex` : "TAP TWO ADJACENT OWNED HEXES"}</Badge></div>}
      {myBase && <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>Tip: tap another commander&apos;s territory to scout &amp; raid.</div>}

      {/* Map */}
      <div style={mapWrap}>
        <div className="wl-hexgrid" style={{ position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none" }} />
        <div className="wl-scanline" />
        <svg viewBox="-260 -260 520 520" style={{ width: "100%", height: "100%", display: "block", position: "relative" }}>
          {Object.values(state.hexes).map((h) => {
            const key = `${h.q},${h.r}`;
            const { x, y } = axialToPixel(h.q, h.r, SIZE);
            const owner = state.claimedHexes[key];
            const mine = owner && owner === playerId;
            const active = mine && (sel === key || wallFrom === key);
            const isTarget = !!owner && owner === raidTarget;
            const b = mine ? myBase!.buildings[key] : undefined;
            const job = mine ? jobByHex.get(key) : undefined;
            const fill = mine ? "var(--panel-2)" : owner ? "var(--panel)" : terrainFill(h.terrain);
            const rim = active || isTarget ? "var(--rim-selected)" : mine ? "var(--rim-owned)" : owner ? "var(--rim-enemy)" : "var(--rim-neutral)";
            return (
              <g key={key} transform={`translate(${x},${y})`} onClick={() => onHexClick(key, h.q, h.r)}
                style={{ cursor: "pointer", filter: active || isTarget ? "drop-shadow(0 0 4px rgba(245,179,1,0.6))" : undefined }}>
                <polygon points={hexPoints(SIZE)} fill={fill} stroke={rim} strokeWidth={mine || owner ? 1.4 : 0.5} />
                {b && <text textAnchor="middle" dy="3" fontSize="11">{ICON[b.id]}</text>}
                {b && b.level >= 1 && <text textAnchor="middle" dy="13" fontSize="6" fill="var(--amber-text)" style={{ fontFamily: "var(--font-mono)" }}>L{b.level}</text>}
                {job && <text textAnchor="middle" dy="-7" fontSize="6" fill="var(--warning)" style={{ fontFamily: "var(--font-mono)" }}>{Math.max(0, job.finishesAtTick - state.tick)}s</text>}
              </g>
            );
          })}
          {myBase && Object.entries(myBase.walls).map(([ek, level]) => {
            const [aK, bK] = ek.split("|");
            const a = center(aK), b = center(bK);
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            const dx = b.x - a.x, dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const px = -dy / len, py = dx / len;
            const half = SIZE * 0.5;
            return (
              <g key={ek} onClick={() => { setSel(null); setSelWall(ek); }} style={{ cursor: "pointer" }}>
                <line x1={mx + px * half} y1={my + py * half} x2={mx - px * half} y2={my - py * half} stroke="transparent" strokeWidth={10} />
                <line x1={mx + px * half} y1={my + py * half} x2={mx - px * half} y2={my - py * half} stroke={selWall === ek ? "var(--rim-selected)" : "var(--concrete)"} strokeWidth={2 + level * 1.5} strokeLinecap="round" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Wall panel */}
      {myBase && selWall && (
        <Panel title="WALL" accent padding="12px 14px" style={{ marginTop: 12 }} headerRight={<button onClick={() => setSelWall(null)} style={closeBtn}>✕</button>}>
          <WallInfo base={myBase} ek={selWall} onUpgrade={() => send({ type: "upgradeWall", edgeKey: selWall })} />
        </Panel>
      )}

      {/* Build/Upgrade panel */}
      {myBase && sel && (
        <Panel title={selBuilding ? BUILDINGS[selBuilding.id].name : `HEX ${sel}`} accent={!!selBuilding} padding="12px 14px" style={{ marginTop: 12 }}
          headerRight={<button onClick={() => setSel(null)} style={closeBtn}>✕</button>}>
          {selBuilding ? (
            <BuildingInfo base={myBase} building={selBuilding} job={jobByHex.get(sel)} tick={state.tick} freeBuilders={freeBuilders}
              war={me?.war ?? 0}
              onUpgrade={() => send({ type: "upgradeBuilding", hexKey: sel })}
              onFinish={() => send({ type: "finishNow", hexKey: sel })} />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <BuildGroup label="RESOURCES" ids={resourceBuildings} base={myBase} tier={tier!} freeBuilders={freeBuilders} onBuild={(id) => send({ type: "placeBuilding", hexKey: sel, buildingId: id })} />
              <BuildGroup label="DEFENSE" ids={defenseBuildings} base={myBase} tier={tier!} freeBuilders={freeBuilders} onBuild={(id) => send({ type: "placeBuilding", hexKey: sel, buildingId: id })} />
              <BuildGroup label="ARMY" ids={armyBuildings} base={myBase} tier={tier!} freeBuilders={freeBuilders} onBuild={(id) => send({ type: "placeBuilding", hexKey: sel, buildingId: id })} />
              <ExpandRow base={myBase} state={state} onExpand={(q, r) => send({ type: "expandCluster", q, r })} />
            </div>
          )}
        </Panel>
      )}

      {/* Army / training */}
      {myBase && armyOpen && (
        <Overlay onClose={() => setArmyOpen(false)}>
          <ArmyPanel base={myBase} onTrain={(u) => send({ type: "trainTroop", unit: u })} onClose={() => setArmyOpen(false)} />
        </Overlay>
      )}

      {/* Scout / attack */}
      {myBase && raidTarget && state.bases[raidTarget] && (
        <Overlay onClose={() => setRaidTarget(null)}>
          <AttackPanel
            me={myBase} target={state.bases[raidTarget]} tick={state.tick} deploy={deploy} setDeploy={setDeploy}
            onAttack={() => { send({ type: "raid", targetOwner: raidTarget, army: deploy }); setRaidTarget(null); }}
            onClose={() => setRaidTarget(null)}
          />
        </Overlay>
      )}

      {/* Result card */}
      {report && (
        <Overlay onClose={clearReport}>
          <ResultCard report={report} mine={report.attacker === playerId} onClose={clearReport} />
        </Overlay>
      )}

      <BaseTutorial base={myBase} />
    </main>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function ArmyPanel({ base, onTrain, onClose }: { base: CocBase; onTrain: (u: CocUnitId) => void; onClose: () => void }) {
  const cap = housingCap(base);
  const used = housingUsed(base);
  const hasBarracks = Object.values(base.buildings).some((b) => b.id === "barracks" && b.level >= 1);
  return (
    <Panel title="ARMY" accent padding="14px" headerRight={<button onClick={onClose} style={closeBtn}>✕</button>}>
      <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
        <Stat label="HOUSING" value={`${used}/${cap}`} accent="blood" />
        <Stat label="🧪 ELIXIR" value={num(base.elixir)} accent="violet" />
      </div>
      {!hasBarracks && <Badge tone="neutral" variant="soft">Build a Barracks to train troops.</Badge>}
      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
        {UNIT_IDS.map((u) => {
          const d = UNITS[u];
          const have = base.army[u] ?? 0;
          const queued = base.trainQueue.filter((o) => o.unit === u).length;
          const ok = hasBarracks && base.elixir >= d.cost.elixir && used + d.housing <= cap;
          return (
            <Button key={u} variant="secondary" full disabled={!ok} style={rowBtn} onClick={() => onTrain(u)}>
              <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <span aria-hidden>{UNIT_ICON[u]}</span> {d.name}
                <span style={{ color: "var(--text-muted)", fontSize: 10 }}>{d.role}</span>
              </span>
              <span className="wl-num" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                ×{have}{queued ? ` (+${queued})` : ""} · 🧪{d.cost.elixir} · ⌂{d.housing}
              </span>
            </Button>
          );
        })}
      </div>
    </Panel>
  );
}

function AttackPanel({ me, target, tick, deploy, setDeploy, onAttack, onClose }: {
  me: CocBase; target: CocBase; tick: number; deploy: Army; setDeploy: (a: Army) => void; onAttack: () => void; onClose: () => void;
}) {
  const shielded = target.shieldUntil > tick;
  const cc = target.buildings[target.centerKey]?.level ?? 1;
  const estGold = Math.floor(target.gold * LOOT_PCT);
  const estElixir = Math.floor(target.elixir * LOOT_PCT);
  const selected = armyTotal(deploy);
  const set = (u: CocUnitId, n: number) => setDeploy({ ...deploy, [u]: Math.max(0, Math.min(me.army[u] ?? 0, n)) });
  return (
    <Panel title="SCOUT & RAID" rim="blood" padding="14px" headerRight={<button onClick={onClose} style={closeBtn}>✕</button>}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
        <Stat label="ENEMY CC" value={`L${cc}`} accent="sky" />
        <Stat label="EST LOOT" value={`🪙${num(estGold)} 🧪${num(estElixir)}`} accent="amber" />
        {shielded ? <Badge tone="emerald" variant="soft">SHIELDED</Badge> : <Badge tone="blood" variant="soft">RAIDABLE</Badge>}
      </div>
      <span className="wl-label">DEPLOY</span>
      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
        {UNIT_IDS.filter((u) => (me.army[u] ?? 0) > 0).map((u) => (
          <div key={u} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "var(--surface-raised)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-sm)", padding: "6px 10px" }}>
            <span style={{ fontSize: 12 }}>{UNIT_ICON[u]} {UNITS[u].name} <span style={{ color: "var(--text-muted)" }}>/{me.army[u]}</span></span>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <button style={step} onClick={() => set(u, (deploy[u] ?? 0) - 1)}>−</button>
              <span className="wl-num" style={{ minWidth: 24, textAlign: "center" }}>{deploy[u] ?? 0}</span>
              <button style={step} onClick={() => set(u, (deploy[u] ?? 0) + 1)}>+</button>
              <button style={{ ...step, width: "auto", padding: "0 8px" }} onClick={() => set(u, me.army[u] ?? 0)}>ALL</button>
            </span>
          </div>
        ))}
        {armyTotal(me.army) === 0 && <Badge tone="neutral" variant="soft">No troops — train an army first.</Badge>}
      </div>
      <div style={{ marginTop: 12 }}>
        <Button variant="danger" full icon="⚔️" disabled={shielded || selected === 0} onClick={onAttack}>
          {shielded ? "TARGET SHIELDED" : selected === 0 ? "SELECT TROOPS" : `ATTACK WITH ${selected}`}
        </Button>
      </div>
    </Panel>
  );
}

function ResultCard({ report, mine, onClose }: { report: BattleReport; mine: boolean; onClose: () => void }) {
  return (
    <Panel title={mine ? "RAID REPORT" : "UNDER ATTACK"} accent padding="16px" headerRight={<button onClick={onClose} style={closeBtn}>✕</button>}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, letterSpacing: 6 }}>
          {[0, 1, 2].map((i) => <span key={i} style={{ color: i < report.stars ? "var(--amber)" : "var(--disabled)" }}>★</span>)}
        </div>
        <div className="wl-num" style={{ fontSize: 28, marginTop: 4 }}>{Math.round(report.destructionPct * 100)}%</div>
        <div className="wl-label">DESTRUCTION</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 14 }}>
        <Stat label="🪙 LOOT" value={num(report.loot.gold)} accent="amber" align="stack" />
        <Stat label="🧪 LOOT" value={num(report.loot.elixir)} accent="violet" align="stack" />
        <Stat label="🏆" value={`${report.trophies >= 0 ? "+" : ""}${report.trophies}`} accent={report.trophies >= 0 ? "emerald" : "blood"} align="stack" />
      </div>
      <div style={{ marginTop: 14 }}><Button variant="primary" full onClick={onClose}>RETURN HOME</Button></div>
    </Panel>
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
              <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><span aria-hidden>{ICON[id]}</span> {BUILDINGS[id].name}</span>
              <span className="wl-num" style={{ fontSize: 11, color: "var(--text-secondary)" }}>{atCap ? "AT LIMIT" : `${costStr(lv.cost)} · ${lv.buildTimeSec}s`}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function BuildingInfo({ base, building, job, tick, freeBuilders, war, onUpgrade, onFinish }: {
  base: CocBase; building: PlacedBuilding; job?: { toLevel: number; buildingId: CocBuildingId; finishesAtTick: number }; tick: number; freeBuilders: number; war: number; onUpgrade: () => void; onFinish: () => void;
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
        <Badge tone={building.level >= 1 ? "amber" : "sky"} variant="soft">{building.level >= 1 ? `LEVEL ${building.level}` : "UNDER CONSTRUCTION"}</Badge>
        {def.category === "defense" && stats && (<><Badge tone="blood" variant="soft">DEF {stats.hp}</Badge><Badge tone="teal" variant="soft">RNG {stats.range}</Badge><Badge tone="neutral" variant="soft">{stats.targets?.toUpperCase()}</Badge></>)}
        {def.category === "army" && building.id === "armyCamp" && stats?.housing && <Badge tone="blood" variant="soft">⌂ {stats.housing}</Badge>}
        {building.buffer != null && building.level >= 1 && def.category === "collector" && <span className="wl-num" style={{ fontSize: 11, color: "var(--text-secondary)" }}>BUFFER {num(building.buffer)}</span>}
      </div>
      {job ? (
        <div style={{ display: "grid", gap: 8 }}>
          <ProgressBar tone="amber" label="BUILDING" valueText={`${remaining}s`} value={total - remaining} max={total} />
          <Button variant="outline" full icon="💎" disabled={war < finishCost(remaining)} onClick={onFinish}>
            FINISH NOW · 💎{finishCost(remaining).toLocaleString()}
          </Button>
        </div>
      ) : maxed ? <Badge tone="neutral" variant="soft">MAX LEVEL</Badge>
        : <Button variant="primary" full disabled={!ok} icon="⬆" onClick={onUpgrade}>UPGRADE → L{next} · {costStr(cost)} · {lv?.buildTimeSec}s{ccBlocked ? "  · RAISE CC" : ""}</Button>}
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
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}><Badge tone="amber" variant="soft">LEVEL {level}</Badge><Badge tone="blood" variant="soft">HP {stats.hp}</Badge></div>
      {maxed ? <Badge tone="neutral" variant="soft">MAX LEVEL</Badge>
        : <Button variant="primary" full disabled={!ok} icon="⬆" onClick={onUpgrade}>REINFORCE → L{next} · {costStr(cost)}{ccBlocked ? "  · RAISE CC" : ""}</Button>}
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
        return <Button variant="outline" full icon="➕" style={{ justifyContent: "flex-start" }} onClick={() => onExpand(q, r)}>ANNEX {k} · up to {tier.maxHexes} hexes</Button>;
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

const page: CSSProperties = { minHeight: "100dvh", background: "var(--bg-app)", color: "var(--text-primary)", padding: "max(16px, env(safe-area-inset-top)) 16px 96px", fontFamily: "var(--font-ui)" };
const mapWrap: CSSProperties = { position: "relative", marginTop: 12, width: "100%", maxWidth: 560, aspectRatio: "1 / 1", background: "var(--surface-sunken)", borderRadius: "var(--radius-lg)", border: "1px solid var(--hairline)", overflow: "hidden", touchAction: "none" };
const rowBtn: CSSProperties = { justifyContent: "space-between", textAlign: "left", fontWeight: 500 };
const closeBtn: CSSProperties = { background: "transparent", color: "var(--text-secondary)", border: 0, cursor: "pointer", fontSize: 14, lineHeight: 1 };
const overlay: CSSProperties = { position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 };
const step: CSSProperties = { width: 26, height: 26, borderRadius: "var(--radius-sm)", border: "1px solid var(--hairline)", background: "var(--panel-2)", color: "var(--text-primary)", cursor: "pointer", fontSize: 14 };
