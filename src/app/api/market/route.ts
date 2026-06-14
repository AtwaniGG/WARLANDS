import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { marketOrders } from "@/server/db/schema";

// GET /api/market?item=steel — open order book for an item (player-driven market, GDD §7).
export async function GET(req: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DATABASE_URL not set — running in mock mode." }, { status: 503 });

  const item = new URL(req.url).searchParams.get("item");
  const where = item
    ? and(eq(marketOrders.status, "open"), eq(marketOrders.item, item))
    : eq(marketOrders.status, "open");

  const orders = await db.select().from(marketOrders).where(where).limit(200);
  const bids = orders.filter((o) => o.side === "buy");
  const asks = orders.filter((o) => o.side === "sell");
  return NextResponse.json({ item: item ?? "all", bids, asks });
}
