import { and, desc, eq, exists, inArray, or, type SQL, sql } from "drizzle-orm";
import { db } from "../client";
import { member } from "../org/organization.sql";
import { user } from "../user/user.sql";
import {
  type FeedbackCategory,
  type FeedbackPost,
  type FeedbackStatus,
  feedbackComment,
  feedbackPost,
  feedbackVote,
  type NewFeedbackComment,
  type NewFeedbackPost,
  type NewFeedbackVote,
} from "./feedback.sql";

/**
 * Get all feedback posts for an organization
 */
export async function getFeedbackPosts(
  organizationId: string,
  filters?: {
    status?: FeedbackStatus[];
    category?: FeedbackCategory;
    sortBy?: "votes" | "recent";
    userId?: string; // For vote lookup AND privacy check
  }
) {
  // Build all conditions upfront
  const conditions: (SQL | undefined)[] = [
    eq(feedbackPost.organizationId, organizationId),
  ];

  // PRIVACY FILTER: Show public posts OR posts where user is author OR team member
  if (filters?.userId) {
    // Authenticated: public + own private + org private (if team member)
    conditions.push(
      or(
        eq(feedbackPost.isPublic, true),
        eq(feedbackPost.authorId, filters.userId),
        and(
          eq(feedbackPost.isPublic, false),
          exists(
            db
              .select()
              .from(member)
              .where(
                and(
                  eq(member.userId, filters.userId),
                  eq(member.organizationId, organizationId)
                )
              )
          )
        )
      )
    );
  } else {
    // Anonymous: only public posts
    conditions.push(eq(feedbackPost.isPublic, true));
  }

  if (filters?.status) {
    conditions.push(inArray(feedbackPost.status, filters.status));
  }

  if (filters?.category) {
    conditions.push(eq(feedbackPost.category, filters.category));
  }

  // Build query with selective columns and user vote check
  const query = db
    .select({
      post: feedbackPost,
      author: {
        name: sql<string>`COALESCE(${user.name}, 'Anonymous')`,
        image: user.image,
      },
      hasUserVoted: sql<boolean>`${feedbackVote.id} IS NOT NULL`,
    })
    .from(feedbackPost)
    .leftJoin(user, eq(feedbackPost.authorId, user.id))
    .leftJoin(
      feedbackVote,
      filters?.userId
        ? and(
            eq(feedbackVote.postId, feedbackPost.id),
            eq(feedbackVote.userId, filters.userId)
          )
        : sql`false` // Explicit false condition for no userId
    )
    .where(and(...conditions));

  // Apply sorting
  const sortedQuery =
    filters?.sortBy === "votes"
      ? query.orderBy(desc(feedbackPost.voteCount))
      : query.orderBy(desc(feedbackPost.createdAt));

  // CRITICAL: Execute query with await
  return await sortedQuery;
}

/**
 * Get a single feedback post with details
 * NOTE: Does NOT filter by privacy - caller must check canViewPost permission
 */
export async function getFeedbackPost(postId: string) {
  const result = await db
    .select({
      post: feedbackPost,
      author: user,
    })
    .from(feedbackPost)
    .leftJoin(user, eq(feedbackPost.authorId, user.id))
    .where(eq(feedbackPost.id, postId))
    .limit(1);

  return result[0];
}

/**
 * Create a new feedback post
 */
export async function createFeedbackPost(post: NewFeedbackPost) {
  const [newPost] = await db.insert(feedbackPost).values(post).returning();
  return newPost;
}

/**
 * Update a feedback post
 */
export async function updateFeedbackPost(
  postId: string,
  updates: Partial<FeedbackPost>
) {
  const [updated] = await db
    .update(feedbackPost)
    .set(updates)
    .where(eq(feedbackPost.id, postId))
    .returning();
  return updated;
}

/**
 * Delete a feedback post
 */
export async function deleteFeedbackPost(postId: string) {
  await db.delete(feedbackPost).where(eq(feedbackPost.id, postId));
}

/**
 * Vote on a feedback post
 */
export async function voteOnPost(vote: NewFeedbackVote) {
  // Determine conflict target based on auth type
  const conflictTarget = vote.userId
    ? [feedbackVote.postId, feedbackVote.userId]
    : [feedbackVote.postId, feedbackVote.sessionId];
  // Insert vote (or update if exists due to unique constraint)
  await db
    .insert(feedbackVote)
    .values(vote)
    .onConflictDoUpdate({
      target: conflictTarget,
      set: { value: vote.value },
    });

  // Update vote count on post
  await db
    .update(feedbackPost)
    .set({
      voteCount: sql`(
        SELECT COALESCE(SUM(value), 0)
        FROM ${feedbackVote}
        WHERE ${feedbackVote.postId} = ${vote.postId}
      )`,
    })
    .where(eq(feedbackPost.id, vote.postId));
}

/**
 * Remove vote from a post
 */
export async function removeVote(
  postId: string,
  userId: string | null,
  sessionId?: string | null
) {
  // Build delete condition based on auth type
  let deleteCondition: SQL | undefined;
  if (userId) {
    deleteCondition = and(
      eq(feedbackVote.postId, postId),
      eq(feedbackVote.userId, userId)
    );
  } else if (sessionId) {
    deleteCondition = and(
      eq(feedbackVote.postId, postId),
      eq(feedbackVote.sessionId, sessionId)
    );
  } else {
    // Neither userId nor sessionId provided - nothing to delete
    return;
  }

  await db.delete(feedbackVote).where(deleteCondition);

  // Update vote count
  await db
    .update(feedbackPost)
    .set({
      voteCount: sql`(
        SELECT COALESCE(SUM(value), 0)
        FROM ${feedbackVote}
        WHERE ${feedbackVote.postId} = ${postId}
      )`,
    })
    .where(eq(feedbackPost.id, postId));
}

/**
 * Get user's vote on a post
 */
export async function getUserVote(
  postId: string,
  userId: string | null,
  sessionId?: string | null
) {
  // Build query condition based on auth type
  let condition: SQL | undefined;
  if (userId) {
    condition = and(
      eq(feedbackVote.postId, postId),
      eq(feedbackVote.userId, userId)
    );
  } else if (sessionId) {
    condition = and(
      eq(feedbackVote.postId, postId),
      eq(feedbackVote.sessionId, sessionId)
    );
  } else {
    // Neither userId nor sessionId provided - return null
    return null;
  }

  const result = await db.select().from(feedbackVote).where(condition).limit(1);

  return result[0];
}

/**
 * Get comments for a post with team member status
 * Checks if comment author is a member of the organization (via LEFT JOIN)
 */
export async function getPostComments(postId: string, organizationId: string) {
  return db
    .select({
      comment: feedbackComment,
      author: user,
      // Check if comment author is a member of the organization
      isTeamMember: sql<boolean>`${member.id} IS NOT NULL`,
    })
    .from(feedbackComment)
    .leftJoin(user, eq(feedbackComment.authorId, user.id))
    .leftJoin(
      member,
      and(
        eq(member.userId, feedbackComment.authorId),
        eq(member.organizationId, organizationId)
      )
    )
    .where(eq(feedbackComment.postId, postId))
    .orderBy(desc(feedbackComment.createdAt));
}

/**
 * Create a comment
 */
export async function createComment(comment: NewFeedbackComment) {
  const [newComment] = await db
    .insert(feedbackComment)
    .values(comment)
    .returning();
  return newComment;
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string) {
  await db.delete(feedbackComment).where(eq(feedbackComment.id, commentId));
}
