import { describe, it, expect } from "vitest";
import { applyCommand } from "./commands";
import { createWorld, addPlayer } from "./world";
import { PLOT_TYPES } from "@/game/plotTypes";
import type { WorldState } from "./types";

// find a plains hex for predictable stake cost
function plainsKey(w: WorldState): string {
  return Object.keys(w.hexes).find((k) => w.hexes[k].terrain === "plains")!;
}

describe("stake", () => {
  it("claims a plot and locks stake from the player's balance", () => {
    const w = addPlayer(createWorld(1), "p1");
    const key = plainsKey(w);
    const [q, r] = key.split(",").map(Number);
    const { state, error } = applyCommand(w, "p1", { type: "stake", q, r });
    expect(error).toBeUndefined();
    expect(state.plots[key].owner).toBe("p1");
    expect(state.players.p1.war).toBe(200_000 - PLOT_TYPES.plains.stake);
    expect(state.plots[key].claimIndex).toBe(1);
  });
  it("rejects an already-owned hex", () => {
    const w = addPlayer(addPlayer(createWorld(1), "p1"), "p2");
    const key = plainsKey(w);
    const [q, r] = key.split(",").map(Number);
    const once = applyCommand(w, "p1", { type: "stake", q, r }).state;
    const { error } = applyCommand(once, "p2", { type: "stake", q, r });
    expect(error).toMatch(/already/i);
  });
  it("rejects when the player cannot afford the stake", () => {
    let w = addPlayer(createWorld(1), "poor");
    w = { ...w, players: { ...w.players, poor: { ...w.players.poor, war: 0 } } };
    const key = plainsKey(w);
    const [q, r] = key.split(",").map(Number);
    const { error } = applyCommand(w, "poor", { type: "stake", q, r });
    expect(error).toMatch(/\$WAR/);
  });
});

describe("build", () => {
  it("builds a farm on an owned plains plot, spending $WAR + resources", () => {
    const w0 = addPlayer(createWorld(1), "p1");
    const key = plainsKey(w0);
    const [q, r] = key.split(",").map(Number);
    const w1 = applyCommand(w0, "p1", { type: "stake", q, r }).state;
    const warBefore = w1.players.p1.war;
    const { state, error } = applyCommand(w1, "p1", { type: "build", key, buildingId: "farm" });
    expect(error).toBeUndefined();
    expect(state.plots[key].buildings.some((b) => b.id === "farm")).toBe(true);
    expect(state.players.p1.war).toBe(warBefore - 200); // farm baseCost
  });
  it("rejects building on a plot you don't own", () => {
    const w0 = addPlayer(addPlayer(createWorld(1), "p1"), "p2");
    const key = plainsKey(w0);
    const [q, r] = key.split(",").map(Number);
    const w1 = applyCommand(w0, "p1", { type: "stake", q, r }).state;
    const { error } = applyCommand(w1, "p2", { type: "build", key, buildingId: "farm" });
    expect(error).toMatch(/not your plot/i);
  });

  it("sets a factory's activeProduct to its first product on build", () => {
    let w = addPlayer(createWorld(1), "p1");
    const key = plainsKey(w);
    const [q, r] = key.split(",").map(Number);
    w = applyCommand(w, "p1", { type: "stake", q, r }).state;
    // give iron for the refinery recipe (base cost stone 60, iron 30)
    w = { ...w, plots: { ...w.plots, [key]: { ...w.plots[key], resources: { stone: 100, iron: 100 } } } };
    const { state, error } = applyCommand(w, "p1", { type: "build", key, buildingId: "refinery" });
    expect(error).toBeUndefined();
    const fac = state.plots[key].buildings.find((b) => b.id === "refinery")!;
    expect(fac.activeProduct).toBe("fuel"); // refinery.makes[0]
  });
});

// helper: a staked plains plot owned by p1
function ownedPlains(): { state: ReturnType<typeof createWorld>; key: string } {
  let w = addPlayer(createWorld(1), "p1");
  const key = plainsKey(w);
  const [q, r] = key.split(",").map(Number);
  w = applyCommand(w, "p1", { type: "stake", q, r }).state;
  return { state: w, key };
}

describe("upgrade", () => {
  it("raises a building level and charges the upgrade cost", () => {
    let { state, key } = ownedPlains();
    // build a farm at index 1 first
    state = { ...state, plots: { ...state.plots, [key]: { ...state.plots[key], resources: { wood: 100 } } } };
    state = applyCommand(state, "p1", { type: "build", key, buildingId: "farm" }).state;
    const warBefore = state.players.p1.war;
    const { state: after, error } = applyCommand(state, "p1", { type: "upgrade", key, index: 1 });
    expect(error).toBeUndefined();
    expect(after.plots[key].buildings[1].level).toBe(2);
    expect(after.players.p1.war).toBeLessThan(warBefore);
  });
  it("rejects upgrading on a plot you don't own", () => {
    let { state, key } = ownedPlains();
    state = addPlayer(state, "p2");
    const { error } = applyCommand(state, "p2", { type: "upgrade", key, index: 0 });
    expect(error).toMatch(/not your plot/i);
  });
});

describe("setProduct", () => {
  it("changes a factory's active product", () => {
    let { state, key } = ownedPlains();
    state = { ...state, plots: { ...state.plots, [key]: { ...state.plots[key], resources: { stone: 100, iron: 100 } } } };
    state = applyCommand(state, "p1", { type: "build", key, buildingId: "refinery" }).state;
    const idx = state.plots[key].buildings.findIndex((b) => b.id === "refinery");
    const { state: after, error } = applyCommand(state, "p1", { type: "setProduct", key, index: idx, product: "chemicals" });
    expect(error).toBeUndefined();
    expect(after.plots[key].buildings[idx].activeProduct).toBe("chemicals");
  });
});

describe("unstake", () => {
  it("returns stake minus 3% fee, removes the plot, accumulates burn", () => {
    const { state, key } = ownedPlains();
    const stake = state.plots[key].stakeLocked;
    const warBefore = state.players.p1.war;
    const { state: after, error } = applyCommand(state, "p1", { type: "unstake", key });
    expect(error).toBeUndefined();
    expect(after.plots[key]).toBeUndefined();
    const fee = Math.round(stake * 0.03);
    expect(after.players.p1.war).toBe(warBefore + stake - fee);
    expect(after.burned).toBe(fee);
  });
  it("rejects unstaking a plot you don't own", () => {
    let { state, key } = ownedPlains();
    state = addPlayer(state, "p2");
    const { error } = applyCommand(state, "p2", { type: "unstake", key });
    expect(error).toMatch(/not your plot/i);
  });
});

describe("train", () => {
  it("queues a unit, charges $WAR + resources, and burns the training fee", () => {
    let { state, key } = ownedPlains();
    // infantry needs rifles 1 + food 5; give rifles
    state = { ...state, plots: { ...state.plots, [key]: { ...state.plots[key], resources: { rifles: 5, food: 50 } } } };
    const warBefore = state.players.p1.war;
    const burnBefore = state.burned;
    const { state: after, error } = applyCommand(state, "p1", { type: "train", key, unit: "infantry" });
    expect(error).toBeUndefined();
    expect(after.plots[key].trainQueue.length).toBe(1);
    expect(after.players.p1.war).toBe(warBefore - 20); // infantry costWar
    expect(after.burned).toBe(burnBefore + 10); // half of 20 burned
  });
});

describe("raid (PvP)", () => {
  // two players, each owning a distinct plains plot
  function twoPlayers() {
    let w = addPlayer(addPlayer(createWorld(1), "p1"), "p2");
    const keys = Object.keys(w.hexes).filter((k) => w.hexes[k].terrain === "plains").slice(0, 2);
    const [k1, k2] = keys;
    const [q1, r1] = k1.split(",").map(Number);
    const [q2, r2] = k2.split(",").map(Number);
    w = applyCommand(w, "p1", { type: "stake", q: q1, r: r1 }).state;
    w = applyCommand(w, "p2", { type: "stake", q: q2, r: r2 }).state;
    return { w, attackerKey: k1, targetKey: k2 };
  }

  it("a strong army overruns an undefended enemy plot, loots, and damages defense", () => {
    let { w, attackerKey, targetKey } = twoPlayers();
    // give attacker tanks and the target lootable food
    w = {
      ...w,
      plots: {
        ...w.plots,
        [attackerKey]: { ...w.plots[attackerKey], army: { tanks: 20 } },
        [targetKey]: { ...w.plots[targetKey], army: {}, resources: { food: 600 }, defensePct: 1 },
      },
    };
    const { state, report, error } = applyCommand(w, "p1", {
      type: "raid", fromKey: attackerKey, targetKey, army: { tanks: 10 }, intent: "raid",
    });
    expect(error).toBeUndefined();
    expect(report).toBeDefined();
    expect(report!.result.attackerWins).toBe(true);
    // defender lost some food to loot
    expect(state.plots[targetKey].resources.food!).toBeLessThan(600);
    // defender defense dropped
    expect(state.plots[targetKey].defensePct).toBeLessThan(1);
    // attacker survivors returned home (no losses vs empty defender)
    expect(state.plots[attackerKey].army.tanks).toBe(20);
  });

  it("rejects raiding your own plot", () => {
    const { w, attackerKey } = twoPlayers();
    const { error } = applyCommand(w, "p1", { type: "raid", fromKey: attackerKey, targetKey: attackerKey, army: { tanks: 1 }, intent: "raid" });
    expect(error).toMatch(/own plot/i);
  });

  it("rejects sending units you don't have", () => {
    const { w, attackerKey, targetKey } = twoPlayers();
    const { error } = applyCommand(w, "p1", { type: "raid", fromKey: attackerKey, targetKey, army: { tanks: 5 }, intent: "raid" });
    expect(error).toMatch(/don't have/i);
  });
});

describe("market (shared order book)", () => {
  function twoWithPlots() {
    let w = addPlayer(addPlayer(createWorld(1), "p1"), "p2");
    const keys = Object.keys(w.hexes).filter((k) => w.hexes[k].terrain === "plains").slice(0, 2);
    const [k1, k2] = keys;
    const [q1, r1] = k1.split(",").map(Number);
    const [q2, r2] = k2.split(",").map(Number);
    w = applyCommand(w, "p1", { type: "stake", q: q1, r: r1 }).state;
    w = applyCommand(w, "p2", { type: "stake", q: q2, r: r2 }).state;
    // give the seller food to list
    w = { ...w, plots: { ...w.plots, [k1]: { ...w.plots[k1], resources: { food: 200 } } } };
    return { w, k1, k2 };
  }

  it("lists, escrows the goods, and burns the listing fee", () => {
    const { w, k1 } = twoWithPlots();
    const warBefore = w.players.p1.war;
    const { state, error } = applyCommand(w, "p1", { type: "list", key: k1, item: "food", qty: 50, price: 2 });
    expect(error).toBeUndefined();
    expect(state.market.book.length).toBe(1);
    expect(state.plots[k1].resources.food).toBe(150); // 50 escrowed into the order
    expect(state.players.p1.war).toBe(warBefore - 5); // listing fee
    expect(state.burned).toBe(5);
  });

  it("buy transfers $WAR from buyer to seller, burns the fee, and delivers goods", () => {
    let { w, k1, k2 } = twoWithPlots();
    w = applyCommand(w, "p1", { type: "list", key: k1, item: "food", qty: 50, price: 2 }).state;
    const sellerBefore = w.players.p1.war;
    const buyerBefore = w.players.p2.war;
    const { state, error } = applyCommand(w, "p2", { type: "buy", item: "food", qty: 50, toKey: k2 });
    expect(error).toBeUndefined();
    // cost 50*2=100, fee ceil(100*0.04)=4, total 104
    expect(state.players.p2.war).toBe(buyerBefore - 104);
    expect(state.players.p1.war).toBe(sellerBefore + 100);
    expect(state.plots[k2].resources.food).toBe(150); // 100 starter + 50 bought
    expect(state.market.book.length).toBe(0); // fully filled
  });

  it("cancel returns the escrowed goods to a plot", () => {
    const { w, k1 } = twoWithPlots();
    const listed = applyCommand(w, "p1", { type: "list", key: k1, item: "food", qty: 50, price: 2 });
    const orderId = listed.state.market.book[0].id;
    const { state, error } = applyCommand(listed.state, "p1", { type: "cancel", orderId, toKey: k1 });
    expect(error).toBeUndefined();
    expect(state.market.book.length).toBe(0);
    expect(state.plots[k1].resources.food).toBe(200); // 150 + 50 returned
  });

  it("won't fill against your own listings", () => {
    let { w, k1 } = twoWithPlots();
    w = applyCommand(w, "p1", { type: "list", key: k1, item: "food", qty: 50, price: 2 }).state;
    const { error } = applyCommand(w, "p1", { type: "buy", item: "food", qty: 50, toKey: k1 });
    expect(error).toMatch(/no sell liquidity/i);
  });
});

describe("allegiances", () => {
  it("found creates an allegiance, seeds the treasury, and burns half the cost", () => {
    const w = addPlayer(createWorld(1), "p1");
    const { state, error } = applyCommand(w, "p1", { type: "found", name: "Iron Pact" });
    expect(error).toBeUndefined();
    const id = state.players.p1.allegianceId!;
    expect(id).toBeTruthy();
    const a = state.allegiances[id];
    expect(a.name).toBe("Iron Pact");
    expect(a.founder).toBe("p1");
    expect(a.members).toEqual(["p1"]);
    expect(a.treasuryWar).toBe(2500);
    expect(a.buildings).toContain("hq");
    expect(state.players.p1.war).toBe(200_000 - 5000);
    expect(state.burned).toBe(2500);
  });

  it("rejects founding while already in an allegiance", () => {
    let w = addPlayer(createWorld(1), "p1");
    w = applyCommand(w, "p1", { type: "found", name: "A" }).state;
    const { error } = applyCommand(w, "p1", { type: "found", name: "B" });
    expect(error).toMatch(/leave your current/i);
  });

  it("a second player joins", () => {
    let w = addPlayer(addPlayer(createWorld(1), "p1"), "p2");
    w = applyCommand(w, "p1", { type: "found", name: "Pact" }).state;
    const id = w.players.p1.allegianceId!;
    const { state, error } = applyCommand(w, "p2", { type: "joinAllegiance", id });
    expect(error).toBeUndefined();
    expect(state.players.p2.allegianceId).toBe(id);
    expect(state.allegiances[id].members).toContain("p2");
  });

  it("contribute moves $WAR to the treasury and raises contribution", () => {
    let w = addPlayer(createWorld(1), "p1");
    w = applyCommand(w, "p1", { type: "found", name: "Pact" }).state;
    const id = w.players.p1.allegianceId!;
    const { state } = applyCommand(w, "p1", { type: "contribute", amount: 1000 });
    expect(state.allegiances[id].treasuryWar).toBe(2500 + 1000);
    expect(state.allegiances[id].contributions.p1).toBe(2500 + 1000);
    expect(state.players.p1.war).toBe(200_000 - 5000 - 1000);
  });

  it("founder builds from the treasury", () => {
    let w = addPlayer(createWorld(1), "p1");
    w = applyCommand(w, "p1", { type: "found", name: "Pact" }).state;
    const id = w.players.p1.allegianceId!;
    w = applyCommand(w, "p1", { type: "contribute", amount: 12000 }).state; // research costs 12000
    const { state, error } = applyCommand(w, "p1", { type: "allegianceBuild", buildingId: "research" });
    expect(error).toBeUndefined();
    expect(state.allegiances[id].buildings).toContain("research");
    expect(state.allegiances[id].treasuryWar).toBe(2500 + 12000 - 12000);
  });

  it("leaving reassigns the founder; last one out disbands", () => {
    let w = addPlayer(addPlayer(createWorld(1), "p1"), "p2");
    w = applyCommand(w, "p1", { type: "found", name: "Pact" }).state;
    const id = w.players.p1.allegianceId!;
    w = applyCommand(w, "p2", { type: "joinAllegiance", id }).state;
    let s = applyCommand(w, "p1", { type: "leaveAllegiance" }).state;
    expect(s.players.p1.allegianceId).toBeNull();
    expect(s.allegiances[id].founder).toBe("p2");
    s = applyCommand(s, "p2", { type: "leaveAllegiance" }).state;
    expect(s.allegiances[id]).toBeUndefined(); // disbanded
  });
});
