import { Effect } from "effect";
import { EmptyInput, UpdateProfileInput } from "../contracts/inputs";
import { Profile } from "../contracts/outputs";
import { ApplicationError } from "./errors";
import { protectedProcedure } from "./procedure";
import { ProfileRepository } from "./repositories/profile";

/** Profile fields only. Credential and email changes require separate ceremonies. */
export const accountOperations = {
  getProfile: protectedProcedure
    .effectInput(EmptyInput)
    .output(Profile)
    .query(({ ctx }) =>
      Effect.gen(function* () {
        const repository = yield* ProfileRepository;
        const user = yield* repository.find(ctx.session.user.id);
        if (!user) {
          return yield* Effect.fail(
            new ApplicationError({ code: "NOT_FOUND" })
          );
        }
        return user;
      })
    ),
  updateProfile: protectedProcedure
    .effectInput(UpdateProfileInput)
    .output(Profile)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* ProfileRepository;
        const user = yield* repository.update(ctx.session.user.id, input);
        if (!user) {
          return yield* Effect.fail(
            new ApplicationError({ code: "NOT_FOUND" })
          );
        }
        return user;
      })
    ),
};
