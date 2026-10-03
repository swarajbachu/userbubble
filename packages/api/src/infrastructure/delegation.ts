import { inTransaction } from "@userbubble/db/client";
import {
  activityQueries,
  ReceiptConflict,
  userQueries,
  withReceipt,
} from "@userbubble/db/queries";
import { Effect, Layer, Result } from "effect";
import { ApplicationError, applicationError } from "../application/errors";
import {
  DelegationRepository,
  type ReceiptOptions,
} from "../application/repositories/delegation";

/** Preserve the Effect environment and Drizzle AsyncLocalStorage across callbacks. */
const transactionBridge = <A, R>(
  work: Effect.Effect<A, ApplicationError, R>,
  execute: (run: () => Promise<A>) => Promise<A>
) =>
  Effect.gen(function* () {
    const services = yield* Effect.context<R>();
    return yield* Effect.tryPromise({
      try: (signal) =>
        execute(async () => {
          const result = await Effect.runPromiseWith(services)(
            Effect.result(work),
            { signal }
          );
          if (Result.isFailure(result)) {
            throw result.failure;
          }
          return result.success;
        }),
      catch: (cause) =>
        cause instanceof ReceiptConflict
          ? new ApplicationError({ code: "CONFLICT", message: cause.message })
          : applicationError(cause),
    });
  });
const receipt = <A, R>(
  options: ReceiptOptions,
  work: Effect.Effect<A, ApplicationError, R>
) => transactionBridge(work, (run) => withReceipt(options, run));
const transaction = <A, R>(work: Effect.Effect<A, ApplicationError, R>) =>
  transactionBridge(work, inTransaction);

export const delegationRepositoryLive = Layer.succeed(DelegationRepository, {
  user: (id) =>
    Effect.tryPromise({
      try: () => userQueries.findById(id),
      catch: applicationError,
    }),
  uuid: Effect.sync(() => crypto.randomUUID()),
  audit: (record) =>
    Effect.tryPromise({
      try: async () => {
        await activityQueries.record(record);
      },
      catch: applicationError,
    }),
  withReceipt: receipt,
  transaction,
});
