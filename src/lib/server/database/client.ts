import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/lib/server/database/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const globalForDatabase = globalThis as typeof globalThis & {
  processDiffSqlClient?: ReturnType<typeof postgres>;
};

export const sqlClient =
  globalForDatabase.processDiffSqlClient ??
  postgres(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.processDiffSqlClient = sqlClient;
}

export const database = drizzle(sqlClient, { schema });
