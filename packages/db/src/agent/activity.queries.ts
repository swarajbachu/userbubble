import { createHash } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, inTransaction } from "../client";
import { activity, feedbackReference, operationReceipt } from "./activity.sql";

export const activityQueries = {
  list: (organizationId: string) =>
    db
      .select()
      .from(activity)
      .where(eq(activity.organizationId, organizationId))
      .orderBy(desc(activity.createdAt))
      .limit(100),
  record: (data: typeof activity.$inferInsert) =>
    db.insert(activity).values(data),
};
export const referenceQueries = {
  list: (postId: string) =>
    db
      .select()
      .from(feedbackReference)
      .where(eq(feedbackReference.postId, postId)),
  add: async (input: typeof feedbackReference.$inferInsert) => {
    const [reference] = await db
      .insert(feedbackReference)
      .values(input)
      .onConflictDoUpdate({
        target: [feedbackReference.postId, feedbackReference.url],
        set: { title: input.title },
      })
      .returning();
    return reference;
  },
  delete: (id: string, organizationId: string) =>
    db
      .delete(feedbackReference)
      .where(
        and(
          eq(feedbackReference.id, id),
          eq(feedbackReference.organizationId, organizationId)
        )
      ),
};

export class ReceiptConflict extends Error {
  readonly code = "CONFLICT";
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}
export async function withReceipt<T>(
  options: {
    actorId: string;
    organizationId: string;
    operation: string;
    key: string;
    input: unknown;
  },
  work: () => Promise<T>
): Promise<T> {
  const id = createHash("sha256")
    .update(
      [
        options.actorId,
        options.organizationId,
        options.operation,
        options.key,
      ].join("\0")
    )
    .digest("hex");
  const inputHash = createHash("sha256")
    .update(canonical(options.input))
    .digest("hex");
  return inTransaction(async () => {
    // A transaction-level lock serializes retries across all app instances.
    await db.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${id}, 0))`
    );
    const [receipt] = await db
      .select()
      .from(operationReceipt)
      .where(eq(operationReceipt.id, id));
    if (receipt) {
      if (receipt.inputHash !== inputHash) {
        throw new ReceiptConflict(
          "Idempotency key was already used with different input"
        );
      }
      return receipt.result as T;
    }
    const result = await work();
    await db.insert(operationReceipt).values({
      id,
      actorId: options.actorId,
      organizationId: options.organizationId,
      operation: options.operation,
      inputHash,
      result: JSON.parse(JSON.stringify(result ?? null)),
    });
    return result;
  });
}
