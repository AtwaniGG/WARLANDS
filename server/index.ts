import { randomUUID, randomInt } from "node:crypto";
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
import { buildAuthMessage, isValidPubkey, verifyAuthSignature } from "@/sim/coc/auth";
import { initDb, loadLatest, saveSnapshot, logEvent, DB_CONFIGURED } from "./db";

interface Options {
  port?: number;
  seed?: number;
  tickMs?: number;
  persistEvery?: number;
  initial?: CocWorld;
  /** Require wallet-signature identity (kills anonymous/sybil play). Defaults to env AUTH_REQUIRED. */
  authRequired?: boolean;
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
  // Require wallet-signature identity (kills anonymous/sybil play). On for mainnet.
  const AUTH_REQUIRED = opts.authRequired ?? (process.env.AUTH_REQUIRED === "1" || process.env.AUTH_REQUIRED === "true");
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
    const q = new URLSearchParams((req.url ?? "").split("?")[1] ?? "");
    const nonce = randomUUID(); // single-use challenge for wallet-signature auth
    let playerId: string | null = null; // assigned once identity is established
    let authed = false;

    // A socket-level 'error' is fatal if unhandled (EventEmitter throws) — log and let 'close' clean up.
    ws.on("error", (e) => console.error(`[ws_error ${(playerId ?? "anon").slice(0, 8)}] ${(e as Error).message}`));

    // Bring a player into the world once identity is established (wallet pubkey, or legacy UUID).
    function finishAuth(pid: string, walletPubkey?: string): void {
      playerId = pid;
      authed = true;
      state = addPlayer(state, pid);
      if (walletPubkey) state = setWallet(state, pid, walletPubkey);
      // Last-connection-wins: drop any stale socket for this identity (reconnect / second tab) so a
      // player never has two live sockets — which would duplicate broadcasts and lose defense reports.
      for (const [s, other] of sockets) {
        if (other === pid && s !== ws) { sockets.delete(s); try { s.close(4000, "superseded"); } catch { /* already closing */ } }
      }
      sockets.set(ws, pid);
      ws.send(JSON.stringify({ type: "welcome", playerId: pid, state }));
      flushReports();
      broadcast();
      logEvent("join", pid, { auth: walletPubkey ? "wallet" : "legacy", players: sockets.size });
    }

    const legacyId = validIdentity(q.get("id"));
    if (AUTH_REQUIRED) {
      // Production: only a wallet signature grants identity. Challenge the client to prove control.
      ws.send(JSON.stringify({ type: "challenge", nonce }));
    } else {
      // Dev/anonymous: a returning player keeps their ?id= UUID; a first-timer gets a fresh one.
      // A pubkey-shaped id is NEVER honored without a signature (it could impersonate a wallet
      // identity) — fall back to a random id instead.
      finishAuth(legacyId && !isValidPubkey(legacyId) ? legacyId : randomUUID());
    }

    ws.on("message", (raw) => {
      let parsed: { type?: string; cmd?: CocCommand; wallet?: string; message?: string; pubkey?: string; signature?: string };
      try {
        parsed = JSON.parse(raw.toString());
      } catch {
        return;
      }

      // ---- pre-auth: only the wallet-signature handshake is accepted ----
      if (!authed) {
        if (parsed.type === "auth" && typeof parsed.pubkey === "string" && typeof parsed.signature === "string") {
          if (isValidPubkey(parsed.pubkey) && verifyAuthSignature(parsed.pubkey, parsed.signature, buildAuthMessage(nonce))) {
            finishAuth(parsed.pubkey, parsed.pubkey); // the proven pubkey IS the identity AND the payout wallet
          } else {
            ws.send(JSON.stringify({ type: "error", message: "Wallet authentication failed." }));
            try { ws.close(4001, "auth-failed"); } catch { /* already closing */ }
          }
        }
        return; // ignore everything else until authenticated
      }

      const pid = playerId as string;
      if (parsed.type === "clientError" && typeof parsed.message === "string") {
        console.error(`[client_error ${pid.slice(0, 8)}] ${parsed.message.slice(0, 300)}`);
        logEvent("client_error", pid, { message: parsed.message.slice(0, 500) });
        return;
      }
      // Manual payout-wallet link: only for legacy (non-wallet) identities. A wallet-authed player's
      // payout address is locked to the key they proved control of — it can't be reassigned.
      if (parsed.type === "link" && typeof parsed.wallet === "string") {
        if (isValidPubkey(pid)) return; // wallet-authed → link is a no-op (locked to identity)
        if (!allow(pid)) return;
        state = setWallet(state, pid, parsed.wallet);
        logEvent("link", pid);
        broadcast();
        return;
      }
      if (parsed.type !== "command" || !parsed.cmd) return;
      if (!allow(pid)) {
        ws.send(JSON.stringify({ type: "error", message: "Rate limit — slow down." }));
        return;
      }
      // Real player raids get fresh CSPRNG entropy so the outcome can't be precomputed before
      // deploying. Other commands (and bot raids) stay deterministic (entropy 0).
      const entropy = parsed.cmd.type === "raid" ? randomInt(0xffffffff) : 0;
      const result = applyCommand(state, pid, parsed.cmd, entropy);
      if (result.error) {
        ws.send(JSON.stringify({ type: "error", message: result.error }));
        return;
      }
      state = result.state;
      if (result.report) ws.send(JSON.stringify({ type: "report", report: result.report }));
      // telemetry on notable actions
      const c = parsed.cmd;
      if (c.type === "claimBase") logEvent("claim_base", pid);
      else if (c.type === "raid" && result.report) logEvent("raid", pid, { stars: result.report.stars, loot: result.report.loot.gold + result.report.loot.elixir });
      else if (c.type === "claimObjective") logEvent("objective", pid);
      else if (c.type === "claim") logEvent("war_claim", pid, { amount: c.amount });
      broadcast();
    });

    ws.on("close", () => {
      sockets.delete(ws);
      if (playerId) { buckets.delete(playerId); logEvent("leave", playerId, { players: sockets.size }); }
    });
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
