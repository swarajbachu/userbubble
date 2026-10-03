import { userQueries } from "@userbubble/db/queries";
import { Effect, Layer } from "effect";
import { applicationError } from "../application/errors";
import { ProfileRepository } from "../application/repositories/profile";

export const profileRepositoryLive = Layer.succeed(ProfileRepository, {
  find: (userId) =>
    Effect.tryPromise({
      try: () => userQueries.findById(userId),
      catch: applicationError,
    }),
  update: (userId, patch) =>
    Effect.tryPromise({
      try: () => userQueries.updateProfile(userId, patch),
      catch: applicationError,
    }),
});
