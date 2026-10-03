import {
  createComment,
  createFeedbackPost,
  deleteComment,
  deleteFeedbackPost,
  getComment,
  getFeedbackPost,
  getFeedbackPosts,
  getPostComments,
  getUserVote,
  removeVote,
  searchFeedback,
  updateFeedbackPost,
  voteOnPost,
} from "@userbubble/db/queries";
import { Effect, Layer } from "effect";
import { applicationError } from "../application/errors";
import { FeedbackRepository } from "../application/repositories/feedback";
export const feedbackRepositoryLive = Layer.succeed(FeedbackRepository, {
  createComment: (input) =>
    Effect.tryPromise({
      try: () => createComment(input),
      catch: applicationError,
    }),
  create: (input) =>
    Effect.tryPromise({
      try: () => createFeedbackPost(input),
      catch: applicationError,
    }),
  deleteComment: (id) =>
    Effect.tryPromise({
      try: async () => {
        await deleteComment(id);
      },
      catch: applicationError,
    }),
  delete: (id) =>
    Effect.tryPromise({
      try: async () => {
        await deleteFeedbackPost(id);
      },
      catch: applicationError,
    }),
  findComment: (id) =>
    Effect.tryPromise({ try: () => getComment(id), catch: applicationError }),
  hasVote: (postId, userId) =>
    Effect.tryPromise({
      try: async () => Boolean(await getUserVote(postId, userId)),
      catch: applicationError,
    }),
  find: (id) =>
    Effect.tryPromise({
      try: () => getFeedbackPost(id),
      catch: applicationError,
    }),
  list: (organizationId, options) =>
    Effect.tryPromise({
      try: () =>
        getFeedbackPosts(organizationId, {
          ...options,
          status: options.status && [...options.status],
        }),
      catch: applicationError,
    }),
  comments: (postId, organizationId) =>
    Effect.tryPromise({
      try: () => getPostComments(postId, organizationId),
      catch: applicationError,
    }),
  removeVote: (postId, userId, sessionId) =>
    Effect.tryPromise({
      try: async () => {
        await removeVote(postId, userId, sessionId);
      },
      catch: applicationError,
    }),
  search: (organizationId, options) =>
    Effect.tryPromise({
      try: () =>
        searchFeedback(organizationId, {
          ...options,
          status: options.status && [...options.status],
          updatedSince: options.updatedSince
            ? new Date(options.updatedSince)
            : undefined,
        }),
      catch: applicationError,
    }),
  update: (id, patch, revision) =>
    Effect.tryPromise({
      try: () => updateFeedbackPost(id, patch, revision),
      catch: applicationError,
    }),
  vote: (input) =>
    Effect.tryPromise({
      try: async () => {
        await voteOnPost(input);
      },
      catch: applicationError,
    }),
});
