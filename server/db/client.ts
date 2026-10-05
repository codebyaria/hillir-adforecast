import { attachDatabasePool } from "@vercel/functions";
import { sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema.js";

let pool: Pool | undefined;
let database: NodePgDatabase<typeof schema> | undefined;

function normalizeSslMode(connectionString: string) {
  const parsedConnectionString = new URL(connectionString);
  const sslMode = parsedConnectionString.searchParams.get("sslmode");

  if (["prefer", "require", "verify-ca"].includes(sslMode ?? "")) {
    parsedConnectionString.searchParams.set("sslmode", "verify-full");
  }

  return parsedConnectionString.toString();
}

export function getDatabase() {
  if (database) {
    return database;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL belum dikonfigurasi.");
  }

  pool = new Pool({
    connectionString: normalizeSslMode(connectionString),
    max: 5,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
  });

  attachDatabasePool(pool);
  database = drizzle({ client: pool, schema });

  return database;
}

export async function checkDatabaseConnection() {
  await getDatabase().execute(sql`select 1 as ok`);
}
