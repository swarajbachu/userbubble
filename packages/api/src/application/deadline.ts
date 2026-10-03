import { type Duration, Effect } from "effect";
import { ApplicationError } from "./errors";

/** Apply inside a write transaction, so interruption is rolled back before returning. */
export const operationDeadline = <A, R>(
  work: Effect.Effect<A, ApplicationError, R>,
  duration: Duration.Input = "30 seconds"
) =>
  work.pipe(
    Effect.timeoutOrElse({
      duration,
      orElse: () =>
        Effect.fail(
          new ApplicationError({
            code: "TIMEOUT",
            message:
              "Operation deadline exceeded. Retry with the same idempotency key when supported.",
          })
        ),
    })
  );
