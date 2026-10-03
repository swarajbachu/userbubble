import { memberQueries } from "@userbubble/db/queries";
import { Effect, Layer } from "effect";
import { Authorization } from "../application/authorization";
import { applicationError } from "../application/errors";
export const authorizationLive = Layer.succeed(Authorization, {
  membership: (userId, organizationId) =>
    Effect.tryPromise({
      try: () => memberQueries.findByUserAndOrg(userId, organizationId),
      catch: applicationError,
    }),
});
