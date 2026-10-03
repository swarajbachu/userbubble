import { closeDatabase } from "@userbubble/db/client";
import { Effect, Layer } from "effect";

/** The process-wide application runtime owns shutdown of the shared auth/product pool. */
export const databaseLifetime = Layer.effectDiscard(
  Effect.acquireRelease(Effect.void, () => Effect.promise(closeDatabase))
);
