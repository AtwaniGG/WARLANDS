import { NextResponse } from "next/server";
import { DB_ENABLED } from "@/server/db";

// GET /api/health — liveness + whether the persistence layer is configured.
export async function GET() {
  return NextResponse.json({
    status: "ok",
    db: DB_ENABLED ? "connected" : "mock-mode (set DATABASE_URL to enable)",
    time: new Date().toISOString(),
  });
}
