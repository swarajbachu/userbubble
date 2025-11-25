import { eq } from "drizzle-orm";
import { db } from "../client";
import { memberQueries } from "../org/organization.queries";
import { feedbackComment, feedbackPost } from "./feedback.sql";

/**
 * Check if user can modify a feedback post
 * Rules: Post author OR org admin/owner
 */
export async function canModifyPost(
  userId: string,
  postId: string
): Promise<boolean> {
  const post = await db.query.feedbackPost.findFirst({
    where: eq(feedbackPost.id, postId),
    columns: { authorId: true, organizationId: true },
  });

  if (!post) {
    return false;
  }

  // Author can always modify
  if (post.authorId === userId) {
    return true;
  }

  // Check if user is admin/owner
  return memberQueries.hasRole(userId, post.organizationId, ["admin", "owner"]);
}

/**
 * Check if user can delete a feedback post
 * Rules: Same as modify
 */
export async function canDeletePost(
  userId: string,
  postId: string
): Promise<boolean> {
  return canModifyPost(userId, postId);
}

/**
 * Check if user can delete a comment
 * Rules: Comment author OR org admin/owner
 */
export async function canDeleteComment(
  userId: string,
  commentId: string
): Promise<boolean> {
  const comment = await db.query.feedbackComment.findFirst({
    where: eq(feedbackComment.id, commentId),
    columns: { authorId: true, postId: true },
  });

  if (!comment) {
    return false;
  }

  // Comment author can delete
  if (comment.authorId === userId) {
    return true;
  }

  // Get post to find organization
  const post = await db.query.feedbackPost.findFirst({
    where: eq(feedbackPost.id, comment.postId),
    columns: { organizationId: true },
  });

  if (!post) {
    return false;
  }

  // Check if user is admin/owner
  return memberQueries.hasRole(userId, post.organizationId, ["admin", "owner"]);
}

/**
 * Check if user is team member of organization
 */
export async function isTeamMember(
  userId: string,
  organizationId: string
): Promise<boolean> {
  return memberQueries.isMember(userId, organizationId);
}
