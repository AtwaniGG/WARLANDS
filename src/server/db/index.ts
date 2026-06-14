// Drizzle DB client — Neon serverless (Vercel-recommended). Lazily initialized so the app
// builds and runs in mock mode without a DATABASE_URL. Set DATABASE_URL to enable persistence.

import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

/** Returns the DB client, or null when DATABASE_URL is unset (mock mode). */
export function getDb(): NeonHttpDatabase<typeof schema> | null {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  _db = drizzle(neon(url), { schema });
  return _db;
}

/** True when a database is configured. */
export const DB_ENABLED = !!process.env.DATABASE_URL;

export { schema };
