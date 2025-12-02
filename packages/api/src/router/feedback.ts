import {
  canDeleteComment,
  canDeletePost,
  canModifyPost,
  createComment,
  createFeedbackPost,
  deleteComment,
  deleteFeedbackPost,
  getFeedbackPost,
  getFeedbackPosts,
  getPostComments,
  getUserVote,
  isTeamMember,
  removeVote,
  updateFeedbackPost,
  voteOnPost,
} from "@critichut/db/queries";
import {
  createFeedbackValidator,
  feedbackCategoryValidator,
  feedbackStatusValidator,
  updateFeedbackValidator,
} from "@critichut/db/schema";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure } from "../trpc";

export const feedbackRouter = {
  // Get all feedback posts for an organization
  getAll: publicProcedure
    .input(
      z.object({
        organizationId: z.string(),
        status: z.array(feedbackStatusValidator).optional(),
        category: feedbackCategoryValidator.optional(),
        sortBy: z.enum(["votes", "recent"]).optional(),
      })
    )
    .query(async ({ input }) =>
      getFeedbackPosts(input.organizationId, {
        status: input.status,
        category: input.category,
        sortBy: input.sortBy,
      })
    ),

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
    .input(createFeedbackValidator)
    .mutation(async ({ ctx, input }) => {
      const post = await createFeedbackPost({
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

  // Update a feedback post (author or org admin only)
  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(updateFeedbackValidator))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      // PERMISSION CHECK: Only author or org admin can update
      const canModify = await canModifyPost(ctx.session.user.id, id);
      if (!canModify) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this feedback post",
        });
      }

      return await updateFeedbackPost(id, updates);
    }),

  // Delete a feedback post (author or org admin only)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // PERMISSION CHECK: Only author or org admin can delete
      const canDelete = await canDeletePost(ctx.session.user.id, input.id);
      if (!canDelete) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this feedback post",
        });
      }

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
    .query(async ({ input }) => getPostComments(input.postId)),

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
      // Get post to find organization
      const post = await getFeedbackPost(input.postId);
      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback post not found",
        });
      }

      // TEAM MEMBER CHECK: Determine if user is part of the org
      const isTeam = await isTeamMember(
        ctx.session.user.id,
        post.post.organizationId
      );

      return await createComment({
        postId: input.postId,
        authorId: ctx.session.user.id,
        content: input.content,
        parentId: input.parentId,
        isTeamMember: isTeam,
      });
    }),

  // Delete a comment (author or org admin only)
  deleteComment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // PERMISSION CHECK: Only comment author or org admin can delete
      const canDelete = await canDeleteComment(ctx.session.user.id, input.id);
      if (!canDelete) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this comment",
        });
      }

      await deleteComment(input.id);
      return { success: true };
    }),
} satisfies TRPCRouterRecord;
