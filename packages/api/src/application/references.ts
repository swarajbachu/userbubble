import { Effect } from "effect";
import {
  OrganizationInput,
  ReferenceAddInput,
  ReferenceDeleteInput,
  ReferenceListInput,
} from "../contracts/inputs";
import { Activity, Reference, References, Success } from "../contracts/outputs";
import { ApplicationError } from "./errors";
import { orgProcedure } from "./procedure";
import { ReferenceRepository } from "./repositories/references";

function assertPost(postId: string, organizationId: string) {
  return Effect.gen(function* () {
    const repository = yield* ReferenceRepository;
    const postOrganization = yield* repository.postOrganization(postId);
    if (postOrganization !== organizationId) {
      return yield* Effect.fail(new ApplicationError({ code: "NOT_FOUND" }));
    }
    return repository;
  });
}
export const referenceOperations = {
  list: orgProcedure
    .effectInput(ReferenceListInput)
    .output(References)
    .query(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* assertPost(input.postId, ctx.org.id);
        return yield* repository.list(input.postId);
      })
    ),
  add: orgProcedure
    .effectInput(ReferenceAddInput)
    .output(Reference)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* assertPost(input.postId, ctx.org.id);
        const reference = yield* repository.add({
          organizationId: ctx.org.id,
          postId: input.postId,
          url: input.url,
          title: input.title,
          authorId: ctx.session.user.id,
        });
        if (!reference) {
          return yield* Effect.fail(
            new ApplicationError({ code: "INTERNAL_SERVER_ERROR" })
          );
        }
        return reference;
      })
    ),
  delete: orgProcedure
    .effectInput(ReferenceDeleteInput)
    .output(Success)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* ReferenceRepository;
        yield* repository.delete(input.id, ctx.org.id);
        return { success: true };
      })
    ),
};
export const activityOperations = {
  list: orgProcedure
    .effectInput(OrganizationInput)
    .output(Activity)
    .query(({ ctx }) =>
      Effect.gen(function* () {
        const repository = yield* ReferenceRepository;
        return yield* repository.activity(ctx.org.id);
      })
    ),
};
