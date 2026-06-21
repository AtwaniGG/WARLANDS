import { randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import { createWorld, addPlayer, normalizeWorld, setWallet, validateWorld } from "@/sim/coc/world";
import { ensureBots } from "@/sim/coc/bots";

/** Accept only an unguessable, bot-safe client identity token; else issue a fresh one. */
function validIdentity(raw: string | null): string | null {
  return raw && /^[A-Za-z0-9_-]{16,64}$/.test(raw) && !raw.toLowerCase().startsWith("bot") ? raw : null;
}
import { applyCommand } from "@/sim/coc/commands";
import { applyTick } from "@/sim/coc/tick";
import type { CocWorld, CocCommand } from "@/sim/coc/types";
import { initDb, loadLatest, saveSnapshot, logEvent, DB_CONFIGURED } from "./db";

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
  // Persist every few ticks (3s default) — a crash loses at most this window. Tunable via PERSIST_EVERY.
  const persistEvery = opts.persistEvery ?? Number(process.env.PERSIST_EVERY ?? 3);
  let state: CocWorld = opts.initial ?? createWorld(opts.seed ?? Number(process.env.WORLD_SEED ?? 1));
  const sockets = new Map<WebSocket, string>();
  const wss = new WebSocketServer({ port: opts.port ?? Number(process.env.PORT ?? 8080) });

  function broadcast(): void {
    const msg = JSON.stringify({ type: "state", state });
    for (const ws of sockets.keys()) if (ws.readyState === ws.OPEN) ws.send(msg);
  }

  // Deliver queued defense reports (raided-while-away) to connected players, then clear ONLY the
  // ones that were actually delivered. Reports stay queued if the send fails or the player is
  // offline, so a raid is never silently lost. Clearing happens once, after the loop (no mid-loop
  // state churn, no double-send).
  function flushReports(): void {
    const pending = state.pendingReports;
    if (!pending) return;
    const delivered: string[] = [];
    for (const [ws, pid] of sockets) {
      const rs = pending[pid];
      if (!rs || rs.length === 0 || ws.readyState !== ws.OPEN) continue;
      try {
        for (const r of rs) ws.send(JSON.stringify({ type: "report", report: r }));
        delivered.push(pid);
      } catch (e) {
        // leave this player's reports queued for the next flush
        console.error(`[report_flush ${pid.slice(0, 8)}] ${(e as Error).message}`);
      }
    }
    if (delivered.length === 0) return;
    const next = { ...state.pendingReports };
    for (const pid of delivered) delete next[pid];
    state = { ...state, pendingReports: next };
  }

  // ---- per-player command rate limiter (token bucket) — a single socket must not be able to
  // spam the tick loop / amplify broadcasts and DoS the world. Generous for humans, hard cap on abuse.
  const RL_CAPACITY = Number(process.env.RL_CAPACITY ?? 25); // burst allowance
  const RL_REFILL = Number(process.env.RL_REFILL ?? 12); // tokens refilled per second
  const buckets = new Map<string, { tokens: number; last: number }>();
  function allow(playerId: string): boolean {
    const now = Date.now();
    let b = buckets.get(playerId);
    if (!b) { b = { tokens: RL_CAPACITY, last: now }; buckets.set(playerId, b); }
    b.tokens = Math.min(RL_CAPACITY, b.tokens + ((now - b.last) / 1000) * RL_REFILL);
    b.last = now;
    if (b.tokens < 1) return false;
    b.tokens -= 1;
    return true;
  }

  wss.on("connection", (ws, req) => {
    // Stable identity: the client sends a persistent token (?id=…) so returning players reclaim
    // their base; fall back to a fresh UUID for first-timers / invalid tokens.
    const q = new URLSearchParams((req.url ?? "").split("?")[1] ?? "");
    const playerId = validIdentity(q.get("id")) ?? randomUUID();
    state = addPlayer(state, playerId);
    const wallet = q.get("wallet");
    if (wallet) state = setWallet(state, playerId, wallet);
    // Last-connection-wins: drop any stale socket for this identity (reconnect / second tab) so a
    // player never has two live sockets — which would duplicate broadcasts and lose defense reports.
    for (const [s, pid] of sockets) {
      if (pid === playerId && s !== ws) { sockets.delete(s); try { s.close(4000, "superseded"); } catch { /* already closing */ } }
    }
    sockets.set(ws, playerId);
    // A socket-level 'error' is fatal if unhandled (EventEmitter throws) — log and let 'close' clean up.
    ws.on("error", (e) => console.error(`[ws_error ${playerId.slice(0, 8)}] ${(e as Error).message}`));
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
        if (!allow(playerId)) return;
        state = setWallet(state, playerId, parsed.wallet);
        logEvent("link", playerId);
        broadcast();
        return;
      }
      if (parsed.type !== "command" || !parsed.cmd) return;
      if (!allow(playerId)) {
        ws.send(JSON.stringify({ type: "error", message: "Rate limit — slow down." }));
        return;
      }
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

    ws.on("close", () => { sockets.delete(ws); buckets.delete(playerId); logEvent("leave", playerId, { players: sockets.size }); });
  });

  // A server-level error (e.g. EADDRINUSE, internal ws fault) must not throw unhandled.
  wss.on("error", (e) => console.error(`[wss_error] ${(e as Error).message}`));

  let ticks = 0;
  let persisting = false; // guard: setInterval(async) does not await, so skip if a save is still in flight
  let saveFailures = 0; // consecutive snapshot-save failures (visibility into silent data-loss)
  const timer =
    tickMs > 0
      ? setInterval(async () => {
          try {
            state = applyTick(state);
            flushReports();
            broadcast();
          } catch (e) {
            console.error(`[tick_error] ${(e as Error).message}`); // a bad tick must never crash the world
          }
          if (persistEvery > 0 && ++ticks % persistEvery === 0 && !persisting) {
            persisting = true;
            const snapshot = state; // immutable updates make this a stable point-in-time capture
            saveSnapshot(snapshot)
              .then(() => { saveFailures = 0; })
              .catch((e) => {
                saveFailures++;
                console.error(`[snapshot_save] FAILED ${saveFailures}x: ${(e as Error).message}`);
                logEvent("snapshot_fail", null, { consecutive: saveFailures, tick: snapshot.tick });
              })
              .finally(() => { persisting = false; });
          }
        }, tickMs)
      : null;

  // Graceful shutdown: flush a final snapshot so a redeploy / SIGTERM (Railway) loses ~0 progress.
  // Not in tests (no process-signal hijacking under vitest).
  if (process.env.VITEST !== "true" && persistEvery > 0) {
    let shuttingDown = false;
    const shutdown = async (sig: string) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`[shutdown] ${sig} — flushing final snapshot…`);
      if (timer) clearInterval(timer);
      try {
        await saveSnapshot(state);
        console.log(`[shutdown] final snapshot saved @ tick ${state.tick}.`);
      } catch (e) {
        console.error(`[shutdown] final snapshot FAILED: ${(e as Error).message}`);
      }
      wss.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 3000).unref(); // hard stop if close hangs
    };
    process.once("SIGTERM", () => void shutdown("SIGTERM"));
    process.once("SIGINT", () => void shutdown("SIGINT"));
  }

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
  // Last line of defense: a stray rejection/exception logs instead of taking the whole world down.
  process.on("unhandledRejection", (e) => console.error("[unhandledRejection]", e));
  process.on("uncaughtException", (e) => console.error("[uncaughtException]", e));
  // When a DB is configured the operator intends durable persistence: a DB error or a corrupt
  // snapshot must NOT silently boot a fresh world over real player data. Refuse to boot instead.
  const ALLOW_FRESH = process.env.WORLD_ALLOW_FRESH_ON_CORRUPT === "1";
  const fatal = (msg: string): never => {
    console.error(`[CRITICAL] ${msg}`);
    process.exit(1);
  };
  (async () => {
    try {
      await initDb();
    } catch (e) {
      if (DB_CONFIGURED) fatal(`DB init failed (DATABASE_URL set): ${(e as Error).message}`);
      else console.error(`[boot] DB init skipped: ${(e as Error).message}`);
    }

    let restored: CocWorld | null = null;
    try {
      restored = await loadLatest();
    } catch (e) {
      if (DB_CONFIGURED) fatal(`snapshot load failed (refusing to overwrite real data): ${(e as Error).message}`);
    }

    const seed = Number(process.env.WORLD_SEED ?? 1);
    let world: CocWorld;
    if (restored) {
      let normalized: CocWorld | null = null;
      try {
        normalized = normalizeWorld(restored);
      } catch (e) {
        console.error(`[boot] normalizeWorld threw: ${(e as Error).message}`);
      }
      const check = normalized ? validateWorld(normalized) : { ok: false, errors: ["normalizeWorld threw"] };
      if (normalized && check.ok) {
        world = ensureBots(normalized);
        console.log(`Restored world @ tick ${restored.tick}`);
      } else {
        console.error(`[CRITICAL] restored snapshot is invalid: ${check.errors.join("; ")}`);
        if (DB_CONFIGURED && !ALLOW_FRESH) {
          fatal("refusing to overwrite a real database with a fresh world. Inspect the snapshot, then set WORLD_ALLOW_FRESH_ON_CORRUPT=1 to force a reset.");
        }
        world = ensureBots(createWorld(seed));
      }
    } else {
      if (DB_CONFIGURED) console.warn("[boot] DB configured but no snapshot found — starting a fresh world (first boot?).");
      world = ensureBots(createWorld(seed)); // always keep the world populated with AI villages
    }

    const srv = startServer({ initial: world });
    await srv.ready;
    console.log(`WARLANDS server on :${srv.port} (${Object.values(world.players).filter((p) => p.isBot).length} bots)`);
  })();
}
