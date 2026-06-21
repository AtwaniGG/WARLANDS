import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { WebSocket } from "ws";
import { startServer } from "./index";

const srv = startServer({ port: 0, seed: 1, tickMs: 0, persistEvery: 0 });
let port: number;

beforeAll(async () => {
  port = await srv.ready;
});
afterAll(() => srv.close());

function connect(id?: string): Promise<{ ws: WebSocket; first: any }> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}${id ? `?id=${id}` : ""}`);
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

    const want = waitFor(b.ws, (m) => m.type === "state" && m.state.bases[a.first.playerId]?.location === "0,0");
    a.ws.send(JSON.stringify({ type: "command", cmd: { type: "claimBase", q: 0, r: 0 } }));
    const got = await want;

    const base = got.state.bases[a.first.playerId];
    expect(base.location).toBe("0,0");
    expect(base.buildings["8,8"]).toEqual({ id: "commandCenter", level: 1 });
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

  it("a returning player (stable ?id) reclaims their existing base", async () => {
    const id = "persistentidentitytoken123";
    const a = await connect(id);
    expect(a.first.playerId).toBe(id); // server honors the stable identity
    a.ws.send(JSON.stringify({ type: "command", cmd: { type: "claimBase", q: 2, r: -1 } }));
    await waitFor(a.ws, (m) => m.type === "state" && m.state.bases[id]?.location === "2,-1");
    a.ws.close();
    await new Promise((r) => setTimeout(r, 30));
    const b = await connect(id); // reconnect with the same identity
    expect(b.first.playerId).toBe(id);
    expect(b.first.state.bases[id]?.location).toBe("2,-1"); // base survived the reconnect
    b.ws.close();
  });

  it("supersedes a stale socket when the same identity reconnects (last-connection-wins)", async () => {
    const id = "supersededidentity000001";
    const a = await connect(id);
    const closedCode = new Promise<number>((resolve) => a.ws.on("close", (code) => resolve(code)));
    const b = await connect(id); // a second live socket for the same identity
    expect(b.first.playerId).toBe(id);
    expect(await closedCode).toBe(4000); // server kicked the stale socket so only one stays live
    b.ws.close();
  });
});
