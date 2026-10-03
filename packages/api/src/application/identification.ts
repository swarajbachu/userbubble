import { Effect, Schema } from "effect";
import { ApplicationError } from "./errors";
import { IdentificationRepository } from "./repositories/identification";

export const IdentificationInput = Schema.Struct({
  id: Schema.String.check(Schema.isMinLength(1)),
  email: Schema.String.check(Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  name: Schema.optionalKey(Schema.String),
  avatar: Schema.optionalKey(Schema.String),
});

/** SDK identities never produce a management session or an authority grant. */
export const identifyCustomer = Effect.fn("identifyCustomer")(function* (
  key: string,
  input: unknown
) {
  const data = yield* Schema.decodeUnknownEffect(IdentificationInput)(
    input
  ).pipe(
    Effect.mapError(
      () =>
        new ApplicationError({
          code: "BAD_REQUEST",
          message: "Invalid request body",
        })
    )
  );
  const repository = yield* IdentificationRepository;
  const credential = yield* repository.validateKey(key);
  if (!credential) {
    return yield* new ApplicationError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired API key",
    });
  }
  const customer = yield* repository.upsert({
    organizationId: credential.organizationId,
    externalId: data.id,
    email: data.email,
    name: data.name ?? data.email.split("@")[0] ?? "User",
    avatar: data.avatar ?? null,
  });
  if (!customer) {
    return yield* new ApplicationError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create identified user record",
    });
  }
  // Best-effort telemetry is awaited and scoped, never a detached rejected Promise.
  yield* repository
    .touchKey(credential.keyId)
    .pipe(Effect.catch(() => Effect.void));
  return {
    success: true,
    user: {
      id: customer.externalId,
      email: customer.email,
      name: customer.name,
      avatar: customer.avatar,
    },
    organizationSlug: credential.organizationSlug,
  };
});
