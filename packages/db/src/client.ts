import "dotenv/config";
import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

function timeout(name: string, fallback: number): number {
  const configured = process.env[name];
  if (configured === undefined) {
    return fallback;
  }
  const value = Number(configured);
  if (!Number.isSafeInteger(value) || value < 1 || value > 300_000) {
    throw new Error(
      `${name} must be an integer between 1 and 300000 milliseconds`
    );
  }
  return value;
}

// Server-side limits cancel SQL itself. A client-only query timeout can leave
// a write running after its caller receives an error and must not replace these.
export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? "postgresql://localhost/userbubble",
  connectionTimeoutMillis: timeout("DATABASE_CONNECTION_TIMEOUT_MS", 5000),
  statement_timeout: timeout("DATABASE_STATEMENT_TIMEOUT_MS", 15_000),
  lock_timeout: timeout("DATABASE_LOCK_TIMEOUT_MS", 5000),
  idle_in_transaction_session_timeout: timeout(
    "DATABASE_IDLE_TRANSACTION_TIMEOUT_MS",
    30_000
  ),
  keepAlive: true,
  application_name: "userbubble",
});
// Idle connection failures are emitted separately from query rejections.
// Never print driver errors: they may contain connection or query information.
pool.on("error", () => console.error("DATABASE_IDLE_CONNECTION_FAILED"));
export const closeDatabase = () => pool.end();
export const database = drizzle(pool, { schema, casing: "snake_case" });
type Transaction = Parameters<Parameters<typeof database.transaction>[0]>[0];
const transactionContext = new AsyncLocalStorage<Transaction>();
/** Repositories share the current operation transaction, including nested service calls. */
export const db: typeof database = new Proxy(database, {
  get(target, property) {
    const current = transactionContext.getStore() ?? target;
    const value = Reflect.get(current, property);
    return typeof value === "function" ? value.bind(current) : value;
  },
});
export function inTransaction<T>(work: () => Promise<T>): Promise<T> {
  if (transactionContext.getStore()) {
    return work();
  }
  return database.transaction((transaction) =>
    transactionContext.run(transaction, work)
  );
}
