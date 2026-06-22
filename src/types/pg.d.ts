// Minimal ambient declaration for the `pg` driver — only the surface used by
// src/app/api/leaderboard/route.ts (read-only snapshot SELECT). The full @types/pg lives in the
// standalone WS server's own node_modules; the Next app doesn't depend on it, so we declare just
// what we touch here rather than pulling in the whole dev dependency.
declare module "pg" {
  export interface PoolConfig {
    connectionString?: string;
    ssl?: boolean | { rejectUnauthorized: boolean };
    max?: number;
  }
  export interface QueryResult<R = Record<string, unknown>> {
    rows: R[];
    rowCount: number | null;
  }
  export class Pool {
    constructor(config?: PoolConfig);
    query<R = Record<string, unknown>>(text: string, values?: unknown[]): Promise<QueryResult<R>>;
    end(): Promise<void>;
  }
  const pg: { Pool: typeof Pool };
  export default pg;
}
