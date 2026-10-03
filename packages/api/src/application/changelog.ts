import { Clock, Effect } from "effect";
import {
  ChangelogCreateInput,
  ChangelogDetailInput,
  ChangelogFeedbackInput,
  ChangelogIdInput,
  ChangelogListInput,
  ChangelogUpdateInput,
} from "../contracts/inputs";
import {
  ChangelogDetail,
  ChangelogEntries,
  ChangelogEntry,
  ChangelogLinks,
  Success,
} from "../contracts/outputs";
import { Authorization } from "./authorization";
import { applicationError, ApplicationError as TRPCError } from "./errors";
import {
  assertOrgAccess,
  orgAdminProcedure,
  publicProcedure,
} from "./procedure";
import { releaseHtml } from "./release-html";
import { ChangelogRepository } from "./repositories/changelog";

export const changelogOperations = {
  // Get all changelog entries for an organization
  getAll: publicProcedure
    .effectInput(ChangelogListInput)
    .output(ChangelogEntries)
    .query(({ input, ctx }) =>
      Effect.gen(function* () {
        const repository = yield* ChangelogRepository;
        yield* Effect.try({
          try: () => assertOrgAccess(ctx, input.organizationId),
          catch: applicationError,
        });
        const userId = ctx.session?.user?.id;
        let published = input.published;

        // If user is not admin, force published filter to true
        let canManage = false;
        if (userId && !ctx.isIdentified) {
          const member = yield* (yield* Authorization).membership(
            userId,
            input.organizationId
          );
          canManage = Boolean(
            member && ["owner", "admin"].includes(member.role)
          );
          if (!canManage) {
            published = true;
          }
        } else {
          published = true;
        }

        const entries = yield* repository.list(input.organizationId, {
          published,
          limit: input.limit,
          offset: input.offset,
          tags: input.tags && [...input.tags],
          dateFrom: input.dateFrom,
          dateTo: input.dateTo,
        });

        // Fetch linked feedback for each entry
        const entriesWithFeedback = yield* Effect.forEach(
          entries,
          (entry) =>
            Effect.gen(function* () {
              const linkedFeedback = yield* repository.linkedFeedback(entry.id);
              return {
                ...entry,
                description: releaseHtml(entry.description),
                author: entry.author && {
                  id: entry.author.id,
                  name: entry.author.name,
                  image: entry.author.image,
                },
                linkedFeedback: linkedFeedback.filter(
                  (post) =>
                    post.organizationId === entry.organizationId &&
                    (canManage || post.isPublic)
                ),
              };
            }),
          { concurrency: 8 }
        );

        return entriesWithFeedback;
      })
    ),

  // Get a single changelog entry with linked feedback
  getById: publicProcedure
    .effectInput(ChangelogDetailInput)
    .output(ChangelogDetail)
    .query(({ input, ctx }) =>
      Effect.gen(function* () {
        const repository = yield* ChangelogRepository;
        const entry = yield* repository.find(input.id);

        if (
          !entry ||
          (input.organizationId &&
            entry.organizationId !== input.organizationId)
        ) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "Changelog entry not found",
            })
          );
        }

        yield* Effect.try({
          try: () => assertOrgAccess(ctx, entry.organizationId),
          catch: applicationError,
        });
        const membership =
          ctx.session && !ctx.isIdentified
            ? yield* (yield* Authorization).membership(
                ctx.session.user.id,
                entry.organizationId
              )
            : null;
        const canManage = Boolean(
          membership && ["owner", "admin"].includes(membership.role)
        );
        if (!(entry.isPublished || canManage)) {
          return yield* Effect.fail(new TRPCError({ code: "NOT_FOUND" }));
        }
        return {
          ...entry,
          description: releaseHtml(entry.description),
          author: entry.author && {
            id: entry.author.id,
            name: entry.author.name,
            image: entry.author.image,
          },
          linkedFeedback: entry.linkedFeedback.filter(
            (post) =>
              post.organizationId === entry.organizationId &&
              (canManage || post.isPublic)
          ),
        };
      })
    ),

  // Create a new changelog entry (admin only)
  create: orgAdminProcedure
    .effectInput(ChangelogCreateInput)
    .output(ChangelogEntry)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* ChangelogRepository;
        yield* assertFeedbackOwnership(input.feedbackPostIds ?? [], ctx.org.id);
        const entry = yield* repository.create({
          organizationId: ctx.org.id,
          authorId: ctx.session.user.id,
          title: input.title,
          description: input.description,
          version: input.version,
          coverImageUrl: input.coverImageUrl,
          tags: input.tags && [...input.tags],
          isPublished: input.isPublished,
          publishedAt: input.isPublished
            ? new Date(yield* Clock.currentTimeMillis)
            : undefined,
          feedbackPostIds: input.feedbackPostIds && [...input.feedbackPostIds],
        });

        return entry;
      })
    ),

  // Update an existing changelog entry (admin only)
  update: orgAdminProcedure
    .effectInput(ChangelogUpdateInput)
    .output(ChangelogEntry)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* ChangelogRepository;
        const existingEntry = yield* repository.find(input.id);

        if (!existingEntry) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "Changelog entry not found",
            })
          );
        }

        // Cross-org safety check
        if (existingEntry.organizationId !== ctx.org.id) {
          return yield* Effect.fail(new TRPCError({ code: "FORBIDDEN" }));
        }

        yield* assertFeedbackOwnership(input.feedbackPostIds ?? [], ctx.org.id);
        const saved = yield* repository.save(input.id, ctx.org.id, {
          title: input.title,
          description: input.description,
          version: input.version,
          coverImageUrl: input.coverImageUrl,
          tags: input.tags && [...input.tags],
          feedbackPostIds: input.feedbackPostIds && [...input.feedbackPostIds],
          publish: input.publish,
          expectedRevision: input.expectedRevision,
        });
        if (!saved) {
          return yield* Effect.fail(
            new TRPCError({
              code:
                input.expectedRevision === undefined ? "NOT_FOUND" : "CONFLICT",
              message:
                "Release changed. Retrieve the latest revision and retry.",
            })
          );
        }
        return saved;
      })
    ),

  // Publish a changelog entry (admin only)
  publish: orgAdminProcedure
    .effectInput(ChangelogIdInput)
    .output(ChangelogEntry)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* ChangelogRepository;
        const existingEntry = yield* repository.find(input.id);

        if (!existingEntry) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "Changelog entry not found",
            })
          );
        }

        if (existingEntry.organizationId !== ctx.org.id) {
          return yield* Effect.fail(new TRPCError({ code: "FORBIDDEN" }));
        }

        const published = yield* repository.publish(
          input.id,
          input.expectedRevision
        );
        if (!published) {
          return yield* Effect.fail(
            new TRPCError({
              code:
                input.expectedRevision === undefined ? "NOT_FOUND" : "CONFLICT",
              message:
                "Release changed. Retrieve the latest revision and retry.",
            })
          );
        }
        return published;
      })
    ),

  // Delete a changelog entry (admin only)
  delete: orgAdminProcedure
    .effectInput(ChangelogIdInput)
    .output(Success)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* ChangelogRepository;
        const existingEntry = yield* repository.find(input.id);

        if (!existingEntry) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "Changelog entry not found",
            })
          );
        }

        if (existingEntry.organizationId !== ctx.org.id) {
          return yield* Effect.fail(new TRPCError({ code: "FORBIDDEN" }));
        }

        const deleted = yield* repository.delete(
          input.id,
          input.expectedRevision
        );
        if (!deleted) {
          return yield* new TRPCError({
            code:
              input.expectedRevision === undefined ? "NOT_FOUND" : "CONFLICT",
            message: "Release changed. Retrieve the latest revision and retry.",
          });
        }
        return { success: true };
      })
    ),

  // Link feedback posts to a changelog entry (admin only)
  linkFeedback: orgAdminProcedure
    .effectInput(ChangelogFeedbackInput)
    .output(ChangelogLinks)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* ChangelogRepository;
        const existingEntry = yield* repository.find(input.entryId);

        if (!existingEntry) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "Changelog entry not found",
            })
          );
        }

        if (existingEntry.organizationId !== ctx.org.id) {
          return yield* Effect.fail(new TRPCError({ code: "FORBIDDEN" }));
        }

        yield* assertFeedbackOwnership(input.feedbackPostIds, ctx.org.id);
        return yield* repository.link(
          input.entryId,
          [...input.feedbackPostIds],
          input.expectedRevision
        );
      })
    ),

  // Unlink feedback posts from a changelog entry (admin only)
  unlinkFeedback: orgAdminProcedure
    .effectInput(ChangelogFeedbackInput)
    .output(Success)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* ChangelogRepository;
        const existingEntry = yield* repository.find(input.entryId);

        if (!existingEntry) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "Changelog entry not found",
            })
          );
        }

        if (existingEntry.organizationId !== ctx.org.id) {
          return yield* Effect.fail(new TRPCError({ code: "FORBIDDEN" }));
        }

        yield* repository.unlink(
          input.entryId,
          [...input.feedbackPostIds],
          input.expectedRevision
        );
        return { success: true };
      })
    ),
};

function assertFeedbackOwnership(
  ids: readonly string[],
  organizationId: string
) {
  return Effect.gen(function* () {
    const repository = yield* ChangelogRepository;
    for (const id of ids) {
      const actual = yield* repository.postOrganization(id);
      if (actual !== organizationId) {
        return yield* Effect.fail(new TRPCError({ code: "NOT_FOUND" }));
      }
    }
  });
}
