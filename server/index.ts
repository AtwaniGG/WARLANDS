import { randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import { createWorld, addPlayer, normalizeWorld, setWallet } from "@/sim/coc/world";
import { ensureBots } from "@/sim/coc/bots";

/** Accept only an unguessable, bot-safe client identity token; else issue a fresh one. */
function validIdentity(raw: string | null): string | null {
  return raw && /^[A-Za-z0-9_-]{16,64}$/.test(raw) && !raw.toLowerCase().startsWith("bot") ? raw : null;
}
import { applyCommand } from "@/sim/coc/commands";
import { applyTick } from "@/sim/coc/tick";
import type { CocWorld, CocCommand } from "@/sim/coc/types";
import { initDb, loadLatest, saveSnapshot, logEvent } from "./db";

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

  wss.on("connection", (ws, req) => {
    // Stable identity: the client sends a persistent token (?id=…) so returning players reclaim
    // their base; fall back to a fresh UUID for first-timers / invalid tokens.
    const q = new URLSearchParams((req.url ?? "").split("?")[1] ?? "");
    const playerId = validIdentity(q.get("id")) ?? randomUUID();
    state = addPlayer(state, playerId);
    const wallet = q.get("wallet");
    if (wallet) state = setWallet(state, playerId, wallet);
    sockets.set(ws, playerId);
    ws.send(JSON.stringify({ type: "welcome", playerId, state }));
    flushReports();
    broadcast();
    logEvent("join", playerId, { wallet: !!wallet, players: sockets.size });

    ws.on("message", (raw) => {
      let parsed: { type?: string; cmd?: CocCommand; wallet?: string; message?: string };
      try {
        parsed = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (parsed.type === "clientError" && typeof parsed.message === "string") {
        console.error(`[client_error ${playerId.slice(0, 8)}] ${parsed.message.slice(0, 300)}`);
        logEvent("client_error", playerId, { message: parsed.message.slice(0, 500) });
        return;
      }
      if (parsed.type === "link" && typeof parsed.wallet === "string") {
        state = setWallet(state, playerId, parsed.wallet);
        logEvent("link", playerId);
        broadcast();
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
      // telemetry on notable actions
      const c = parsed.cmd;
      if (c.type === "claimBase") logEvent("claim_base", playerId);
      else if (c.type === "raid" && result.report) logEvent("raid", playerId, { stars: result.report.stars, loot: result.report.loot.gold + result.report.loot.elixir });
      else if (c.type === "claimObjective") logEvent("objective", playerId);
      else if (c.type === "claim") logEvent("war_claim", playerId, { amount: c.amount });
      broadcast();
    });

    ws.on("close", () => { sockets.delete(ws); logEvent("leave", playerId, { players: sockets.size }); });
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
