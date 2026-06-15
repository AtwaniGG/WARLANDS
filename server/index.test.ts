import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { WebSocket } from "ws";
import { startServer } from "./index";

const srv = startServer({ port: 0, seed: 1, tickMs: 0, persistEvery: 0 });
let port: number;

beforeAll(async () => {
  port = await srv.ready;
});
afterAll(() => srv.close());

function connect(): Promise<{ ws: WebSocket; first: any }> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    ws.once("message", (d) => resolve({ ws, first: JSON.parse(d.toString()) }));
  });
}

// Resolve with the first message that satisfies `pred`, ignoring earlier ones.
function waitFor(ws: WebSocket, pred: (m: any) => boolean): Promise<any> {
  return new Promise((resolve) => {
    const onMsg = (d: Buffer) => {
      const m = JSON.parse(d.toString());
      if (pred(m)) {
        ws.off("message", onMsg);
        resolve(m);
      }
    };
    ws.on("message", onMsg);
  });
}

describe("server", () => {
  it("welcomes a client and broadcasts a base claim to both clients", async () => {
    const a = await connect();
    const b = await connect();
    expect(a.first.type).toBe("welcome");
    expect(typeof a.first.playerId).toBe("string");

    const want = waitFor(b.ws, (m) => m.type === "state" && m.state.bases[a.first.playerId]?.ownedHexes.length === 7);
    a.ws.send(JSON.stringify({ type: "command", cmd: { type: "claimBase", q: 0, r: 0 } }));
    const got = await want;

    expect(got.state.bases[a.first.playerId].ownedHexes.length).toBe(7);
    a.ws.close();
    b.ws.close();
  });

  it("rejects an invalid claim with an error to the issuer", async () => {
    const a = await connect();
    const errMsg = waitFor(a.ws, (m) => m.type === "error");
    a.ws.send(JSON.stringify({ type: "command", cmd: { type: "claimBase", q: 999, r: 999 } }));
    const err = await errMsg;
    expect(err.message).toMatch(/hex/i);
    a.ws.close();
  });
});
