import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { players } from "@/server/db/schema";

function noDb() {
  return NextResponse.json({ error: "DATABASE_URL not set — running in mock mode." }, { status: 503 });
}
function dbError() {
  return NextResponse.json({ error: "database unavailable" }, { status: 503 });
}

// GET /api/players — list recent players.
export async function GET() {
  const db = getDb();
  if (!db) return noDb();
  try {
    const rows = await db.select().from(players).orderBy(desc(players.createdAt)).limit(50);
    return NextResponse.json({ players: rows });
  } catch {
    return dbError(); // configured but unreachable — distinct from "mock mode", never an opaque 500
  }
}

// POST /api/players — register a player by wallet (idempotent).
export async function POST(req: Request) {
  const db = getDb();
  if (!db) return noDb();
  const body = (await req.json().catch(() => ({}))) as { walletAddress?: string; username?: string };
  // Trim + bound to the column widths (wallet char(42), username varchar(32)) so a short/over-long
  // value can't space-pad or overflow the unique key.
  const walletAddress = typeof body.walletAddress === "string" ? body.walletAddress.trim() : "";
  const username = typeof body.username === "string" ? body.username.trim() : "";
  if (!walletAddress || !username) {
    return NextResponse.json({ error: "walletAddress and username required" }, { status: 400 });
  }
  if (walletAddress.length > 42 || username.length > 32) {
    return NextResponse.json({ error: "walletAddress (≤42) or username (≤32) too long" }, { status: 400 });
  }
  try {
    const [row] = await db
      .insert(players)
      .values({ walletAddress, username })
      .onConflictDoNothing()
      .returning();
    return NextResponse.json({ player: row ?? null }, { status: row ? 201 : 200 });
  } catch {
    return dbError();
  }
}
