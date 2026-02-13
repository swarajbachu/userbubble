import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import {
  canCommentOnPost,
  canCreatePost,
  canDeleteComment,
  canDeletePost,
  canModifyPost,
  canViewPost,
  canVoteOnPost,
  createComment,
  createFeedbackPost,
  deleteComment,
  deleteFeedbackPost,
  getFeedbackPost,
  getFeedbackPosts,
  getPostComments,
  memberQueries,
  removeVote,
  updateFeedbackPost,
  voteOnPost,
} from "@userbubble/db/queries";
import {
  createFeedbackValidator,
  feedbackCategoryValidator,
  feedbackStatusValidator,
  updateFeedbackValidator,
} from "@userbubble/db/schema";
import { z } from "zod";

import { orgProcedure, protectedProcedure, publicProcedure } from "../trpc";

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
    .query(async ({ input, ctx }) =>
      getFeedbackPosts(input.organizationId, {
        status: input.status,
        category: input.category,
        sortBy: input.sortBy,
        userId: ctx.session?.user?.id,
      })
    ),

  // Get a single feedback post
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const post = await getFeedbackPost(input.id);

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback post not found",
        });
      }

      const canView = await canViewPost(input.id, ctx.session?.user?.id);
      if (!canView) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback post not found",
        });
      }

      return post;
    }),

  // Create a new feedback post (supports both authenticated and anonymous)
  create: publicProcedure
    .input(createFeedbackValidator)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;

      const canCreate = await canCreatePost(input.organizationId, userId);
      if (!canCreate) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: userId
            ? "You don't have permission to create feedback in this organization"
            : "Anonymous submissions are not allowed for this organization. Please sign in.",
        });
      }

      return createFeedbackPost({
        organizationId: input.organizationId,
        authorId: userId ?? null,
        title: input.title,
        description: input.description,
        category: input.category,
        status: "open",
        voteCount: 0,
        isPublic: true,
      });
    }),

  // Update a feedback post (author or org admin only)
  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(updateFeedbackValidator))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const canModify = await canModifyPost(ctx.session.user.id, id);
      if (!canModify) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this feedback post",
        });
      }

      return updateFeedbackPost(id, updates);
    }),

  // Delete a feedback post (author or org admin only)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
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
  vote: publicProcedure
    .input(
      z.object({
        postId: z.string(),
        value: z.number().min(-1).max(1),
        sessionId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id ?? null;
      const sessionId = userId ? null : (input.sessionId ?? null);

      const canVote = await canVoteOnPost(input.postId, userId);
      if (!canVote) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to vote on this post",
        });
      }

      if (input.value === 0) {
        await removeVote(input.postId, userId, sessionId);
      } else {
        await voteOnPost({
          postId: input.postId,
          userId,
          sessionId,
          value: input.value,
        });
      }

      return { success: true };
    }),

  // Update post status (for roadmap drag-and-drop) — membership guaranteed by middleware
  updateStatus: orgProcedure
    .input(
      z.object({
        postId: z.string(),
        status: feedbackStatusValidator.refine(
          (status) => ["planned", "in_progress", "completed"].includes(status),
          { message: "Status must be planned, in_progress, or completed" }
        ),
      })
    )
    .mutation(async ({ input }) =>
      updateFeedbackPost(input.postId, { status: input.status })
    ),

  // Get comments for a post
  getComments: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input, ctx }) => {
      const post = await getFeedbackPost(input.postId);
      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback post not found",
        });
      }

      const canView = await canViewPost(input.postId, ctx.session?.user?.id);
      if (!canView) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback post not found",
        });
      }

      return getPostComments(input.postId, post.post.organizationId);
    }),

  // Create a comment
  createComment: publicProcedure
    .input(
      z.object({
        postId: z.string(),
        content: z.string().min(1).max(2000),
        parentId: z.string().optional(),
        authorName: z.string().min(1).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id ?? null;

      const canComment = await canCommentOnPost(input.postId, userId);
      if (!canComment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to comment on this post",
        });
      }

      const post = await getFeedbackPost(input.postId);
      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback post not found",
        });
      }

      const canView = await canViewPost(input.postId, userId);
      if (!canView) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback post not found",
        });
      }

      const newComment = await createComment({
        postId: input.postId,
        authorId: userId,
        authorName: userId ? null : input.authorName,
        content: input.content,
        parentId: input.parentId,
      });

      if (!newComment) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create comment",
        });
      }

      const isAuthorTeamMember = userId
        ? await memberQueries.isMember(userId, post.post.organizationId)
        : false;

      return {
        comment: newComment,
        author:
          userId && ctx.session?.user
            ? {
                id: ctx.session.user.id,
                name: ctx.session.user.name,
                email: ctx.session.user.email,
                emailVerified: ctx.session.user.emailVerified,
                image: ctx.session.user.image ?? null,
                createdAt: ctx.session.user.createdAt,
                updatedAt: ctx.session.user.updatedAt,
              }
            : null,
        isTeamMember: isAuthorTeamMember,
      };
    }),

  // Delete a comment (author or org admin only)
  deleteComment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
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
