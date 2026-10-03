import { publicIndexQueries } from "@userbubble/db/queries";
import { Effect, Layer } from "effect";
import { applicationError } from "../application/errors";
import { PublicIndexRepository } from "../application/repositories/public-index";

export const publicIndexRepositoryLive = Layer.succeed(PublicIndexRepository, {
  organizations: () =>
    Effect.tryPromise({
      try: async () => await publicIndexQueries.organizations(),
      catch: applicationError,
    }),
  counts: (organizationId) =>
    Effect.tryPromise({
      try: () => publicIndexQueries.counts(organizationId),
      catch: applicationError,
    }),
  items: (organizationId, kind, page) =>
    Effect.tryPromise({
      try: async () =>
        await publicIndexQueries.items(organizationId, kind, page),
      catch: applicationError,
    }),
});
