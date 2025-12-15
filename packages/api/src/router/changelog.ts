import {
  canManageChangelog,
  createChangelogEntryWithFeedback,
  deleteChangelogEntry,
  getChangelogEntries,
  getChangelogEntry,
  getLinkedFeedback,
  linkFeedbackToChangelog,
  publishChangelogEntry,
  unlinkFeedbackFromChangelog,
  updateChangelogEntry,
} from "@critichut/db/queries";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure } from "../trpc";

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
        const isAdmin = await canManageChangelog(userId, input.organizationId);
        if (!isAdmin) {
          published = true;
        }
      } else {
        // Non-authenticated users only see published entries
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
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
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
      // Permission check
      const canManage = await canManageChangelog(
        ctx.session.user.id,
        input.organizationId
      );

      if (!canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin/owner roles can manage changelog entries",
        });
      }

      // Create entry with linked feedback in a transaction
      const entry = await createChangelogEntryWithFeedback({
        organizationId: input.organizationId,
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
  update: protectedProcedure
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
      // Get entry to check organization
      const existingEntry = await getChangelogEntry(input.id);

      if (!existingEntry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Changelog entry not found",
        });
      }

      // Permission check
      const canManage = await canManageChangelog(
        ctx.session.user.id,
        existingEntry.organizationId
      );

      if (!canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin/owner roles can manage changelog entries",
        });
      }

      // Update entry
      const entry = await updateChangelogEntry(input.id, {
        title: input.title,
        description: input.description,
        version: input.version,
        coverImageUrl: input.coverImageUrl,
        tags: input.tags,
      });

      return entry;
    }),

  // Publish a changelog entry (admin only)
  publish: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get entry to check organization
      const existingEntry = await getChangelogEntry(input.id);

      if (!existingEntry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Changelog entry not found",
        });
      }

      // Permission check
      const canManage = await canManageChangelog(
        ctx.session.user.id,
        existingEntry.organizationId
      );

      if (!canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin/owner roles can publish changelog entries",
        });
      }

      // Publish entry
      const entry = await publishChangelogEntry(input.id);

      return entry;
    }),

  // Delete a changelog entry (admin only)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get entry to check organization
      const existingEntry = await getChangelogEntry(input.id);

      if (!existingEntry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Changelog entry not found",
        });
      }

      // Permission check
      const canManage = await canManageChangelog(
        ctx.session.user.id,
        existingEntry.organizationId
      );

      if (!canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin/owner roles can delete changelog entries",
        });
      }

      // Delete entry
      await deleteChangelogEntry(input.id);

      return { success: true };
    }),

  // Link feedback posts to a changelog entry (admin only)
  linkFeedback: protectedProcedure
    .input(
      z.object({
        entryId: z.string(),
        feedbackPostIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get entry to check organization
      const existingEntry = await getChangelogEntry(input.entryId);

      if (!existingEntry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Changelog entry not found",
        });
      }

      // Permission check
      const canManage = await canManageChangelog(
        ctx.session.user.id,
        existingEntry.organizationId
      );

      if (!canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin/owner roles can manage changelog entries",
        });
      }

      // Link feedback posts
      const links = await linkFeedbackToChangelog(
        input.entryId,
        input.feedbackPostIds
      );

      return links;
    }),

  // Unlink feedback posts from a changelog entry (admin only)
  unlinkFeedback: protectedProcedure
    .input(
      z.object({
        entryId: z.string(),
        feedbackPostIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get entry to check organization
      const existingEntry = await getChangelogEntry(input.entryId);

      if (!existingEntry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Changelog entry not found",
        });
      }

      // Permission check
      const canManage = await canManageChangelog(
        ctx.session.user.id,
        existingEntry.organizationId
      );

      if (!canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin/owner roles can manage changelog entries",
        });
      }

      // Unlink feedback posts
      await unlinkFeedbackFromChangelog(input.entryId, input.feedbackPostIds);

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
