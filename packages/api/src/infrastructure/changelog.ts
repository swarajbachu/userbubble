import {
  ChangelogRevisionConflict,
  createChangelogEntryWithFeedback,
  deleteChangelogEntry,
  getChangelogEntries,
  getChangelogEntry,
  getFeedbackPost,
  getLinkedFeedback,
  linkFeedbackToChangelog,
  publishChangelogEntry,
  saveChangelogEntry,
  unlinkFeedbackFromChangelog,
} from "@userbubble/db/queries";
import { Effect, Layer } from "effect";
import { ApplicationError, applicationError } from "../application/errors";
import { ChangelogRepository } from "../application/repositories/changelog";

const changelogError = (cause: unknown) =>
  cause instanceof ChangelogRevisionConflict
    ? new ApplicationError({ code: "CONFLICT", message: cause.message })
    : applicationError(cause);

export const changelogRepositoryLive = Layer.succeed(ChangelogRepository, {
  list: (organizationId, options) =>
    Effect.tryPromise({
      try: () =>
        getChangelogEntries(organizationId, {
          ...options,
          tags: options.tags && [...options.tags],
        }),
      catch: changelogError,
    }),
  find: (id) =>
    Effect.tryPromise({
      try: () => getChangelogEntry(id),
      catch: changelogError,
    }),
  linkedFeedback: (id) =>
    Effect.tryPromise({
      try: () => getLinkedFeedback(id),
      catch: changelogError,
    }),
  postOrganization: (id) =>
    Effect.tryPromise({
      try: async () => (await getFeedbackPost(id))?.post.organizationId,
      catch: changelogError,
    }),
  create: (input) =>
    Effect.tryPromise({
      try: () =>
        createChangelogEntryWithFeedback({
          ...input,
          tags: input.tags && [...input.tags],
          feedbackPostIds: input.feedbackPostIds && [...input.feedbackPostIds],
        }),
      catch: changelogError,
    }),
  save: (id, organizationId, patch) =>
    Effect.tryPromise({
      try: () =>
        saveChangelogEntry(id, organizationId, {
          ...patch,
          tags: patch.tags && [...patch.tags],
          feedbackPostIds: patch.feedbackPostIds && [...patch.feedbackPostIds],
        }),
      catch: changelogError,
    }),
  publish: (id, revision) =>
    Effect.tryPromise({
      try: () => publishChangelogEntry(id, revision),
      catch: changelogError,
    }),
  delete: (id, revision) =>
    Effect.tryPromise({
      try: () => deleteChangelogEntry(id, revision),
      catch: changelogError,
    }),
  link: (id, postIds, revision) =>
    Effect.tryPromise({
      try: () => linkFeedbackToChangelog(id, [...postIds], revision),
      catch: changelogError,
    }),
  unlink: (id, postIds, revision) =>
    Effect.tryPromise({
      try: () => unlinkFeedbackFromChangelog(id, [...postIds], revision),
      catch: changelogError,
    }),
});
