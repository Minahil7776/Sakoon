import { Pool } from "pg";

const g = globalThis;
export const pool =
  g._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
if (process.env.NODE_ENV !== "production") g._pgPool = pool;
