import { sql } from "drizzle-orm";
import { Effect, ManagedRuntime, Result } from "effect";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { operationDeadline } from "../packages/api/src/application/deadline";
import { applicationError } from "../packages/api/src/application/errors";
import { DelegationRepository } from "../packages/api/src/application/repositories/delegation";

const url = process.env.TEST_DATABASE_URL;
const local =
  url &&
  /^postgres(?:ql)?:\/\/[^/]*@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);

describe.skipIf(!local)("database deadlines and scoped cleanup", () => {
  let observer: Client;
  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    observer = new Client({ connectionString: url });
    await observer.connect();
    await observer.query(
      "delete from operation_receipt where organization_id = 'deadline-test'"
    );
    await observer.query(
      "delete from activity where organization_id = 'deadline-test'"
    );
  });
  afterAll(async () => {
    await observer?.end();
    const { closeDatabase, pool } = await import("../packages/db/src/client");
    if (!pool.ended) {
      await closeDatabase();
    }
  });

  it("configures server statement, lock and idle-transaction limits on pooled connections", async () => {
    const { pool } = await import("../packages/db/src/client");
    const result = await pool.query(
      "select current_setting('statement_timeout') as statement, current_setting('lock_timeout') as lock, current_setting('idle_in_transaction_session_timeout') as idle"
    );
    expect(result.rows[0]).toEqual({
      statement: "15s",
      lock: "5s",
      idle: "30s",
    });
    expect(pool.options.connectionTimeoutMillis).toBe(5000);
  });

  it("cancels stalled SQL, rolls back writes and receipts, and releases the connection", async () => {
    const { db, pool } = await import("../packages/db/src/client");
    const { delegationRepositoryLive } = await import(
      "../packages/api/src/infrastructure/delegation"
    );
    const work = Effect.tryPromise({
      try: async () => {
        await db.execute(sql`set local statement_timeout = '100ms'`);
        await db.execute(
          sql`insert into activity (id, organization_id, operation, outcome, request_id) values ('deadline-write', 'deadline-test', 'test', 'success', 'deadline-request')`
        );
        await db.execute(sql`select pg_sleep(10)`);
      },
      catch: applicationError,
    });
    const started = performance.now();
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const repository = yield* DelegationRepository;
        return yield* repository.withReceipt(
          {
            actorId: "deadline-user",
            organizationId: "deadline-test",
            operation: "test",
            key: "timeout",
            input: {},
          },
          work
        );
      }).pipe(Effect.provide(delegationRepositoryLive), Effect.result)
    );
    expect(Result.isFailure(result) && result.failure.code).toBe("TIMEOUT");
    expect(performance.now() - started).toBeLessThan(5000);
    expect(
      (
        await observer.query(
          "select id from activity where id = 'deadline-write'"
        )
      ).rowCount
    ).toBe(0);
    expect(
      (
        await observer.query(
          "select id from operation_receipt where organization_id = 'deadline-test'"
        )
      ).rowCount
    ).toBe(0);
    expect((await pool.query("select 1 as healthy")).rows[0].healthy).toBe(1);
  });

  it("cancels lock waits without changing the locked resource", async () => {
    const { db, inTransaction } = await import("../packages/db/src/client");
    await observer.query("begin");
    try {
      await observer.query("select pg_advisory_xact_lock(941073)");
      const result = await Effect.runPromise(
        Effect.tryPromise({
          try: () =>
            inTransaction(async () => {
              await db.execute(sql`set local lock_timeout = '100ms'`);
              await db.execute(sql`select pg_advisory_xact_lock(941073)`);
            }),
          catch: applicationError,
        }).pipe(Effect.result)
      );
      expect(Result.isFailure(result) && result.failure.code).toBe("TIMEOUT");
    } finally {
      await observer.query("rollback");
    }
  });

  it("rolls back interrupted Effect workflows before returning their deadline failure", async () => {
    const { db } = await import("../packages/db/src/client");
    const { delegationRepositoryLive } = await import(
      "../packages/api/src/infrastructure/delegation"
    );
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const repository = yield* DelegationRepository;
        return yield* repository.transaction(
          operationDeadline(
            Effect.gen(function* () {
              yield* Effect.tryPromise({
                try: () =>
                  db.execute(
                    sql`insert into activity (id, organization_id, operation, outcome, request_id) values ('effect-deadline-write', 'deadline-test', 'test', 'success', 'effect-deadline-request')`
                  ),
                catch: applicationError,
              });
              yield* Effect.sleep("10 seconds");
            }),
            "100 millis"
          )
        );
      }).pipe(Effect.provide(delegationRepositoryLive), Effect.result)
    );
    expect(Result.isFailure(result) && result.failure.code).toBe("TIMEOUT");
    expect(
      (
        await observer.query(
          "select id from activity where id='effect-deadline-write'"
        )
      ).rowCount
    ).toBe(0);
  });

  it("closes the shared pool when the application runtime is disposed", async () => {
    const { databaseLifetime } = await import(
      "../packages/api/src/infrastructure/database-lifetime"
    );
    const { pool } = await import("../packages/db/src/client");
    const runtime = ManagedRuntime.make(databaseLifetime);
    await runtime.runPromise(Effect.void);
    await runtime.dispose();
    expect(pool.ended).toBe(true);
    await expect(pool.query("select 1")).rejects.toThrow();
  });
});

it("classifies nested database failures without exposing driver messages", () => {
  expect(
    applicationError({ cause: { code: "57014", message: "SECRET SQL" } })
  ).toMatchObject({ code: "TIMEOUT" });
  expect(
    applicationError({ cause: { code: "40001", message: "SECRET SQL" } })
  ).toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  expect(
    applicationError({ code: "ECONNRESET", message: "SECRET URI" })
  ).toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  expect(
    applicationError({ code: "23505", message: "SECRET VALUE" })
  ).toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  expect(
    JSON.stringify(
      applicationError({ cause: { code: "57014", message: "SECRET SQL" } })
    )
  ).not.toContain("SECRET");
});
