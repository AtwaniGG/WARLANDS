"use client";

import { useGame } from "@/game/store";
import { PLOT_TYPES } from "@/game/plotTypes";
import { BUILDINGS, BUILDING_IDS, isBuildingAllowedOnTerrain } from "@/game/buildings";
import { RESOURCES, type ResourceId } from "@/game/resources";
import { upgradeCost, diminishingReturns } from "@/game/formulas";
import { MilitaryPanel, RaidPanel, EmpirePlotPanel } from "./MilitaryPanel";
import { Badge, Button, ResourceChip } from "./ui";
import { ResourceIcon } from "./GameIcons";

function num(n: number | undefined) {
  return Math.floor(n ?? 0).toLocaleString();
}

export function PlotPanel() {
  const selected = useGame((s) => s.selectedHex);
  const plots = useGame((s) => s.plots);
  const npcs = useGame((s) => s.npcs);
  const world = useGame((s) => s.world);
  const war = useGame((s) => s.war);
  const claimPlot = useGame((s) => s.claimPlot);
  const build = useGame((s) => s.build);
  const upgrade = useGame((s) => s.upgrade);
  const setFactoryProduct = useGame((s) => s.setFactoryProduct);
  const unstake = useGame((s) => s.unstake);
  const storageCap = useGame((s) => s.storageCap);
  const empireAt = useGame((s) => s.empireAt);

  if (!selected) {
    return (
      <div className="p-4" style={{ fontSize: "13px", color: "var(--text-lo)" }}>
        Select a hex on the map to inspect or claim it.
      </div>
    );
  }

  const hex = world.hexes.get(selected);
  if (!hex) return null;
  const def = PLOT_TYPES[hex.terrain];
  const plot = plots[selected];
  const npc = npcs[selected];
  const empire = empireAt(selected);

  // --- Rival empire territory: diplomacy + raid/siege, no claim ---
  if (!plot && empire) {
    return (
      <div className="space-y-3 p-4">
        <EmpirePlotPanel hexKey={selected} />
        <div style={{ fontSize: "12px", color: "var(--text-lo)" }}>Hex ({hex.q}, {hex.r}) · {def.name} held by {empire.empire.name}.</div>
        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Conquer this empire&apos;s territory (siege) to open the land for claiming.</p>
      </div>
    );
  }

  // --- Unclaimed: show stake/claim CTA (+ raid panel if a hostile camp sits here) ---
  if (!plot) {
    const claimIndex = Object.keys(plots).length + 1;
    const canAfford = war >= def.stake;
    return (
      <div className="space-y-3 p-4">
        {npc && npc.defeatedAtTick === null && <RaidPanel npcKey={selected} />}
        <div>
          <div className="wl-title" style={{ fontSize: "18px", color: def.color }}>{def.name}</div>
          <div style={{ fontSize: "12px", color: "var(--text-lo)" }}>Hex ({hex.q}, {hex.r}) · ring {hex.ring}</div>
        </div>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{def.blurb}</p>
        <div
          className="space-y-1 p-3"
          style={{ borderRadius: "var(--radius-md)", background: "rgba(26,32,48,0.5)", fontSize: "12px" }}
        >
          <Row label="Stake to claim" value={`${num(def.stake)} $WAR`} />
          <Row label="Defense mult" value={`×${def.defenseMult}`} />
          <Row label="Reward mult" value={`×${def.rewardMult}`} />
          <Row label="This would be plot #" value={`${claimIndex} (yield DR ×${diminishingReturns(claimIndex).toFixed(2)})`} />
          <Row label="Protection" value={def.protectable ? "eligible" : "never (warzone)"} />
        </div>
        <Button variant="primary" full icon="⚔️" disabled={!canAfford} onClick={() => claimPlot(hex.q, hex.r)}>
          {canAfford ? `Stake ${num(def.stake)} $WAR & Claim` : "Insufficient $WAR"}
        </Button>
        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Staked $WAR is <span style={{ color: "var(--text-secondary)" }}>locked, never spent</span>. You get it back
          on unstake (minus a small early-unstake fee). It can never be looted by other players.
        </p>
      </div>
    );
  }

  // --- Owned: show economy management ---
  const cap = storageCap(plot);
  const terrainProduces = def.produces;
  const camp = plot.buildings.find((b) => b.id === "camp");
  const slotCap = 3 + (camp?.level ?? 1) * 2;
  const usedSlots = plot.buildings.filter((b) => b.id !== "camp").length;

  const buildable = BUILDING_IDS.filter((id) => {
    const bd = BUILDINGS[id];
    if (bd.kind === "hq") return false;
    return isBuildingAllowedOnTerrain(bd, terrainProduces);
  });

  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="flex items-center justify-between">
          <div className="wl-title" style={{ fontSize: "18px", color: def.color }}>{plot.name}</div>
          <Badge tone="amber">Owned</Badge>
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-lo)" }}>
          {def.name} · staked {num(plot.stakeLocked)} $WAR · plot #{plot.claimIndex} (DR ×{diminishingReturns(plot.claimIndex).toFixed(2)})
        </div>
        <div className="mt-1" style={{ fontSize: "12px" }}>
          Defense: <span style={{ color: plot.defensePct < 0.6 ? "var(--blood-text)" : "var(--emerald-text)" }}>{Math.round(plot.defensePct * 100)}%</span>
        </div>
      </div>

      {/* Inventory */}
      <div>
        <div className="wl-label mb-1">Stockpile (cap {num(cap)})</div>
        <div className="grid grid-cols-2 gap-1">
          {(Object.keys(plot.resources) as ResourceId[])
            .filter((r) => (plot.resources[r] ?? 0) > 0.01)
            .map((r) => (
              <ResourceChip
                key={r}
                icon={<ResourceIcon id={r} size={15} />}
                name={RESOURCES[r].name}
                amount={num(plot.resources[r])}
                tier={RESOURCES[r].tier}
                size="sm"
              />
            ))}
        </div>
      </div>

      {/* Buildings */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="wl-label">Buildings</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>slots {usedSlots}/{slotCap}</span>
        </div>
        <div className="space-y-1">
          {plot.buildings.map((b, i) => {
            const bd = BUILDINGS[b.id];
            const cost = upgradeCost(bd.baseCost || 200, b.level + 1);
            return (
              <div
                key={i}
                className="p-2"
                style={{ borderRadius: "var(--radius-sm)", background: "rgba(26,32,48,0.5)", fontSize: "12px" }}
              >
                <div className="flex items-center justify-between">
                  <span>{bd.icon} {bd.name} <span style={{ color: "var(--text-muted)" }}>L{b.level}</span></span>
                  {b.level < bd.maxLevel && (
                    <Button variant="info" size="sm" disabled={war < cost} onClick={() => upgrade(selected, i)}>
                      ⬆ {num(cost)}
                    </Button>
                  )}
                </div>
                {bd.kind === "factory" && bd.makes && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {bd.makes.map((p) => (
                      <button
                        key={p}
                        onClick={() => setFactoryProduct(selected, i, p)}
                        style={{
                          borderRadius: "var(--radius-sm)",
                          padding: "2px 6px",
                          fontSize: "10px",
                          cursor: "pointer",
                          border: "none",
                          color: b.activeProduct === p ? "#eafff2" : "var(--text-secondary)",
                          background: b.activeProduct === p ? "#15803d" : "var(--surface-raised)",
                        }}
                      >
                        {RESOURCES[p].icon} {RESOURCES[p].name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Build menu */}
      <div>
        <div className="wl-label mb-1">Construct</div>
        <div className="grid grid-cols-1 gap-1">
          {buildable.map((id) => {
            const bd = BUILDINGS[id];
            const resCost = Object.entries(bd.baseResourceCost)
              .map(([k, v]) => `${v} ${RESOURCES[k as ResourceId].icon}`)
              .join(" ");
            const blocked = usedSlots >= slotCap || war < bd.baseCost;
            return (
              <button
                key={id}
                onClick={() => build(selected, id)}
                disabled={blocked}
                className="flex items-center justify-between px-2 py-1.5 text-left"
                style={{
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--hairline)",
                  background: "rgba(26,32,48,0.6)",
                  fontSize: "12px",
                  color: "var(--text-hi)",
                  cursor: blocked ? "not-allowed" : "pointer",
                  opacity: blocked ? 0.4 : 1,
                }}
              >
                <span>{bd.icon} {bd.name}</span>
                <span className="wl-num" style={{ fontSize: "10px", color: "var(--text-lo)" }}>{num(bd.baseCost)}$ {resCost && `· ${resCost}`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Military */}
      <div className="pt-3" style={{ borderTop: "1px solid var(--hairline)" }}>
        <MilitaryPanel plotKey={selected} />
      </div>

      <Button variant="outline" full size="sm" onClick={() => unstake(selected)}>
        Unstake plot (return {num(plot.stakeLocked * 0.97)} $WAR · 3% fee)
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}
