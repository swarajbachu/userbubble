import {
  activityQueries,
  getFeedbackPost,
  referenceQueries,
} from "@userbubble/db/queries";
import { Effect, Layer } from "effect";
import { applicationError } from "../application/errors";
import { ReferenceRepository } from "../application/repositories/references";

export const referenceRepositoryLive = Layer.succeed(ReferenceRepository, {
  postOrganization: (postId) =>
    Effect.tryPromise({
      try: async () => (await getFeedbackPost(postId))?.post.organizationId,
      catch: applicationError,
    }),
  list: (postId) =>
    Effect.tryPromise({
      try: () => referenceQueries.list(postId),
      catch: applicationError,
    }),
  add: (input) =>
    Effect.tryPromise({
      try: () => referenceQueries.add(input),
      catch: applicationError,
    }),
  delete: (id, organizationId) =>
    Effect.tryPromise({
      try: async () => {
        await referenceQueries.delete(id, organizationId);
      },
      catch: applicationError,
    }),
  activity: (organizationId) =>
    Effect.tryPromise({
      try: () => activityQueries.list(organizationId),
      catch: applicationError,
    }),
});
