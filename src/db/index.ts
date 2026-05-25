import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as typeof globalThis & {
  __pgClient?: ReturnType<typeof postgres>;
  __db?: Db;
};

function getDb(): Db {
  if (globalForDb.__db) return globalForDb.__db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client =
    globalForDb.__pgClient ??
    postgres(connectionString, {
      prepare: false,
      max: 3,
      idle_timeout: 20,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__pgClient = client;
  }

  globalForDb.__db = drizzle(client, { schema });
  return globalForDb.__db;
}

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
