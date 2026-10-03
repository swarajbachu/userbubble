import { Effect } from "effect";
import {
  FeedbackCommentInput,
  FeedbackCreateInput,
  FeedbackIdInput,
  FeedbackListInput,
  FeedbackPostInput,
  FeedbackSearchInput,
  FeedbackStatusInput,
  FeedbackUpdateInput,
  FeedbackVoteInput,
} from "../contracts/inputs";
import {
  CommentDetail,
  Comments,
  FeedbackDetail,
  FeedbackList,
  FeedbackPage,
  FeedbackPost,
  Success,
} from "../contracts/outputs";
import { applicationError, ApplicationError as TRPCError } from "./errors";
import * as access from "./policies/access";
import {
  assertOrgAccess,
  identifiedProcedure,
  orgProcedure,
  publicProcedure,
} from "./procedure";
import { FeedbackRepository } from "./repositories/feedback";

export const feedbackOperations = {
  search: orgProcedure
    .effectInput(FeedbackSearchInput)
    .output(FeedbackPage)
    .query(({ ctx, input }) =>
      Effect.flatMap(FeedbackRepository, (repository) =>
        repository.search(ctx.org.id, input)
      )
    ),
  // Get all feedback posts for an organization
  getAll: publicProcedure
    .effectInput(FeedbackListInput)
    .output(FeedbackList)
    .query(({ input, ctx }) =>
      Effect.gen(function* () {
        const repository = yield* FeedbackRepository;
        yield* Effect.try({
          try: () => assertOrgAccess(ctx, input.organizationId),
          catch: applicationError,
        });
        return yield* repository.list(input.organizationId, {
          status: input.status && [...input.status],
          category: input.category,
          sortBy: input.sortBy,
          userId: ctx.session?.user?.id,
          includeOrganizationPrivate:
            !ctx.isIdentified &&
            !!ctx.session &&
            (yield* access.isMember(ctx.session.user.id, input.organizationId)),
        });
      })
    ),

  // Get a single feedback post
  getById: publicProcedure
    .effectInput(FeedbackIdInput)
    .output(FeedbackDetail)
    .query(({ input, ctx }) =>
      Effect.gen(function* () {
        const repository = yield* FeedbackRepository;
        const post = yield* repository.find(input.id);

        if (!post) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "Feedback post not found",
            })
          );
        }

        yield* Effect.try({
          try: () => assertOrgAccess(ctx, post.post.organizationId),
          catch: applicationError,
        });
        const canView = yield* access.canViewPost(
          post.post,
          ctx.session?.user?.id,
          !ctx.isIdentified
        );
        if (!canView) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "Feedback post not found",
            })
          );
        }

        return post;
      })
    ),

  // Create a new feedback post (supports both authenticated and anonymous)
  create: publicProcedure
    .effectInput(FeedbackCreateInput)
    .output(FeedbackPost)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* FeedbackRepository;
        const userId = ctx.session?.user?.id;

        // Identified user can only create in their own org
        yield* Effect.try({
          try: () => assertOrgAccess(ctx, input.organizationId),
          catch: applicationError,
        });

        const canCreate = yield* access.canParticipate(
          input.organizationId,
          userId,
          "submit"
        );
        if (!canCreate) {
          return yield* Effect.fail(
            new TRPCError({
              code: "FORBIDDEN",
              message: userId
                ? "You don't have permission to create feedback in this organization"
                : "Anonymous submissions are not allowed for this organization. Please sign in.",
            })
          );
        }

        const post = yield* repository.create({
          organizationId: input.organizationId,
          authorId: userId ?? null,
          title: input.title,
          description: input.description,
          category: input.category,
          status: "open",
          voteCount: 0,
          isPublic: input.isPublic ?? true,
        });

        if (!post) {
          return yield* Effect.fail(
            new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create feedback post",
            })
          );
        }

        return post;
      })
    ),

  // Update a feedback post (author or org admin only)
  update: identifiedProcedure
    .effectInput(FeedbackUpdateInput)
    .output(FeedbackPost)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* FeedbackRepository;
        const { id, expectedRevision, ...updates } = input;

        const post = yield* repository.find(id);
        if (!post) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "Feedback post not found",
            })
          );
        }

        // Identified user can only modify posts in their org
        yield* Effect.try({
          try: () => assertOrgAccess(ctx, post.post.organizationId),
          catch: applicationError,
        });

        const canModify = yield* access.canModify(
          post.post,
          ctx.session.user.id,
          !ctx.isIdentified
        );
        if (!canModify) {
          return yield* Effect.fail(
            new TRPCError({
              code: "FORBIDDEN",
              message: "You don't have permission to update this feedback post",
            })
          );
        }

        const updated = yield* repository.update(id, updates, expectedRevision);
        if (!updated) {
          return yield* Effect.fail(
            new TRPCError({
              code: "CONFLICT",
              message:
                "Feedback changed. Retrieve the latest revision and retry.",
            })
          );
        }
        return updated;
      })
    ),

  // Delete a feedback post (author or org admin only)
  delete: identifiedProcedure
    .effectInput(FeedbackIdInput)
    .output(Success)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* FeedbackRepository;
        const post = yield* repository.find(input.id);
        if (!post) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "Feedback post not found",
            })
          );
        }

        // Identified user can only delete posts in their org
        yield* Effect.try({
          try: () => assertOrgAccess(ctx, post.post.organizationId),
          catch: applicationError,
        });

        const canDelete = yield* access.canModify(
          post.post,
          ctx.session.user.id,
          !ctx.isIdentified
        );
        if (!canDelete) {
          return yield* Effect.fail(
            new TRPCError({
              code: "FORBIDDEN",
              message: "You don't have permission to delete this feedback post",
            })
          );
        }

        yield* repository.delete(input.id);
        return { success: true };
      })
    ),

  // Vote on a post
  vote: publicProcedure
    .effectInput(FeedbackVoteInput)
    .output(Success)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* FeedbackRepository;
        const userId = ctx.session?.user?.id ?? null;
        const sessionId = userId ? null : (input.sessionId ?? null);

        // Identified user can only vote in their own org
        const post = yield* repository.find(input.postId);
        if (post) {
          yield* Effect.try({
            try: () => assertOrgAccess(ctx, post.post.organizationId),
            catch: applicationError,
          });
        }

        const canVote = post
          ? (yield* access.canViewPost(post.post, userId, !ctx.isIdentified)) &&
            (yield* access.canParticipate(
              post.post.organizationId,
              userId,
              "vote"
            ))
          : false;
        if (!canVote) {
          return yield* Effect.fail(
            new TRPCError({
              code: "FORBIDDEN",
              message: "You don't have permission to vote on this post",
            })
          );
        }

        if (input.value === 0) {
          yield* repository.removeVote(input.postId, userId, sessionId);
        } else {
          yield* repository.vote({
            postId: input.postId,
            userId,
            sessionId,
            value: input.value,
          });
        }

        return { success: true };
      })
    ),

  // Update post status (for roadmap drag-and-drop) — membership guaranteed by middleware
  updateStatus: orgProcedure
    .effectInput(FeedbackStatusInput)
    .output(FeedbackPost)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* FeedbackRepository;
        const post = yield* repository.find(input.postId);
        if (!post || post.post.organizationId !== ctx.org.id) {
          return yield* Effect.fail(new TRPCError({ code: "NOT_FOUND" }));
        }
        const updated = yield* repository.update(
          input.postId,
          { status: input.status },
          input.expectedRevision
        );
        if (!updated) {
          return yield* Effect.fail(
            new TRPCError({
              code: "CONFLICT",
              message:
                "Feedback changed. Retrieve the latest revision and retry.",
            })
          );
        }
        return updated;
      })
    ),

  // Get comments for a post
  getComments: publicProcedure
    .effectInput(FeedbackPostInput)
    .output(Comments)
    .query(({ input, ctx }) =>
      Effect.gen(function* () {
        const repository = yield* FeedbackRepository;
        const post = yield* repository.find(input.postId);
        if (!post) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "Feedback post not found",
            })
          );
        }

        yield* Effect.try({
          try: () => assertOrgAccess(ctx, post.post.organizationId),
          catch: applicationError,
        });
        const canView = yield* access.canViewPost(
          post.post,
          ctx.session?.user?.id,
          !ctx.isIdentified
        );
        if (!canView) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "Feedback post not found",
            })
          );
        }

        return yield* repository.comments(
          input.postId,
          post.post.organizationId
        );
      })
    ),

  // Create a comment
  createComment: publicProcedure
    .effectInput(FeedbackCommentInput)
    .output(CommentDetail)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* FeedbackRepository;
        const userId = ctx.session?.user?.id ?? null;

        // Identified user can only comment in their own org
        const post = yield* repository.find(input.postId);
        if (!post) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "Feedback post not found",
            })
          );
        }

        yield* Effect.try({
          try: () => assertOrgAccess(ctx, post.post.organizationId),
          catch: applicationError,
        });

        const canComment = yield* access.canParticipate(
          post.post.organizationId,
          userId,
          "comment"
        );
        if (!canComment) {
          return yield* Effect.fail(
            new TRPCError({
              code: "FORBIDDEN",
              message: "You don't have permission to comment on this post",
            })
          );
        }

        const canView = yield* access.canViewPost(
          post.post,
          userId,
          !ctx.isIdentified
        );
        if (!canView) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "Feedback post not found",
            })
          );
        }

        if (input.parentId) {
          const comments = yield* repository.comments(
            input.postId,
            post.post.organizationId
          );
          if (!comments.some(({ comment }) => comment.id === input.parentId)) {
            return yield* Effect.fail(
              new TRPCError({
                code: "BAD_REQUEST",
                message: "Parent comment must belong to this feedback",
              })
            );
          }
        }
        const newComment = yield* repository.createComment({
          postId: input.postId,
          authorId: userId,
          authorName: userId ? null : input.authorName,
          content: input.content,
          parentId: input.parentId,
        });

        if (!newComment) {
          return yield* Effect.fail(
            new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create comment",
            })
          );
        }

        const isAuthorTeamMember = userId
          ? yield* access.isMember(userId, post.post.organizationId)
          : false;

        return {
          comment: newComment,
          author:
            userId && ctx.session?.user
              ? {
                  id: ctx.session.user.id,
                  name: ctx.session.user.name,
                  image: ctx.session.user.image ?? null,
                }
              : null,
          isTeamMember: isAuthorTeamMember,
        };
      })
    ),

  // Delete a comment (author or org admin only)
  deleteComment: identifiedProcedure
    .effectInput(FeedbackIdInput)
    .output(Success)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* FeedbackRepository;
        const comment = yield* repository.findComment(input.id);
        const post = comment
          ? yield* repository.find(comment.postId)
          : undefined;
        if (!post) {
          return yield* Effect.fail(new TRPCError({ code: "NOT_FOUND" }));
        }
        yield* Effect.try({
          try: () => assertOrgAccess(ctx, post.post.organizationId),
          catch: applicationError,
        });
        const canDelete = yield* access.canModify(
          {
            authorId: comment?.authorId ?? null,
            organizationId: post.post.organizationId,
          },
          ctx.session.user.id,
          !ctx.isIdentified
        );
        if (!canDelete) {
          return yield* Effect.fail(
            new TRPCError({
              code: "FORBIDDEN",
              message: "You don't have permission to delete this comment",
            })
          );
        }

        yield* repository.deleteComment(input.id);
        return { success: true };
      })
    ),
};
