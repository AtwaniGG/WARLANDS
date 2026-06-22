/**
 * Telegram re-engagement notifications (Feature 5) — fire-and-forget, best-effort.
 *
 * This module pings the Telegram Bot API so an opted-in player gets a "Your base is being
 * raided!" alert while they're away. It is INTENTIONALLY non-blocking and self-disabling:
 *   • No-ops completely when TELEGRAM_BOT_TOKEN is unset (e.g. local dev / preview).
 *   • Never awaits, never throws into the caller — all errors are swallowed + logged.
 *   • Light per-chat rate limiting so a player under sustained raids can't be spammed.
 *
 * ── Production setup (Railway, where this WS server runs) ───────────────────────────────
 *   1. Create a bot with @BotFather → get the bot token.
 *   2. Set env on the WS-server service:  TELEGRAM_BOT_TOKEN=123456:ABC-…
 *      (optional)  TG_LINK_SALT=<random string>  — salts the per-player opt-in token.
 *   3. Set env on the Next app (Vercel, which hosts the /api/tg webhook):
 *        TELEGRAM_BOT_TOKEN=…  (same token — used to send the "alerts on" confirmation)
 *        TG_LINK_SALT=…        (SAME salt — both sides must derive the same token)
 *   4. Point Telegram at the webhook (one-time curl), using the public Vercel URL:
 *        curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://<app>.vercel.app/api/tg"
 *
 * Opt-in flow: in-game we surface a deep link  t.me/<bot>?start=<token>  where <token> is
 * derived deterministically from the player's id (see tgLinkToken). When the player taps it,
 * Telegram POSTs `/start <token>` to /api/tg, which stores token→chatId in Postgres. The WS
 * server later reads that row for the player and sets `tgChatId` (see server/index.ts).
 */

import { createHash } from "node:crypto";
import type { BattleReport } from "@/sim/coc/types";

const TELEGRAM_API = "https://api.telegram.org";

/** True when a bot token is configured — i.e. notifications are armed. */
export const TG_CONFIGURED = !!process.env.TELEGRAM_BOT_TOKEN;

/**
 * Deterministic, URL-safe opt-in token for a player id. Deterministic so the WS server can
 * recompute a connecting player's token and look it up without persisting a token map, and
 * salted (TG_LINK_SALT) so it isn't trivially forgeable from a known player id. Both the
 * webhook (Vercel) and the WS server (Railway) must share the same salt to agree on the token.
 */
export function tgLinkToken(playerId: string): string {
  const salt = process.env.TG_LINK_SALT ?? "";
  return createHash("sha256").update(`${salt}:${playerId}`).digest("hex").slice(0, 24);
}

// ---- per-chat rate limit: never send a given chat more than one message per MIN_INTERVAL_MS.
const MIN_INTERVAL_MS = Number(process.env.TG_MIN_INTERVAL_MS ?? 60_000);
const lastSentAt = new Map<string, number>();

/**
 * Fire-and-forget a Telegram message to a chat. No-ops without a bot token, rate-limits per
 * chat, and swallows every error (network, API, bad chat id) so it can never disrupt the
 * tick loop or the request that called it. Returns immediately — does NOT return a promise.
 */
export function notify(chatId: string, text: string): void {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return; // disabled / nothing to send

  const now = Date.now();
  const last = lastSentAt.get(chatId) ?? 0;
  if (now - last < MIN_INTERVAL_MS) return; // throttled — drop this message
  lastSentAt.set(chatId, now);

  // Best-effort POST; never await, never let a rejection escape.
  void fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  }).catch((e) => console.error(`[tg_notify] ${(e as Error).message}`));
}

/** "Your base is being raided!" message body for a delivered defense report. */
export function raidedMessage(report: BattleReport): string {
  const loot = report.loot.gold + report.loot.elixir;
  const stars = "⭐".repeat(report.stars) || "—";
  return (
    `🛡️ Your Warlands base was raided!\n` +
    `${stars}  ${report.destructionPct}% destroyed · −${loot} looted · ${report.trophies > 0 ? "+" : ""}${report.trophies} trophies\n` +
    `Jump back in to rebuild and shield up.`
  );
}

/** Confirmation sent back when a player completes the /start opt-in. */
export const ALERTS_ON_MESSAGE = "✅ Warlands alerts on — we'll ping you when your base is raided.";
