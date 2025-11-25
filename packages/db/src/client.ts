import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

// Drizzle handles the connection internally
// Use DATABASE_URL for PgBouncer (:6432) or DIRECT_URL for Direct connection (:5432)
// biome-ignore lint/style/noNonNullAssertion: DATABASE_URL is required and validated at runtime
export const db = drizzle(process.env.DATABASE_URL!, {
  schema,
  casing: "snake_case",
});
