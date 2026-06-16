import { randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import { createWorld, addPlayer, normalizeWorld } from "@/sim/coc/world";
import { ensureBots } from "@/sim/coc/bots";
import { applyCommand } from "@/sim/coc/commands";
import { applyTick } from "@/sim/coc/tick";
import type { CocWorld, CocCommand } from "@/sim/coc/types";
import { initDb, loadLatest, saveSnapshot } from "./db";

interface Options {
  port?: number;
  seed?: number;
  tickMs?: number;
  persistEvery?: number;
  initial?: CocWorld;
}

export interface ServerHandle {
  port: number;
  ready: Promise<number>;
  close: () => void;
}

export function startServer(opts: Options = {}): ServerHandle {
  const tickMs = opts.tickMs ?? 1000;
  const persistEvery = opts.persistEvery ?? 10;
  let state: CocWorld = opts.initial ?? createWorld(opts.seed ?? Number(process.env.WORLD_SEED ?? 1));
  const sockets = new Map<WebSocket, string>();
  const wss = new WebSocketServer({ port: opts.port ?? Number(process.env.PORT ?? 8080) });

  function broadcast(): void {
    const msg = JSON.stringify({ type: "state", state });
    for (const ws of sockets.keys()) if (ws.readyState === ws.OPEN) ws.send(msg);
  }

  // Deliver queued defense reports (raided-while-away) to connected players, then clear them.
  function flushReports(): void {
    const pending = state.pendingReports;
    if (!pending) return;
    for (const [ws, pid] of sockets) {
      const rs = pending[pid];
      if (!rs || rs.length === 0 || ws.readyState !== ws.OPEN) continue;
      for (const r of rs) ws.send(JSON.stringify({ type: "report", report: r }));
      const next = { ...state.pendingReports };
      delete next[pid];
      state = { ...state, pendingReports: next };
    }
  }

  wss.on("connection", (ws) => {
    const playerId = randomUUID();
    state = addPlayer(state, playerId);
    sockets.set(ws, playerId);
    ws.send(JSON.stringify({ type: "welcome", playerId, state }));
    flushReports();
    broadcast();

    ws.on("message", (raw) => {
      let parsed: { type?: string; cmd?: CocCommand };
      try {
        parsed = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (parsed.type !== "command" || !parsed.cmd) return;
      const result = applyCommand(state, playerId, parsed.cmd);
      if (result.error) {
        ws.send(JSON.stringify({ type: "error", message: result.error }));
        return;
      }
      state = result.state;
      if (result.report) ws.send(JSON.stringify({ type: "report", report: result.report }));
      broadcast();
    });

    ws.on("close", () => sockets.delete(ws));
  });

  let ticks = 0;
  const timer =
    tickMs > 0
      ? setInterval(async () => {
          state = applyTick(state);
          flushReports();
          broadcast();
          if (persistEvery > 0 && ++ticks % persistEvery === 0) await saveSnapshot(state).catch(() => {});
        }, tickMs)
      : null;

  const handle: ServerHandle = {
    port: opts.port ?? 0,
    ready: new Promise<number>((resolve) => {
      wss.on("listening", () => {
        const addr = wss.address();
        handle.port = typeof addr === "object" && addr ? addr.port : opts.port ?? 0;
        resolve(handle.port);
      });
    }),
    close() {
      if (timer) clearInterval(timer);
      wss.close();
    },
  };
  return handle;
}

// Boot when run directly (not under vitest).
if (process.env.VITEST !== "true") {
  (async () => {
    await initDb().catch(() => {});
    const restored = await loadLatest().catch(() => null);
    const seed = Number(process.env.WORLD_SEED ?? 1);
    const world = ensureBots(restored ? normalizeWorld(restored) : createWorld(seed)); // always keep the world populated with AI villages
    const srv = startServer({ initial: world });
    await srv.ready;
    if (restored) console.log(`Restored world @ tick ${restored.tick}`);
    console.log(`WARLANDS server on :${srv.port} (${Object.values(world.players).filter((p) => p.isBot).length} bots)`);
  })();
}
