import { createId } from "@paralleldrive/cuid2";
import {
  createComment,
  createFeedbackPost,
  deleteComment,
  deleteFeedbackPost,
  getFeedbackPost,
  getFeedbackPosts,
  getPostComments,
  getUserVote,
  removeVote,
  updateFeedbackPost,
  voteOnPost,
} from "@critichut/db/feedback/feedback.queries";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const feedbackRouter = createTRPCRouter({
  // Get all feedback posts for an organization
  getAll: publicProcedure
    .input(
      z.object({
        organizationId: z.string(),
        status: z.string().optional(),
        category: z.string().optional(),
        sortBy: z.enum(["votes", "recent"]).optional(),
      })
    )
    .query(async ({ input }) => {
      return getFeedbackPosts(input.organizationId, {
        status: input.status,
        category: input.category,
        sortBy: input.sortBy,
      });
    }),

  // Get a single feedback post
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const post = await getFeedbackPost(input.id);

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback post not found",
        });
      }

      return post;
    }),

  // Create a new feedback post
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        title: z.string().min(3).max(256),
        description: z.string().min(10).max(5000),
        category: z.enum([
          "feature_request",
          "bug",
          "improvement",
          "question",
          "other",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const post = await createFeedbackPost({
        id: createId(),
        organizationId: input.organizationId,
        authorId: ctx.session.user.id,
        title: input.title,
        description: input.description,
        category: input.category,
        status: "open",
        voteCount: 0,
        isPublic: true,
      });

      return post;
    }),

  // Update a feedback post (admin only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(3).max(256).optional(),
        description: z.string().min(10).max(5000).optional(),
        status: z
          .enum([
            "open",
            "under_review",
            "planned",
            "in_progress",
            "completed",
            "closed",
          ])
          .optional(),
        category: z
          .enum([
            "feature_request",
            "bug",
            "improvement",
            "question",
            "other",
          ])
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Add permission check (only author or org admin can update)
      const { id, ...updates } = input;
      const post = await updateFeedbackPost(id, updates);

      return post;
    }),

  // Delete a feedback post
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Add permission check (only author or org admin can delete)
      await deleteFeedbackPost(input.id);
      return { success: true };
    }),

  // Vote on a post
  vote: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        value: z.number().min(-1).max(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.value === 0) {
        // Remove vote
        await removeVote(input.postId, ctx.session.user.id);
      } else {
        // Add or update vote
        await voteOnPost({
          id: createId(),
          postId: input.postId,
          userId: ctx.session.user.id,
          value: input.value,
        });
      }

      return { success: true };
    }),

  // Get user's vote on a post
  getUserVote: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      const vote = await getUserVote(input.postId, ctx.session.user.id);
      return vote;
    }),

  // Get comments for a post
  getComments: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input }) => {
      return getPostComments(input.postId);
    }),

  // Create a comment
  createComment: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        content: z.string().min(1).max(2000),
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Check if user is team member for the org
      const comment = await createComment({
        id: createId(),
        postId: input.postId,
        authorId: ctx.session.user.id,
        content: input.content,
        parentId: input.parentId,
        isTeamMember: false, // TODO: Implement team member check
      });

      return comment;
    }),

  // Delete a comment
  deleteComment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Add permission check (only author or org admin can delete)
      await deleteComment(input.id);
      return { success: true };
    }),
});
