import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "../client";
import { user } from "../user/user.sql";
import {
  feedbackComment,
  feedbackPost,
  feedbackVote,
  type FeedbackPost,
  type NewFeedbackComment,
  type NewFeedbackPost,
  type NewFeedbackVote,
} from "./feedback.sql";

/**
 * Get all feedback posts for an organization
 */
export async function getFeedbackPosts(organizationId: string, filters?: {
  status?: string;
  category?: string;
  sortBy?: "votes" | "recent";
}) {
  let query = db
    .select({
      post: feedbackPost,
      author: user,
      voteCount: feedbackPost.voteCount,
    })
    .from(feedbackPost)
    .leftJoin(user, eq(feedbackPost.authorId, user.id))
    .where(eq(feedbackPost.organizationId, organizationId));

  // Apply filters
  if (filters?.status) {
    query = query.where(
      and(
        eq(feedbackPost.organizationId, organizationId),
        eq(feedbackPost.status, filters.status as any)
      )
    );
  }

  if (filters?.category) {
    query = query.where(
      and(
        eq(feedbackPost.organizationId, organizationId),
        eq(feedbackPost.category, filters.category as any)
      )
    );
  }

  // Apply sorting
  if (filters?.sortBy === "votes") {
    query = query.orderBy(desc(feedbackPost.voteCount));
  } else {
    query = query.orderBy(desc(feedbackPost.createdAt));
  }

  return query;
}

/**
 * Get a single feedback post with details
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
  // Insert vote (or update if exists due to unique constraint)
  await db
    .insert(feedbackVote)
    .values(vote)
    .onConflictDoUpdate({
      target: [feedbackVote.postId, feedbackVote.userId],
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
export async function removeVote(postId: string, userId: string) {
  await db
    .delete(feedbackVote)
    .where(and(eq(feedbackVote.postId, postId), eq(feedbackVote.userId, userId)));

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
export async function getUserVote(postId: string, userId: string) {
  const result = await db
    .select()
    .from(feedbackVote)
    .where(and(eq(feedbackVote.postId, postId), eq(feedbackVote.userId, userId)))
    .limit(1);

  return result[0];
}

/**
 * Get comments for a post
 */
export async function getPostComments(postId: string) {
  return db
    .select({
      comment: feedbackComment,
      author: user,
    })
    .from(feedbackComment)
    .leftJoin(user, eq(feedbackComment.authorId, user.id))
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
