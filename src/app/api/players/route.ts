import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { players } from "@/server/db/schema";

function noDb() {
  return NextResponse.json({ error: "DATABASE_URL not set — running in mock mode." }, { status: 503 });
}

// GET /api/players — list recent players.
export async function GET() {
  const db = getDb();
  if (!db) return noDb();
  const rows = await db.select().from(players).orderBy(desc(players.createdAt)).limit(50);
  return NextResponse.json({ players: rows });
}

// POST /api/players — register a player by wallet (idempotent).
export async function POST(req: Request) {
  const db = getDb();
  if (!db) return noDb();
  const body = (await req.json().catch(() => ({}))) as { walletAddress?: string; username?: string };
  if (!body.walletAddress || !body.username) {
    return NextResponse.json({ error: "walletAddress and username required" }, { status: 400 });
  }
  const [row] = await db
    .insert(players)
    .values({ walletAddress: body.walletAddress, username: body.username })
    .onConflictDoNothing()
    .returning();
  return NextResponse.json({ player: row ?? null }, { status: row ? 201 : 200 });
}
