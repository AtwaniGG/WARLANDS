// Telegram webhook receiver (Feature 5 — re-engagement notifications).
//
// Telegram POSTs every bot update here. We only care about the `/start <token>` deep-link a
// player taps from in-game (t.me/<bot>?start=<token>): we record token→chatId in Postgres so
// the WS server (server/index.ts) can bind that chat to the matching player and start sending
// "your base was raided" alerts. Everything else is ignored.
//
// Storage: a plain `tg_links(token, chat_id)` table, created on demand. The Next app talks to
// it via Drizzle's raw `sql` executor; the WS server reads it with raw `pg` — both share the
// same DATABASE_URL, so a dedicated table (vs. the Drizzle-managed schema or the WS server's
// `events` table) is the simplest thing both sides can own without a migration handshake.
//
// Robustness: responds 200 fast and ALWAYS (Telegram retries non-200s), and no-ops cleanly
// when DATABASE_URL or TELEGRAM_BOT_TOKEN is unset. See server/notify.ts for env/bot setup.

import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { notify, ALERTS_ON_MESSAGE } from "../../../../server/notify";

// Route Handlers aren't cached for POST, but be explicit: this must run per-request (Next 16).
export const dynamic = "force-dynamic";

/** Shape of the slice of a Telegram update we read (message text + chat id). */
interface TgUpdate {
  message?: { text?: string; chat?: { id?: number | string } };
}

/** Ensure the token→chatId table exists (idempotent), then upsert this link. */
async function storeLink(token: string, chatId: string): Promise<void> {
  const db = getDb();
  if (!db) return; // no DATABASE_URL → mock mode, nothing to persist
  await db.execute(sql`CREATE TABLE IF NOT EXISTS tg_links (
    token TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  // Last tap wins: a player who re-runs /start (e.g. from a new device) re-points to the new chat.
  await db.execute(sql`INSERT INTO tg_links (token, chat_id) VALUES (${token}, ${chatId})
    ON CONFLICT (token) DO UPDATE SET chat_id = EXCLUDED.chat_id, created_at = now()`);
}

// POST /api/tg — Telegram bot webhook.
export async function POST(req: Request) {
  // Always answer 200 (even on bad input) so Telegram doesn't retry-storm us.
  let update: TgUpdate;
  try {
    update = (await req.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const text = update.message?.text;
  const chatId = update.message?.chat?.id;
  // We only act on the deep-link opt-in: "/start <token>".
  const match = typeof text === "string" ? text.match(/^\/start\s+([A-Za-z0-9_-]{8,64})\b/) : null;
  if (!match || chatId === undefined || chatId === null) {
    return NextResponse.json({ ok: true });
  }

  const token = match[1];
  const chat = String(chatId);
  try {
    await storeLink(token, chat);
    notify(chat, ALERTS_ON_MESSAGE); // fire-and-forget confirmation (no-ops without a bot token)
  } catch (e) {
    // Never surface an error to Telegram — log and still 200.
    console.error(`[tg_webhook] ${(e as Error).message}`);
  }
  return NextResponse.json({ ok: true });
}
