import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import {
  canManageChangelogSync,
  createChangelogEntryWithFeedback,
  deleteChangelogEntry,
  getChangelogEntries,
  getChangelogEntry,
  getLinkedFeedback,
  linkFeedbackToChangelog,
  memberQueries,
  publishChangelogEntry,
  unlinkFeedbackFromChangelog,
  updateChangelogEntry,
} from "@userbubble/db/queries";
import { z } from "zod";

import { orgAdminProcedure, publicProcedure } from "../trpc";

export const changelogRouter = {
  // Get all changelog entries for an organization
  getAll: publicProcedure
    .input(
      z.object({
        organizationId: z.string(),
        published: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      let published = input.published;

      // If user is not admin, force published filter to true
      if (userId) {
        const member = await memberQueries.findByUserAndOrg(
          userId,
          input.organizationId
        );
        if (!(member && canManageChangelogSync(member.role))) {
          published = true;
        }
      } else {
        published = true;
      }

      const entries = await getChangelogEntries(input.organizationId, {
        published,
        limit: input.limit,
        offset: input.offset,
      });

      // Filter by tags if provided
      let filteredEntries = entries;
      if (input.tags && input.tags.length > 0) {
        filteredEntries = entries.filter((entry) =>
          entry.tags?.some((tag) => input.tags?.includes(tag))
        );
      }

      // Filter by date range if provided
      if (input.dateFrom || input.dateTo) {
        filteredEntries = filteredEntries.filter((entry) => {
          const entryDate = entry.publishedAt ?? entry.createdAt;
          if (input.dateFrom && entryDate < input.dateFrom) {
            return false;
          }
          if (input.dateTo && entryDate > input.dateTo) {
            return false;
          }
          return true;
        });
      }

      // Fetch linked feedback for each entry
      const entriesWithFeedback = await Promise.all(
        filteredEntries.map(async (entry) => {
          const linkedFeedback = await getLinkedFeedback(entry.id);
          return {
            ...entry,
            linkedFeedback,
          };
        })
      );

      return entriesWithFeedback;
    }),

  // Get a single changelog entry with linked feedback
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const entry = await getChangelogEntry(input.id);

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Changelog entry not found",
        });
      }

      return entry;
    }),

  // Create a new changelog entry (admin only)
  create: orgAdminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(256),
        description: z.string().min(1),
        version: z.string().optional(),
        coverImageUrl: z.string().url().optional(),
        tags: z.array(z.string()).optional(),
        isPublished: z.boolean().default(false),
        feedbackPostIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const entry = await createChangelogEntryWithFeedback({
        organizationId: ctx.org.id,
        authorId: ctx.session.user.id,
        title: input.title,
        description: input.description,
        version: input.version,
        coverImageUrl: input.coverImageUrl,
        tags: input.tags,
        isPublished: input.isPublished,
        publishedAt: input.isPublished ? new Date() : undefined,
        feedbackPostIds: input.feedbackPostIds,
      });

      return entry;
    }),

  // Update an existing changelog entry (admin only)
  update: orgAdminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        version: z.string().optional(),
        coverImageUrl: z.string().url().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingEntry = await getChangelogEntry(input.id);

      if (!existingEntry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Changelog entry not found",
        });
      }

      // Cross-org safety check
      if (existingEntry.organizationId !== ctx.org.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return updateChangelogEntry(input.id, {
        title: input.title,
        description: input.description,
        version: input.version,
        coverImageUrl: input.coverImageUrl,
        tags: input.tags,
      });
    }),

  // Publish a changelog entry (admin only)
  publish: orgAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingEntry = await getChangelogEntry(input.id);

      if (!existingEntry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Changelog entry not found",
        });
      }

      if (existingEntry.organizationId !== ctx.org.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return publishChangelogEntry(input.id);
    }),

  // Delete a changelog entry (admin only)
  delete: orgAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingEntry = await getChangelogEntry(input.id);

      if (!existingEntry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Changelog entry not found",
        });
      }

      if (existingEntry.organizationId !== ctx.org.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await deleteChangelogEntry(input.id);
      return { success: true };
    }),

  // Link feedback posts to a changelog entry (admin only)
  linkFeedback: orgAdminProcedure
    .input(
      z.object({
        entryId: z.string(),
        feedbackPostIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingEntry = await getChangelogEntry(input.entryId);

      if (!existingEntry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Changelog entry not found",
        });
      }

      if (existingEntry.organizationId !== ctx.org.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return linkFeedbackToChangelog(input.entryId, input.feedbackPostIds);
    }),

  // Unlink feedback posts from a changelog entry (admin only)
  unlinkFeedback: orgAdminProcedure
    .input(
      z.object({
        entryId: z.string(),
        feedbackPostIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingEntry = await getChangelogEntry(input.entryId);

      if (!existingEntry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Changelog entry not found",
        });
      }

      if (existingEntry.organizationId !== ctx.org.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await unlinkFeedbackFromChangelog(input.entryId, input.feedbackPostIds);
      return { success: true };
    }),
} satisfies TRPCRouterRecord;
