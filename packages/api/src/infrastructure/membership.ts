import { memberQueries } from "@userbubble/db/queries";
import { Effect, Layer } from "effect";
import { ApplicationError, applicationError } from "../application/errors";
import { MembershipRepository } from "../application/repositories/membership";

export const membershipRepositoryLive = Layer.succeed(MembershipRepository, {
  list: (organizationId) =>
    Effect.tryPromise({
      try: () => memberQueries.listByOrganization(organizationId),
      catch: applicationError,
    }),
  change: (input) =>
    Effect.tryPromise({
      try: () => memberQueries.changeMembership(input),
      catch: applicationError,
    }).pipe(
      Effect.flatMap((result) =>
        result.error
          ? Effect.fail(new ApplicationError({ code: result.error }))
          : Effect.succeed(result)
      )
    ),
});
