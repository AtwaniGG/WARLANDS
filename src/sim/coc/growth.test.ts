import { describe, it, expect } from "vitest";
import { applyCommand, settleReferrals } from "./commands";
import { createWorld, addPlayer, setWallet, ccLevel } from "./world";
import { makeBotBase } from "./bots";
import {
  DEMO_TH_CAP, REFERRAL_REFEREE_BONUS, REFERRAL_REFERRER_REWARD, REFERRAL_MILESTONE_TH,
  refCodeFor, dailyReward, TICKS_PER_DAY, POINTS_PER_OBJECTIVE, STARTING_HEXAR, STARTING_SEASON_POOL,
} from "./config";
import type { CocWorld } from "./types";

const A_WALLET = "So11111111111111111111111111111111111111112"; // a valid base58 pubkey

/** Complete a player's first objective so it can be claimed. */
function completeFirstObjective(s: CocWorld, id: string): { state: CocWorld; objId: string } {
  const p = s.players[id];
  const objId = p.objectives![0].id;
  const objectives = p.objectives!.map((o) => (o.id === objId ? { ...o, progress: o.target } : o));
  return { state: { ...s, players: { ...s.players, [id]: { ...p, objectives } } }, objId };
}
/** Force a player's Town Hall to a given level. */
function setTH(s: CocWorld, id: string, level: number): CocWorld {
  const b = s.bases[id];
  return { ...s, bases: { ...s.bases, [id]: { ...b, buildings: { ...b.buildings, "8,8": { id: "commandCenter", level } } } } };
}

describe("demo mode (restricted live slice)", () => {
  const demoClaimed = (): CocWorld => {
    let s = addPlayer(createWorld(1), "d1", { demo: true });
    s = applyCommand(s, "d1", { type: "claimBase", q: 0, r: 0 }).state;
    return s;
  };

  it("creates the demo base off the contested map (synthetic location)", () => {
    const s = demoClaimed();
    expect(s.bases.d1.location).toBe("demo:d1");
    expect(s.claimedHexes["0,0"]).toBeUndefined(); // the real hex stays unclaimed
  });

  it("blocks creating or joining a clan", () => {
    const create = applyCommand(demoClaimed(), "d1", { type: "createClan", name: "Trial Clan" });
    expect(create.error).toMatch(/full-game feature/i);
    const join = applyCommand(demoClaimed(), "d1", { type: "joinClan", clanId: "clan1" });
    expect(join.error).toMatch(/full-game feature/i);
  });

  it(`caps the Town Hall at level ${DEMO_TH_CAP}`, () => {
    const s = setTH(demoClaimed(), "d1", DEMO_TH_CAP);
    const r = applyCommand(s, "d1", { type: "upgradeBuilding", tileKey: "8,8" });
    expect(r.error).toMatch(/capped at Town Hall/i);
  });

  it("pays demo rewards as fake spend-only $HEXAR — no earned, no pool drain, no points", () => {
    const { state, objId } = completeFirstObjective(demoClaimed(), "d1");
    const before = state.seasonPool;
    const r = applyCommand(state, "d1", { type: "claimObjective", id: objId });
    const p = r.state.players.d1;
    expect(p.hexar).toBeGreaterThan(STARTING_HEXAR); // got the reward as spendable
    expect(p.earned ?? 0).toBe(0); // but it is NOT withdrawable
    expect(p.points ?? 0).toBe(0); // and earns no airdrop points
    expect(r.state.seasonPool).toBe(before); // real treasury untouched
  });

  it("does not let demo spending inflate the real season pool (sinks are no-ops)", () => {
    // buy a 3rd builder's hut: costs $HEXAR but, for demo, must not feed the treasury
    const s = demoClaimed();
    const before = s.seasonPool;
    const r = applyCommand(s, "d1", { type: "placeBuilding", tileKey: "0,0", buildingId: "builderHut" });
    expect(r.error).toBeUndefined();
    expect(r.state.players.d1.hexar).toBeLessThan(STARTING_HEXAR); // demo paid
    expect(r.state.seasonPool).toBe(before); // pool unchanged
  });

  it("lets demo raid bots but not real players", () => {
    let s = demoClaimed();
    // a real player with a real base
    s = addPlayer(s, "p2");
    s = applyCommand(s, "p2", { type: "claimBase", q: 1, r: 0 }).state;
    const vsReal = applyCommand(s, "d1", { type: "raid", targetOwner: "p2", deploy: [{ unit: "grunt", x: 0, y: 0 }] });
    expect(vsReal.error).toMatch(/bots only/i);

    // a bot — demo can attack it (give the demo an army to deploy)
    s = { ...s, players: { ...s.players, bot1: { id: "bot1", hexar: 0, joinedTick: 0, isBot: true } }, bases: { ...s.bases, bot1: makeBotBase("bot1", "2,0", 1, () => 0.5) } };
    s = { ...s, bases: { ...s.bases, d1: { ...s.bases.d1, army: { grunt: 12 } } } };
    const deploy = Array.from({ length: 12 }, (_, i) => ({ unit: "grunt" as const, x: i % 5, y: Math.floor(i / 5) }));
    const vsBot = applyCommand(s, "d1", { type: "raid", targetOwner: "bot1", deploy });
    expect(vsBot.error).toBeUndefined();
  });

  it("hides demo bases from real players (a full account cannot raid one)", () => {
    let s = addPlayer(createWorld(1), "p1");
    s = applyCommand(s, "p1", { type: "claimBase", q: 0, r: 0 }).state;
    s = addPlayer(s, "d2", { demo: true });
    s = applyCommand(s, "d2", { type: "claimBase", q: 0, r: 0 }).state;
    s = { ...s, bases: { ...s.bases, p1: { ...s.bases.p1, army: { grunt: 5 } } } };
    const r = applyCommand(s, "p1", { type: "raid", targetOwner: "d2", deploy: [{ unit: "grunt", x: 0, y: 0 }] });
    expect(r.error).toMatch(/no such base/i);
  });
});

describe("referrals", () => {
  const pair = (): CocWorld => addPlayer(addPlayer(createWorld(1), "p1"), "p2");
  const p1Code = refCodeFor("p1");

  it("grants a spend-only bonus and sets referredBy once", () => {
    const r = applyCommand(pair(), "p2", { type: "attachRef", code: p1Code });
    expect(r.error).toBeUndefined();
    expect(r.state.players.p2.referredBy).toBe(p1Code);
    expect(r.state.players.p2.hexar).toBe(STARTING_HEXAR + REFERRAL_REFEREE_BONUS);
    expect(r.state.players.p2.earned ?? 0).toBe(0); // bonus is not withdrawable
    const again = applyCommand(r.state, "p2", { type: "attachRef", code: p1Code });
    expect(again.error).toMatch(/already/i);
  });

  it("rejects self-referral and unknown codes", () => {
    expect(applyCommand(pair(), "p1", { type: "attachRef", code: p1Code }).error).toMatch(/invalid/i);
    expect(applyCommand(pair(), "p2", { type: "attachRef", code: "ZZZZZZZ" }).error).toMatch(/invalid/i);
  });

  it("pays the referrer from the pool only after the referee converts (full + wallet + TH milestone)", () => {
    let s = pair();
    s = applyCommand(s, "p2", { type: "attachRef", code: p1Code }).state;
    s = applyCommand(s, "p2", { type: "claimBase", q: 0, r: 0 }).state;

    // not converted yet → no payout
    expect(settleReferrals(s).players.p1.earned ?? 0).toBe(0);

    // convert: link a wallet + reach the milestone Town Hall
    s = setWallet(s, "p2", A_WALLET);
    s = setTH(s, "p2", REFERRAL_MILESTONE_TH);
    expect(ccLevel(s.bases.p2)).toBeGreaterThanOrEqual(REFERRAL_MILESTONE_TH);

    const settled = settleReferrals(s);
    expect(settled.players.p1.earned).toBe(REFERRAL_REFERRER_REWARD);
    expect(settled.players.p1.referralsConverted).toBe(1);
    expect(settled.players.p2.refMilestonePaid).toBe(true);
    expect(settled.seasonPool).toBe(STARTING_SEASON_POOL - REFERRAL_REFERRER_REWARD);

    // idempotent — never pays twice
    expect(settleReferrals(settled).players.p1.earned).toBe(REFERRAL_REFERRER_REWARD);
  });

  it("never pays for a demo referee, even at the milestone Town Hall (sybil-safe)", () => {
    let s = addPlayer(createWorld(1), "p1");
    s = addPlayer(s, "d2", { demo: true });
    s = applyCommand(s, "d2", { type: "attachRef", code: p1Code }).state;
    s = applyCommand(s, "d2", { type: "claimBase", q: 0, r: 0 }).state;
    s = setTH(s, "d2", REFERRAL_MILESTONE_TH); // demo at TH cap, but no wallet + still demo
    expect(settleReferrals(s).players.p1.earned ?? 0).toBe(0);
  });
});

describe("season points", () => {
  it("a full account accrues points on objective claim", () => {
    const { state, objId } = completeFirstObjective(addPlayer(createWorld(1), "p1"), "p1");
    const r = applyCommand(state, "p1", { type: "claimObjective", id: objId });
    expect(r.state.players.p1.points).toBe(POINTS_PER_OBJECTIVE);
    expect(r.state.players.p1.earned).toBeGreaterThan(0); // and it is withdrawable
  });
});

describe("daily login streak", () => {
  const p = (): CocWorld => addPlayer(createWorld(1), "p1");

  it("grants a streak-1 reward on the first check-in of a day", () => {
    const r = applyCommand(p(), "p1", { type: "dailyCheckin" });
    expect(r.error).toBeUndefined();
    expect(r.state.players.p1.streak).toBe(1);
    expect(r.state.players.p1.hexar).toBe(STARTING_HEXAR + dailyReward(1));
  });

  it("is a no-op the second time the same day", () => {
    const first = applyCommand(p(), "p1", { type: "dailyCheckin" }).state;
    expect(applyCommand(first, "p1", { type: "dailyCheckin" }).error).toMatch(/already/i);
  });

  it("extends on consecutive days and resets after a gap", () => {
    const day0 = applyCommand(p(), "p1", { type: "dailyCheckin" }).state;
    const day1 = applyCommand({ ...day0, tick: TICKS_PER_DAY }, "p1", { type: "dailyCheckin" }).state;
    expect(day1.players.p1.streak).toBe(2);
    const afterGap = applyCommand({ ...day1, tick: 5 * TICKS_PER_DAY }, "p1", { type: "dailyCheckin" }).state;
    expect(afterGap.players.p1.streak).toBe(1);
  });
});
