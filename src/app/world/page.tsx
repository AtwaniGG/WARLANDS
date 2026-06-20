"use client";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useBaseSocket } from "@/lib/useBaseSocket";
import { axialToPixel } from "@/game/world";
import { terrainArt } from "@/game/assets";
import { Web3Provider } from "@/web3/Web3Provider";
import { TokenGate } from "@/components/TokenGate";
import { Badge, Button, Panel, ProgressBar, Stat, type BadgeTone } from "@/components/ui";
import { BaseTutorial } from "@/components/BaseTutorial";
import { BaseGrid, buildingArt, UNIT_COLOR } from "@/components/BaseGrid";
import { useCountUp } from "@/components/useCountUp";

const buzz = (p: number | number[]) => { try { (navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }).vibrate?.(p); } catch { /* unsupported */ } };
import {
  BUILDINGS, LOOT_PCT, MAX_BUILDERS, TRAPS, TRAP_IDS, UNITS, UNIT_IDS, WALL,
  builderCost, builderCount, ccLevel, ccTier, fitsInGrid, finishCost, freeBuilders, garrisonCap, garrisonUsed, housingCap, housingUsed, leagueFor, levelDef, maxLevelOf, maxWallLevel, objectiveLabel, occupiedTiles, resolveRaid, storageCap,
  type Army, type BattleFrame, type BattleReport, type CocBase, type CocBuildingId, type CocPlayer, type CocResource, type CocTrapId, type CocUnitId, type CocWorld, type Deployment, type PlacedBuilding,
} from "@/sim/coc";

const SERVER_URL = process.env.NEXT_PUBLIC_GAME_SERVER_URL ?? "ws://localhost:8080";
const HEX = 16;
const UNIT_ICON: Record<CocUnitId, string> = { grunt: "🪖", marksman: "🎯", breacher: "🧨", juggernaut: "🛡️", gunship: "🚁" };

function num(n: number): string { return Math.floor(n).toLocaleString(); }
function fmtDur(secs: number): string {
  const d = Math.floor(secs / 86400), h = Math.floor((secs % 86400) / 3600), m = Math.floor((secs % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
function armyTotal(a: Army): number { return UNIT_IDS.reduce((s, u) => s + (a[u] ?? 0), 0); }
function costStr(cost: Partial<Record<CocResource, number>>): string {
  const parts: string[] = [];
  if (cost.gold) parts.push(`🪙${cost.gold}`);
  if (cost.elixir) parts.push(`🧪${cost.elixir}`);
  return parts.join(" ") || "FREE";
}
function canPlaceAt(base: CocBase, anchorKey: string, id: CocBuildingId): boolean {
  if (!fitsInGrid(anchorKey, id)) return false;
  const occ = occupiedTiles(base);
  for (const [x, y] of footprint(anchorKey, id)) if (occ.has(`${x},${y}`)) return false;
  return true;
}
function footprint(anchorKey: string, id: CocBuildingId): [number, number][] {
  const [x, y] = anchorKey.split(",").map(Number);
  const { w, h } = BUILDINGS[id].footprint;
  const out: [number, number][] = [];
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) out.push([x + dx, y + dy]);
  return out;
}

export default function WorldPage() {
  // Gate the game behind holding $WAR: connect a Solana wallet with ≥ 1,000 $WAR to enter.
  return (
    <Web3Provider>
      <TokenGate>
        <WorldGame />
      </TokenGate>
    </Web3Provider>
  );
}

function WorldGame() {
  const { state, playerId, connected, error, report, send, link, clearReport } = useBaseSocket(SERVER_URL);
  const [screen, setScreen] = useState<"world" | "base">("base");
  const [mode, setMode] = useState<"view" | "build" | "wall">("view");
  const [selected, setSelected] = useState<string | null>(null);
  const [placing, setPlacing] = useState<CocBuildingId | null>(null);
  const [placingTrap, setPlacingTrap] = useState<CocTrapId | null>(null);
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [armyOpen, setArmyOpen] = useState(false);
  const [clanOpen, setClanOpen] = useState(false);
  const [objectivesOpen, setObjectivesOpen] = useState(false);
  const [warOpen, setWarOpen] = useState(false);
  const [scout, setScout] = useState<string | null>(null);
  // ---- raid (deploy + playback) ----
  const [raidTarget, setRaidTarget] = useState<string | null>(null);
  const [deployList, setDeployList] = useState<Deployment[]>([]);
  const [deployUnit, setDeployUnit] = useState<CocUnitId | null>(null);
  const [capturedDef, setCapturedDef] = useState<CocBase | null>(null);
  const [frames, setFrames] = useState<BattleFrame[] | null>(null);
  const [frameIdx, setFrameIdx] = useState(0);
  const [launching, setLaunching] = useState(false);
  const awaitingRaid = useRef(false);

  // When the raid report arrives, replay it deterministically from the captured snapshot.
  useEffect(() => {
    if (!report || !awaitingRaid.current || !capturedDef) return;
    awaitingRaid.current = false;
    setLaunching(false);
    const f = resolveRaid(deployList, capturedDef, report.seed, { frames: true }).frames ?? [];
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setFrames(f);
    setFrameIdx(reduce ? Math.max(0, f.length - 1) : 0);
    buzz(report.stars > 0 ? [25, 45, 25] : 12);
  }, [report, capturedDef, deployList]);

  // Advance playback frames, then reveal the result card.
  useEffect(() => {
    if (!frames) return;
    if (frameIdx >= frames.length - 1) {
      const done = setTimeout(() => { setFrames(null); setRaidTarget(null); setDeployList([]); setCapturedDef(null); }, 900);
      return () => clearTimeout(done);
    }
    const id = setTimeout(() => setFrameIdx((i) => i + 1), 80);
    return () => clearTimeout(id);
  }, [frames, frameIdx]);

  // smooth HUD counters (never jitter while ticking)
  const goldC = useCountUp(state && playerId ? state.bases[playerId]?.gold ?? 0 : 0);
  const elixirC = useCountUp(state && playerId ? state.bases[playerId]?.elixir ?? 0 : 0);
  const warC = useCountUp(state && playerId ? state.players[playerId]?.war ?? 0 : 0);
  const trophyC = useCountUp(state && playerId ? state.bases[playerId]?.trophies ?? 0 : 0, 400);

  // Fit the SVG viewBox to the generated world so it fills the map frame instead of floating tiny.
  // (declared before the early return so hook order stays stable)
  const worldBox = useMemo(() => {
    const pts = Object.values(state?.hexes ?? {}).map((h) => axialToPixel(h.q, h.r, HEX));
    if (pts.length === 0) return "-260 -260 520 520";
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const pad = HEX * 1.1;
    const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [state?.hexes]);

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
  const view = myBase ? screen : "world";
  const claimableCount = me?.objectives?.filter((o) => o.progress >= o.target && !o.claimed).length ?? 0;

  function resetBaseUi() { setMode("view"); setPlacing(null); setPlacingTrap(null); setMoveFrom(null); setSelected(null); }

  function onTile(key: string) {
    if (!myBase) return;
    buzz(8);
    if (placing) { send({ type: "placeBuilding", tileKey: key, buildingId: placing }); setPlacing(null); setMode("view"); return; }
    if (placingTrap) { send({ type: "placeTrap", tileKey: key, trapId: placingTrap }); return; }
    if (mode === "wall") { send({ type: "placeWall", tileKey: key }); return; }
    if (moveFrom) { send({ type: "moveBuilding", fromTile: moveFrom, toTile: key }); setMoveFrom(null); return; }
  }

  function startAttack(owner: string) {
    if (!myBase) return;
    setScout(null);
    setRaidTarget(owner);
    setDeployList([]);
    setDeployUnit(UNIT_IDS.find((u) => (myBase.army[u] ?? 0) > 0) ?? null);
    setCapturedDef(null); setFrames(null); setFrameIdx(0); setLaunching(false);
  }
  function placeTroop(key: string) {
    if (!myBase || !raidTarget || !deployUnit || launching) return;
    const def = state!.bases[raidTarget];
    if (!def || occupiedTiles(def).has(key)) return; // open ground only
    const placed = deployList.filter((d) => d.unit === deployUnit).length;
    if (placed >= (myBase.army[deployUnit] ?? 0)) return; // out of this unit
    const [x, y] = key.split(",").map(Number);
    setDeployList((l) => [...l, { unit: deployUnit, x, y }]);
  }
  function launchRaid() {
    if (!raidTarget || deployList.length === 0 || launching) return;
    setCapturedDef(state!.bases[raidTarget] ?? null);
    awaitingRaid.current = true;
    setLaunching(true);
    send({ type: "raid", targetOwner: raidTarget, deploy: deployList });
  }
  function cancelAttack() {
    setRaidTarget(null); setDeployList([]); setCapturedDef(null); setFrames(null); setLaunching(false);
    awaitingRaid.current = false;
  }
  /** Matchmaking: jump to a raidable village near your trophy count (bot or player). */
  function findTarget() {
    if (!myBase || !playerId || !state) return;
    const cands = Object.entries(state.bases)
      .filter(([owner, b]) => owner !== playerId && b.shieldUntil <= state.tick)
      .sort((a, b) => Math.abs(a[1].trophies - myBase.trophies) - Math.abs(b[1].trophies - myBase.trophies));
    if (cands.length === 0) return;
    const pick = cands[Math.floor(Math.random() * Math.min(5, cands.length))];
    setScreen("world"); setScout(pick[0]); buzz(8);
  }

  return (
    <main style={page}>
      {/* ===================== PLAYFIELD (full-screen) ===================== */}
      {view === "base" && myBase ? (
        <div style={fieldWrap}>
          <BaseGrid
            fill
            base={myBase} tick={state.tick} showTraps
            selected={selected} placing={placing} placingTrap={placingTrap} wallMode={mode === "wall"} moveFrom={moveFrom}
            canPlace={(a, id) => canPlaceAt(myBase, a, id)}
            onSelectBuilding={(a) => { if (mode === "view" && !moveFrom) setSelected(a); }}
            onTile={onTile}
            onCancelPlace={() => { setPlacing(null); setMoveFrom(null); }}
          />
        </div>
      ) : (
        <div style={{ ...fieldWrap, background: "radial-gradient(70% 60% at 50% 46%, rgba(245,179,1,0.05), transparent 64%), radial-gradient(130% 95% at 50% 14%, #11161f 0%, #070a10 74%)" }}>
          <div className="wl-hexgrid" style={{ position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none" }} />
          <div className="wl-scanline" />
          <svg viewBox={worldBox} preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}>
            <defs>
              <clipPath id="wlHexClip"><polygon points={hexPoints(HEX)} /></clipPath>
            </defs>
            {Object.values(state.hexes).map((h) => {
              const key = `${h.q},${h.r}`;
              const { x, y } = axialToPixel(h.q, h.r, HEX);
              const owner = state.claimedHexes[key];
              const mine = !!owner && owner === playerId;
              const b = owner ? state.bases[owner] : undefined;
              const shielded = !!b && b.shieldUntil > state.tick;
              const rim = mine ? "var(--rim-owned)" : shielded ? "var(--success)" : owner ? "var(--rim-enemy)" : "var(--rim-neutral)";
              const sel = scout === owner && !!owner;
              const W = HEX * 2.42; // oversize so the clipped tile fully covers the hex
              return (
                <g key={key} transform={`translate(${x},${y})`} style={{ cursor: "pointer" }}
                  onClick={() => {
                    if (!myBase) { send({ type: "claimBase", q: h.q, r: h.r }); return; }
                    if (mine) { setScreen("base"); return; }
                    if (owner) { setScout(owner); return; }
                  }}>
                  <image href={terrainArt(h.terrain)} x={-W / 2} y={-W / 2} width={W} height={W}
                    clipPath="url(#wlHexClip)" preserveAspectRatio="xMidYMid slice" />
                  {owner && <polygon points={hexPoints(HEX)} fill="rgba(5,7,11,0.18)" pointerEvents="none" />}
                  <polygon points={hexPoints(HEX)} fill="none" stroke={rim} strokeWidth={owner ? 1.8 : 0.5}
                    strokeLinejoin="round" style={owner ? { filter: "drop-shadow(0 0 2px rgba(0,0,0,0.6))" } : undefined} />
                  {sel && <polygon className="wl-glow" points={hexPoints(HEX + 1.4)} fill="none" stroke="var(--rim-selected)" strokeWidth={1.2} strokeDasharray="3 2.4" pointerEvents="none" />}
                  {b && (
                    <>
                      {/* flagpole + TH chip */}
                      <line x1={0} y1={HEX * 0.42} x2={0} y2={HEX * 0.74} stroke="#0a0d14" strokeWidth={1} pointerEvents="none" />
                      <g transform={`translate(0,${HEX * 0.92})`} pointerEvents="none">
                        <rect x={-9} y={-5.2} width={18} height={10} rx={2.4} fill="#0a0d14" stroke="var(--border-strong)" strokeWidth={0.5} />
                        <text textAnchor="middle" dy={2.6} fontSize={6} fill="var(--text-hi)" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>TH{ccLevel(b)}</text>
                      </g>
                      {mine && (
                        <g transform={`translate(0,${-HEX * 0.96})`} pointerEvents="none">
                          <rect x={-8.5} y={-4.6} width={17} height={9} rx={2.2} fill="var(--amber)" />
                          <text textAnchor="middle" dy={2.4} fontSize={5.5} fill="#0c0a04" style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.04em" }}>YOU</text>
                        </g>
                      )}
                      {shielded && (
                        <g transform={`translate(${HEX * 0.62},${-HEX * 0.62})`} pointerEvents="none">
                          <circle r={4.4} fill="var(--success)" />
                          <path d="M0 -2.4 L2.2 -1.4 V0.4 C2.2 1.8 1.2 2.6 0 3 C-1.2 2.6 -2.2 1.8 -2.2 0.4 V-1.4 Z" fill="#06231a" />
                        </g>
                      )}
                    </>
                  )}
                </g>
              );
            })}
          </svg>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: "inset 0 0 120px 34px rgba(5,7,11,0.82)" }} />
        </div>
      )}

      {/* ===================== TOP HUD (overlay) ===================== */}
      <div style={topScrim}>
        {view === "base" && myBase ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
              <TownHallChip level={ccLevel(myBase)} />
              <span style={{ flex: 1 }} />
              <MiniStat label="BUILDERS" value={`${freeBuilders(myBase)} / ${builderCount(myBase)}`} color="var(--amber-text)" />
              <MiniStat label="TROPHIES" value={`${Math.round(trophyC)}`} color="var(--text-hi)" trophy />
              <HudAction icon="📥" label="COLLECT" primary onClick={() => { send({ type: "collect" }); buzz(12); }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <HudResBar kind="gold" value={goldC} cap={storageCap(myBase, "gold")} />
              <HudResBar kind="elixir" value={elixirC} cap={storageCap(myBase, "elixir")} />
              <WarChip value={num(warC)} />
              <Badge tone={leagueFor(myBase.trophies).tone as BadgeTone} variant="soft">{leagueFor(myBase.trophies).name.toUpperCase()}</Badge>
              <span style={{ flex: 1 }} />
              {myBase.shieldUntil > state.tick
                ? <span style={{ ...hudBox, padding: "5px 11px", color: "var(--emerald-text)", font: "700 10px var(--font-display)", letterSpacing: "0.06em" }}>🛡️ {Math.ceil((myBase.shieldUntil - state.tick) / 3600)}h</span>
                : <HudAction icon="🛡️" label="SHIELD" onClick={() => send({ type: "extendShield", hours: 2 })} />}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: "1 1 260px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className="wl-title" style={{ fontSize: 18 }}>{myBase ? "LIVE WORLD MAP" : "CLAIM YOUR GROUND"}</span>
                <Badge tone={connected ? "emerald" : "blood"} variant="soft">{connected ? "● ONLINE" : "● OFFLINE"}</Badge>
                <span className="wl-num" style={{ fontSize: 11, color: "var(--text-secondary)" }}>TICK {state.tick} · {Object.keys(state.players).length} CMDR</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {myBase && <HudAction icon="🎯" label="FIND TARGET" primary onClick={findTarget} />}
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {myBase ? "Tap an enemy village to scout & raid · tap yours to manage it." : "Tap an unclaimed hex to found your village."}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              {myBase && (
                <span style={{ ...hudBox, padding: "5px 11px" }}>
                  <span style={{ width: 9, height: 9, background: "var(--amber)", clipPath: "polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%)" }} />
                  <span className="wl-num" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-hi)" }}>{Math.round(trophyC)}</span>
                  <span className="wl-label" style={{ fontSize: 8 }}>TROPHIES</span>
                </span>
              )}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <LegendChip color="var(--rim-owned)" label="YOU" />
                <LegendChip color="var(--rim-enemy)" label="HOSTILE" />
                <LegendChip color="var(--success)" label="SHIELDED" />
              </div>
            </div>
          </div>
        )}
        {error && <div style={{ marginTop: 8, pointerEvents: "auto" }}><Badge tone="blood" variant="soft" icon="⚠">{error}</Badge></div>}
      </div>

      {/* ===================== LEFT TOOL RAIL (base) ===================== */}
      {view === "base" && myBase && (
        <div style={leftRail}>
          <RailBtn icon="🧱" label="WALL" active={mode === "wall"} onClick={() => { if (mode === "wall") resetBaseUi(); else { setMode("wall"); setPlacing(null); setSelected(null); setMoveFrom(null); } }} />
          <RailBtn icon="⚔️" label="ARMY" onClick={() => setArmyOpen(true)} />
          <RailBtn icon="🤝" label="CLAN" onClick={() => setClanOpen(true)} />
          <RailBtn icon="🎯" label="GOALS" badge={claimableCount} onClick={() => setObjectivesOpen(true)} />
          <RailBtn icon="💰" label="$WAR" onClick={() => setWarOpen(true)} />
        </div>
      )}

      {/* ===================== MODE BANNER (base) ===================== */}
      {view === "base" && myBase && (placing || placingTrap || moveFrom || mode === "wall") && (
        <div style={modeBanner}>
          {moveFrom && <Badge tone="amber" variant="soft" icon="✥">TAP A DESTINATION TILE</Badge>}
          {placing && <Badge tone="amber" variant="soft">PLACING {BUILDINGS[placing].name.toUpperCase()} — TAP A TILE</Badge>}
          {placingTrap && <Badge tone="blood" variant="soft">PLACING {TRAPS[placingTrap].name.toUpperCase()} — TAP OPEN GROUND</Badge>}
          {mode === "wall" && !placing && <Badge tone="amber" variant="soft">TAP TILES TO RAISE WALLS · 🪙{WALL.levels[0].cost.gold}</Badge>}
        </div>
      )}

      {/* ===================== BOTTOM DOCK (nav + build FAB) ===================== */}
      {myBase && (
        <div style={bottomDock}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" }}>
            <SegNav view={view} onBase={() => { setScreen("base"); setScout(null); }} onWorld={() => { setScreen("world"); resetBaseUi(); }} />
            {view === "base" && (
              <Fab active={mode === "build"} onClick={() => { if (mode === "build") resetBaseUi(); else { setMode("build"); setSelected(null); setMoveFrom(null); } }} />
            )}
          </div>
        </div>
      )}

      {/* ===================== BUILD / INFO SHEETS (base) ===================== */}
      {view === "base" && myBase && mode === "build" && !placing && !placingTrap && (
        <div style={sheet}>
          <Panel title="BUILD" accent padding="12px 14px" headerRight={<button onClick={resetBaseUi} style={closeBtn}>✕</button>}>
            <BuildTray base={myBase} war={me?.war ?? 0}
              onPick={(id) => { setPlacing(id); setPlacingTrap(null); }}
              onPickTrap={(t) => { setPlacingTrap(t); setPlacing(null); }}
              active={placing} activeTrap={placingTrap} />
          </Panel>
        </div>
      )}
      {view === "base" && myBase && mode === "view" && selected && myBase.buildings[selected] && (
        <div style={sheet}>
          <Panel title={BUILDINGS[myBase.buildings[selected].id].name} accent padding="12px 14px"
            headerRight={<button onClick={() => setSelected(null)} style={closeBtn}>✕</button>}>
            <BuildingInfo base={myBase} anchor={selected} building={myBase.buildings[selected]} tick={state.tick} war={me?.war ?? 0}
              onUpgrade={() => send({ type: "upgradeBuilding", tileKey: selected })}
              onFinish={() => send({ type: "finishNow", tileKey: selected })}
              onMove={() => { setMoveFrom(selected); setSelected(null); }}
            />
          </Panel>
        </div>
      )}

      {/* ===================== Overlays ===================== */}
      {myBase && armyOpen && (
        <Overlay onClose={() => setArmyOpen(false)}>
          <ArmyPanel base={myBase} onTrain={(u) => send({ type: "trainTroop", unit: u })} onClose={() => setArmyOpen(false)} />
        </Overlay>
      )}
      {myBase && clanOpen && playerId && (
        <Overlay onClose={() => setClanOpen(false)}>
          <ClanPanel state={state} playerId={playerId} send={send} onClose={() => setClanOpen(false)} />
        </Overlay>
      )}
      {myBase && objectivesOpen && me && (
        <Overlay onClose={() => setObjectivesOpen(false)}>
          <ObjectivesPanel me={me} onClaim={(id) => { send({ type: "claimObjective", id }); buzz(12); }} onClose={() => setObjectivesOpen(false)} />
        </Overlay>
      )}
      {myBase && warOpen && me && (
        <Overlay onClose={() => setWarOpen(false)}>
          <WarPanel me={me} state={state} onClaim={(amt) => { send({ type: "claim", amount: amt }); buzz(20); }} onLink={(a) => { link(a); buzz(8); }} onClose={() => setWarOpen(false)} />
        </Overlay>
      )}
      {scout && state.bases[scout] && myBase && (
        <Overlay onClose={() => setScout(null)}>
          <ScoutCard target={state.bases[scout]} tick={state.tick}
            canAttack={armyTotal(myBase.army) > 0 && state.bases[scout].shieldUntil <= state.tick}
            onAttack={() => scout && startAttack(scout)} onClose={() => setScout(null)} />
        </Overlay>
      )}

      {/* Deploy + battle playback */}
      {raidTarget && state.bases[raidTarget] && myBase && (
        <div style={overlay}>
          <div style={{ width: "100%", maxWidth: 560, maxHeight: "94vh", overflowY: "auto" }}>
            <Panel title={frames ? "RAID IN PROGRESS" : "DEPLOY YOUR ARMY"} rim="blood" padding="12px 14px"
              headerRight={!frames && !launching ? <button onClick={cancelAttack} style={closeBtn}>✕</button> : null}>
              <BaseGrid
                base={frames ? capturedDef! : state.bases[raidTarget]}
                tick={state.tick}
                readOnly={!!frames}
                deployMode={!frames && !launching}
                deployMarkers={frames ? undefined : deployList}
                frame={frames ? frames[frameIdx] : null}
                onTile={placeTroop}
              />
              {!frames ? (
                <>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {UNIT_IDS.filter((u) => (myBase.army[u] ?? 0) > 0).map((u) => {
                      const left = (myBase.army[u] ?? 0) - deployList.filter((d) => d.unit === u).length;
                      return (
                        <button key={u} onClick={() => setDeployUnit(u)} disabled={left <= 0}
                          style={{ ...unitChip, outline: deployUnit === u ? "2px solid var(--rim-selected)" : "none", opacity: left <= 0 ? 0.4 : 1 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: UNIT_COLOR[u], display: "inline-block" }} />
                          {UNITS[u].name} <span className="wl-num" style={{ color: "var(--text-secondary)" }}>×{left}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                    {armyTotal(myBase.army) === 0 ? "No troops — train an army first." : `Select a unit, then tap open ground. ${deployList.length} deployed.`}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <Button variant="danger" full icon="⚔️" disabled={deployList.length === 0 || launching} onClick={launchRaid}>
                      {launching ? "RAIDING…" : deployList.length === 0 ? "DEPLOY TROOPS" : `ATTACK WITH ${deployList.length}`}
                    </Button>
                  </div>
                </>
              ) : (
                <div style={{ marginTop: 10 }}>
                  <Button variant="outline" full onClick={() => setFrameIdx((frames?.length ?? 1) - 1)}>SKIP ▶▶</Button>
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}

      {report && !raidTarget && (
        <Overlay onClose={clearReport}>
          <ResultCard report={report} mine={report.attacker === playerId} onClose={clearReport}
            onRevenge={state.bases[report.attacker] ? () => { const atk = report.attacker; clearReport(); setScreen("world"); setScout(atk); } : undefined} />
        </Overlay>
      )}

      <BaseTutorial base={myBase} />
    </main>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function BuildTray({ base, war, onPick, onPickTrap, active, activeTrap }: { base: CocBase; war: number; onPick: (id: CocBuildingId) => void; onPickTrap: (t: CocTrapId) => void; active: CocBuildingId | null; activeTrap: CocTrapId | null }) {
  const tier = ccTier(ccLevel(base));
  const inCaps = Object.keys(tier.caps) as CocBuildingId[];
  const countOf = (id: CocBuildingId) => Object.values(base.buildings).filter((b) => b.id === id).length;
  const sections: { key: string; ids: CocBuildingId[] }[] = [
    { key: "RESOURCES", ids: inCaps.filter((id) => ["collector", "storage"].includes(BUILDINGS[id].category)) },
    { key: "DEFENSE", ids: inCaps.filter((id) => BUILDINGS[id].category === "defense") },
    { key: "ARMY", ids: inCaps.filter((id) => BUILDINGS[id].category === "army") },
    { key: "SPECIAL", ids: ["builderHut" as CocBuildingId, ...inCaps.filter((id) => id === "clanCastle")] },
  ].filter((s) => s.ids.length > 0);
  const tabs = [...sections.map((s) => s.key), ...(tier.maxTraps > 0 ? ["TRAPS"] : [])];
  const [tab, setTab] = useState(tabs[0]);
  const activeTab = tabs.includes(tab) ? tab : tabs[0];

  const buildingCard = (id: CocBuildingId) => {
    const def = BUILDINGS[id];
    const lv = levelDef(id, 1)!;
    if (id === "builderHut") {
      const cost = builderCost(builderCount(base));
      const atMax = builderCount(base) >= MAX_BUILDERS;
      return <TrayCard key={id} id={id} name={def.name} sub={atMax ? "MAX BUILDERS" : `💎${num(cost)} · instant`} ok={!atMax && war >= cost} activeId={active} onPick={onPick} />;
    }
    const atCap = countOf(id) >= tier.caps[id]!.maxCount;
    const afford = base.gold >= (lv.cost.gold ?? 0) && base.elixir >= (lv.cost.elixir ?? 0);
    return <TrayCard key={id} id={id} name={def.name} sub={atCap ? "AT LIMIT" : `${costStr(lv.cost)} · ${lv.buildTimeSec}s`} ok={!atCap && afford && freeBuilders(base) > 0} activeId={active} onPick={onPick} />;
  };

  return (
    <div>
      {/* segmented control */}
      <div style={{ display: "flex", gap: 4, background: "var(--surface-sunken)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-md)", padding: 3 }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "6px 4px", borderRadius: "var(--radius-sm)", border: 0, cursor: "pointer",
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, letterSpacing: "0.06em",
            background: t === activeTab ? "var(--cta-bg)" : "transparent",
            color: t === activeTab ? "var(--cta-fg)" : "var(--text-secondary)",
          }}>{t}{t === "TRAPS" ? ` ${Object.keys(base.traps).length}/${tier.maxTraps}` : ""}</button>
        ))}
      </div>
      <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
        {activeTab === "TRAPS"
          ? TRAP_IDS.map((tid) => {
              const t = TRAPS[tid];
              const atCap = Object.keys(base.traps).length >= tier.maxTraps;
              const ok = !atCap && base.gold >= t.cost.gold;
              return (
                <button key={tid} disabled={!ok} onClick={() => onPickTrap(tid)}
                  style={{ ...trayCard, opacity: ok ? 1 : 0.45, outline: activeTrap === tid ? "2px solid var(--rim-selected)" : "none", cursor: ok ? "pointer" : "not-allowed" }}>
                  <span style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid var(--blood-text)", background: "rgba(156,43,43,0.35)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{tid === "airMine" ? "▲" : "●"}</span>
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</span>
                    <span className="wl-num" style={{ fontSize: 11, color: "var(--text-secondary)" }}>{atCap ? "AT LIMIT" : `🪙${t.cost.gold} · hidden · ${t.target}`}</span>
                  </span>
                </button>
              );
            })
          : (sections.find((s) => s.key === activeTab)?.ids ?? []).map(buildingCard)}
      </div>
    </div>
  );
}

function TrayCard({ id, name, sub, ok, activeId, onPick }: { id: CocBuildingId; name: string; sub: string; ok: boolean; activeId: CocBuildingId | null; onPick: (id: CocBuildingId) => void }) {
  return (
    <button disabled={!ok} onClick={() => onPick(id)} style={{ ...trayCard, opacity: ok ? 1 : 0.45, outline: activeId === id ? "2px solid var(--rim-selected)" : "none", cursor: ok ? "pointer" : "not-allowed" }}>
      <img src={buildingArt(id, 1)} alt="" width={34} height={34} style={{ flexShrink: 0 }} />
      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
        <span className="wl-num" style={{ fontSize: 11, color: "var(--text-secondary)" }}>{sub}</span>
      </span>
    </button>
  );
}

function BuildingInfo({ base, anchor, building, tick, war, onUpgrade, onFinish, onMove }: {
  base: CocBase; anchor: string; building: PlacedBuilding; tick: number; war: number; onUpgrade: () => void; onFinish: () => void; onMove: () => void;
}) {
  const def = BUILDINGS[building.id];
  const job = base.jobs.find((j) => j.tileKey === anchor);
  const next = building.level + 1;
  const maxed = next > maxLevelOf(building.id);
  const cap = ccTier(ccLevel(base)).caps[building.id];
  const ccBlocked = building.id !== "commandCenter" && (!cap || next > cap.maxLevel);
  const lv = !maxed ? levelDef(building.id, next) : undefined;
  const cost = lv?.cost ?? {};
  const afford = base.gold >= (cost.gold ?? 0) && base.elixir >= (cost.elixir ?? 0);
  const ok = building.level >= 1 && !job && !maxed && !ccBlocked && afford && freeBuilders(base) > 0;
  const total = job ? levelDef(job.buildingId, job.toLevel)?.buildTimeSec ?? 1 : 1;
  const remaining = job ? Math.max(0, job.finishesAtTick - tick) : 0;
  const stats = levelDef(building.id, Math.max(1, building.level));
  const movable = building.level >= 1 && !job;
  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <Badge tone={building.level >= 1 ? "amber" : "sky"} variant="soft">{building.level >= 1 ? `LEVEL ${building.level}` : "UNDER CONSTRUCTION"}</Badge>
        {def.category === "defense" && stats && (<><Badge tone="blood" variant="soft">DEF {stats.hp}</Badge><Badge tone="teal" variant="soft">RNG {stats.range}</Badge><Badge tone="neutral" variant="soft">{stats.targets?.toUpperCase()}</Badge></>)}
        {building.id === "armyCamp" && stats?.housing && <Badge tone="blood" variant="soft">⌂ {stats.housing}</Badge>}
        {building.id === "clanCastle" && <Badge tone="neutral" variant="soft">REINFORCE: SOON</Badge>}
      </div>
      {job ? (
        <div style={{ display: "grid", gap: 8 }}>
          <ProgressBar tone="amber" label="BUILDING" valueText={`${remaining}s`} value={total - remaining} max={total} />
          <Button variant="outline" full icon="💎" disabled={war < finishCost(remaining)} onClick={onFinish}>FINISH NOW · 💎{finishCost(remaining).toLocaleString()}</Button>
        </div>
      ) : maxed ? <Badge tone="neutral" variant="soft">MAX LEVEL</Badge>
        : <Button variant="primary" full disabled={!ok} icon="⬆" onClick={onUpgrade}>UPGRADE → L{next} · {costStr(cost)} · {lv?.buildTimeSec}s{ccBlocked ? "  · RAISE TH" : ""}</Button>}
      {movable && <div style={{ marginTop: 8 }}><Button variant="outline" full icon="✥" onClick={onMove}>MOVE</Button></div>}
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
              <span className="wl-num" style={{ fontSize: 11, color: "var(--text-secondary)" }}>×{have}{queued ? ` (+${queued})` : ""} · 🧪{d.cost.elixir} · ⌂{d.housing}</span>
            </Button>
          );
        })}
      </div>
    </Panel>
  );
}

function ScoutCard({ target, tick, canAttack, onAttack, onClose }: { target: CocBase; tick: number; canAttack: boolean; onAttack: () => void; onClose: () => void }) {
  const shielded = target.shieldUntil > tick;
  return (
    <Panel title="SCOUT REPORT" rim="blood" padding="14px" headerRight={<button onClick={onClose} style={closeBtn}>✕</button>}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
        <Stat label="TOWN HALL" value={`L${ccLevel(target)}`} accent="sky" />
        <Stat label="EST LOOT" value={`🪙${num(target.gold * LOOT_PCT)} 🧪${num(target.elixir * LOOT_PCT)}`} accent="amber" />
        {shielded ? <Badge tone="emerald" variant="soft">SHIELDED</Badge> : <Badge tone="blood" variant="soft">EXPOSED</Badge>}
      </div>
      <div style={{ borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--hairline)" }}>
        <BaseGrid base={target} tick={tick} readOnly />
      </div>
      <div style={{ marginTop: 12 }}>
        <Button variant="danger" full icon="⚔️" disabled={!canAttack} onClick={onAttack}>
          {shielded ? "TARGET SHIELDED" : canAttack ? "ATTACK" : "TRAIN AN ARMY FIRST"}
        </Button>
      </div>
    </Panel>
  );
}

function ClanPanel({ state, playerId, send, onClose }: { state: CocWorld; playerId: string; send: (c: import("@/sim/coc").CocCommand) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const me = state.players[playerId];
  const myClan = me?.clanId ? state.clans[me.clanId] : null;
  const myBase = state.bases[playerId];
  const myArmy = myBase?.army ?? {};
  const short = (id: string) => id.slice(0, 6).toUpperCase();

  if (myClan) {
    const mates = myClan.members.filter((m) => m !== playerId);
    const myUnits = UNIT_IDS.filter((u) => (myArmy[u] ?? 0) > 0);
    return (
      <Panel title={myClan.name} accent padding="14px" headerRight={<button onClick={onClose} style={closeBtn}>✕</button>}>
        <span className="wl-label">ROSTER ({myClan.members.length})</span>
        <div style={{ display: "grid", gap: 4, margin: "8px 0 12px" }}>
          {myClan.members.map((m) => (
            <div key={m} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span className="wl-num">{short(m)}{m === playerId ? " (you)" : ""}</span>
              {m === myClan.founder && <Badge tone="amber" variant="soft">FOUNDER</Badge>}
            </div>
          ))}
        </div>
        {myBase && (
          <div style={{ margin: "0 0 12px" }}>
            <span className="wl-label">YOUR CLAN CASTLE</span>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
              {garrisonCap(myBase) > 0
                ? `Defenders ${garrisonUsed(myBase)}/${garrisonCap(myBase)}${garrisonUsed(myBase) > 0 ? " — they fight for you when raided" : " — ask clanmates to donate"}`
                : "Build a Clan Castle to receive defending troops."}
            </div>
          </div>
        )}
        {mates.length > 0 && myUnits.length > 0 && (
          <>
            <span className="wl-label">DONATE A TROOP</span>
            <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
              {mates.map((m) => (
                <div key={m} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span className="wl-num" style={{ fontSize: 11, minWidth: 56 }}>{short(m)}</span>
                  {myUnits.map((u) => (
                    <Button key={u} size="sm" variant="secondary" onClick={() => send({ type: "donateTroops", toOwner: m, army: { [u]: 1 } })}>🎁{UNIT_ICON[u]}</Button>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{ marginTop: 14 }}><Button variant="danger" full onClick={() => { send({ type: "leaveClan" }); onClose(); }}>LEAVE CLAN</Button></div>
      </Panel>
    );
  }

  const clans = Object.values(state.clans);
  return (
    <Panel title="CLANS" accent padding="14px" headerRight={<button onClick={onClose} style={closeBtn}>✕</button>}>
      <span className="wl-label">FOUND A CLAN</span>
      <div style={{ display: "flex", gap: 6, margin: "8px 0 14px" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Clan name" style={input} />
        <Button variant="primary" disabled={name.trim().length < 3} onClick={() => { send({ type: "createClan", name }); onClose(); }}>CREATE</Button>
      </div>
      <span className="wl-label">JOIN A CLAN</span>
      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
        {clans.length === 0 && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No clans yet — found the first.</span>}
        {clans.map((c) => (
          <Button key={c.id} variant="secondary" full style={rowBtn} onClick={() => { send({ type: "joinClan", clanId: c.id }); onClose(); }}>
            <span>{c.name}</span>
            <span className="wl-num" style={{ fontSize: 11, color: "var(--text-secondary)" }}>{c.members.length}/10</span>
          </Button>
        ))}
      </div>
    </Panel>
  );
}

function TownHallChip({ level }: { level: number }) {
  return (
    <div style={{ ...hudBox, padding: "5px 11px 5px 5px" }}>
      <span style={{ width: 32, height: 32, borderRadius: 7, background: "#0a0d14", border: "1px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src={buildingArt("commandCenter", level)} alt="" width={26} height={26} />
      </span>
      <div style={{ lineHeight: 1.05 }}>
        <div className="wl-label" style={{ fontSize: 8 }}>TOWN HALL</div>
        <div className="wl-num" style={{ fontSize: 14, fontWeight: 700, color: "var(--text-hi)" }}>LV {level}</div>
      </div>
    </div>
  );
}
function MiniStat({ label, value, color, trophy }: { label: string; value: string; color: string; trophy?: boolean }) {
  return (
    <div style={{ ...hudBox, flexDirection: "column", gap: 1, padding: "4px 11px", alignItems: "center" }}>
      <div className="wl-label" style={{ fontSize: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {trophy && <span style={{ width: 8, height: 8, background: "var(--amber)", clipPath: "polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%)" }} />}
        <span className="wl-num" style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
      </div>
    </div>
  );
}
function HudResBar({ kind, value, cap }: { kind: "gold" | "elixir"; value: number; cap: number }) {
  const pct = cap > 0 ? Math.min(100, (value / cap) * 100) : 0;
  const color = kind === "gold" ? "var(--amber)" : "var(--teal)";
  return (
    <div style={{ ...hudBox, flexDirection: "column", alignItems: "stretch", gap: 5, padding: "6px 11px", flex: "1 1 116px", minWidth: 110 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {kind === "gold"
          ? <span style={{ width: 11, height: 11, background: "var(--amber)", transform: "rotate(45deg)" }} />
          : <span style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--teal)" }} />}
        <span className="wl-num" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-hi)" }}>{num(value)}</span>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: "var(--surface-sunken)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 320ms var(--ease-out)" }} />
      </div>
    </div>
  );
}
function WarChip({ value }: { value: string }) {
  return (
    <div style={{ ...hudBox, padding: "6px 11px", background: "rgba(245,179,1,0.06)", border: "1px solid rgba(245,179,1,0.35)" }}>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 9, letterSpacing: "0.06em", color: "var(--amber-text)" }}>$WAR</span>
      <span className="wl-num" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-hi)" }}>{value}</span>
    </div>
  );
}
function HudAction({ icon, label, primary, onClick }: { icon: string; label: string; primary?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 12px", borderRadius: 9, cursor: "pointer", pointerEvents: "auto",
      border: primary ? "none" : "1px solid var(--hairline)",
      background: primary ? "var(--amber)" : "var(--surface-card)",
      color: primary ? "#0c0a04" : "var(--text-secondary)",
      fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 10, letterSpacing: "0.06em",
      boxShadow: primary ? "var(--glow-amber)" : undefined,
    }}><span aria-hidden style={{ fontSize: 13 }}>{icon}</span>{label}</button>
  );
}
function RailBtn({ icon, label, active, badge, onClick }: { icon: string; label: string; active?: boolean; badge?: number; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      position: "relative", width: 56, height: 56, borderRadius: 13, cursor: "pointer",
      border: active ? "none" : "1px solid var(--hairline)",
      background: active ? "var(--amber)" : "var(--surface-card)",
      color: active ? "#0c0a04" : "var(--text-secondary)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
      boxShadow: active ? "var(--glow-amber)" : "var(--shadow-1)",
    }}>
      <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 8, letterSpacing: "0.06em" }}>{label}</span>
      {badge ? <span style={{ position: "absolute", top: -6, right: -6, minWidth: 17, height: 17, padding: "0 4px", borderRadius: 9, background: "var(--cta-bg, var(--amber))", color: "#0c0a04", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid var(--panel-void)" }}>{badge}</span> : null}
    </button>
  );
}
function SegNav({ view, onBase, onWorld }: { view: "world" | "base"; onBase: () => void; onWorld: () => void }) {
  const seg = (active: boolean): CSSProperties => ({ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minWidth: 104, height: 44, padding: "0 16px", borderRadius: 8, border: 0, cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", background: active ? "var(--amber)" : "transparent", color: active ? "#0c0a04" : "var(--text-secondary)" });
  return (
    <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--surface-card)", border: "1px solid var(--hairline)", borderRadius: 11, boxShadow: "var(--shadow-2)" }}>
      <button style={seg(view === "base")} onClick={onBase}><span aria-hidden>🏠</span>MY BASE</button>
      <button style={seg(view === "world")} onClick={onWorld}><span aria-hidden>🗺️</span>WORLD</button>
    </div>
  );
}
function Fab({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={active ? "close build" : "build"} style={{
      width: 54, height: 50, borderRadius: 13, cursor: "pointer", fontSize: 22, lineHeight: 1,
      border: active ? "1px solid var(--amber)" : "none",
      background: active ? "var(--surface-card)" : "var(--amber)",
      color: active ? "var(--amber-text)" : "#0c0a04",
      display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--glow-amber)",
    }}>{active ? "✕" : "🏗️"}</button>
  );
}
function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, background: "rgba(5,7,11,0.55)", border: "1px solid var(--hairline)" }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      <span className="wl-label" style={{ fontSize: 9 }}>{label}</span>
    </span>
  );
}

function ObjectivesPanel({ me, onClaim, onClose }: { me: CocPlayer; onClaim: (id: string) => void; onClose: () => void }) {
  const objs = me.objectives ?? [];
  return (
    <Panel title="OBJECTIVES" accent padding="14px" headerRight={<button onClick={onClose} style={closeBtn}>✕</button>}>
      <div style={{ display: "grid", gap: 8 }}>
        {objs.map((o) => {
          const done = o.progress >= o.target;
          return (
            <div key={o.id} style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-sm)", padding: "8px 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13 }}>{objectiveLabel(o)}</span>
                <span className="wl-num" style={{ fontSize: 11, color: "var(--amber-text)" }}>💎{o.reward}</span>
              </div>
              <div style={{ marginTop: 6 }}>
                <ProgressBar tone="amber" value={Math.min(o.progress, o.target)} max={o.target} valueText={`${Math.min(o.progress, o.target)}/${o.target}`} />
              </div>
              {done && <div style={{ marginTop: 8 }}><Button size="sm" variant="primary" full onClick={() => onClaim(o.id)}>CLAIM 💎{o.reward}</Button></div>}
            </div>
          );
        })}
        {objs.length === 0 && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No objectives yet.</span>}
      </div>
    </Panel>
  );
}

function WarPanel({ me, state, onClaim, onLink, onClose }: { me: CocPlayer; state: CocWorld; onClaim: (amt: number) => void; onLink: (addr: string) => void; onClose: () => void }) {
  const [addr, setAddr] = useState(me.wallet ?? "");
  const pool = state.seasonPool ?? 0;
  const secsLeft = state.season ? Math.max(0, state.season.endsAtTick - state.tick) : 0;
  const validAddr = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr.trim());
  const linked = !!me.wallet;
  return (
    <Panel title="$WAR · SEASON" accent padding="14px" headerRight={<button onClick={onClose} style={closeBtn}>✕</button>}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
        <Stat label="SEASON" value={`#${state.season?.id ?? 1}`} accent="sky" />
        <Stat label="ENDS IN" value={fmtDur(secsLeft)} accent="amber" />
        <Stat label="🏦 POOL" value={num(pool)} accent="amber" />
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
        <Stat label="💎 YOUR $WAR" value={num(me.war)} accent="amber" />
        <Stat label="CLAIMED" value={num(me.claimed ?? 0)} accent="emerald" />
      </div>
      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 10px", lineHeight: 1.4 }}>
        Rewards are paid from the season pool, which fills only from $WAR sinks — no minting. Claiming records an on-chain withdrawal; the treasury settles it to your Solana wallet.
      </p>
      <span className="wl-label">PAYOUT WALLET (SOLANA)</span>
      <div style={{ display: "flex", gap: 6, margin: "8px 0 12px" }}>
        <input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Your $WAR wallet address" style={{ ...input, fontFamily: "var(--font-mono)", fontSize: 11 }} />
        <Button variant="secondary" disabled={!validAddr || addr.trim() === me.wallet} onClick={() => onLink(addr.trim())}>{linked ? "UPDATE" : "LINK"}</Button>
      </div>
      {linked && <div style={{ fontSize: 11, color: "var(--emerald-text)", marginBottom: 10 }}>✓ Linked — payouts settle to {me.wallet!.slice(0, 4)}…{me.wallet!.slice(-4)}</div>}
      <Button variant="primary" full icon="💰" disabled={me.war <= 0 || !linked} onClick={() => onClaim(me.war)}>
        {linked ? `CLAIM ${num(me.war)} $WAR ON-CHAIN` : "LINK A WALLET TO CLAIM"}
      </Button>
    </Panel>
  );
}

function ResultCard({ report, mine, onClose, onRevenge }: { report: BattleReport; mine: boolean; onClose: () => void; onRevenge?: () => void }) {
  return (
    <Panel title={mine ? "RAID REPORT" : "UNDER ATTACK"} rim={mine ? undefined : "blood"} accent={mine} padding="16px" headerRight={<button onClick={onClose} style={closeBtn}>✕</button>}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, letterSpacing: 6 }}>{[0, 1, 2].map((i) => <span key={i} style={{ color: i < report.stars ? "var(--amber)" : "var(--disabled)" }}>★</span>)}</div>
        <div className="wl-num" style={{ fontSize: 28, marginTop: 4 }}>{Math.round(report.destructionPct * 100)}%</div>
        <div className="wl-label">DESTRUCTION</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 14 }}>
        <Stat label="🪙 LOOT" value={num(report.loot.gold)} accent="amber" align="stack" />
        <Stat label="🧪 LOOT" value={num(report.loot.elixir)} accent="violet" align="stack" />
        <Stat label="🏆" value={`${report.trophies >= 0 ? "+" : ""}${report.trophies}`} accent={report.trophies >= 0 ? "emerald" : "blood"} align="stack" />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {!mine && onRevenge && <Button variant="danger" full icon="⚔️" onClick={onRevenge}>REVENGE</Button>}
        <Button variant="primary" full onClick={onClose}>RETURN HOME</Button>
      </div>
    </Panel>
  );
}

function hexPoints(size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${(size * Math.cos(a)).toFixed(2)},${(size * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

const page: CSSProperties = { position: "fixed", inset: 0, overflow: "hidden", background: "var(--bg-app)", color: "var(--text-primary)", fontFamily: "var(--font-ui)" };
const fieldWrap: CSSProperties = { position: "absolute", inset: 0, overflow: "hidden", touchAction: "none" };
const topScrim: CSSProperties = { position: "absolute", left: 0, right: 0, top: 0, zIndex: 40, padding: "calc(env(safe-area-inset-top) + 12px) 12px 18px", background: "linear-gradient(180deg, rgba(5,7,11,0.94) 0%, rgba(5,7,11,0.55) 68%, transparent)", pointerEvents: "none" };
const bottomDock: CSSProperties = { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 45, padding: "20px 12px calc(env(safe-area-inset-bottom) + 12px)", background: "linear-gradient(0deg, rgba(5,7,11,0.94) 0%, rgba(5,7,11,0.4) 70%, transparent)", pointerEvents: "none", display: "flex", justifyContent: "center" };
const leftRail: CSSProperties = { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", zIndex: 42, display: "flex", flexDirection: "column", gap: 9 };
const modeBanner: CSSProperties = { position: "absolute", left: 0, right: 0, bottom: 96, zIndex: 44, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 6, padding: "0 12px", pointerEvents: "none" };
const hudBox: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 10px", background: "var(--surface-card)", border: "1px solid var(--hairline)", borderRadius: 10, pointerEvents: "auto" };
const rowBtn: CSSProperties = { justifyContent: "space-between", textAlign: "left", fontWeight: 500 };
const trayCard: CSSProperties = { display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "var(--surface-raised)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-sm)", padding: "8px 10px", color: "var(--text-primary)" };
const closeBtn: CSSProperties = { background: "transparent", color: "var(--text-secondary)", border: 0, cursor: "pointer", fontSize: 14, lineHeight: 1 };
const overlay: CSSProperties = { position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 };
const sheet: CSSProperties = { position: "fixed", left: 8, right: 8, bottom: "max(8px, env(safe-area-inset-bottom))", maxWidth: 560, margin: "0 auto", zIndex: 55, maxHeight: "46vh", overflowY: "auto" };
const unitChip: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, background: "var(--surface-raised)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-sm)", padding: "6px 10px", color: "var(--text-primary)", fontSize: 12, cursor: "pointer" };
const input: CSSProperties = { flex: 1, background: "var(--surface-sunken)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", padding: "8px 10px", fontSize: 13, fontFamily: "var(--font-ui)" };
