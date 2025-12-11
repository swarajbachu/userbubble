import { eq } from "drizzle-orm";
import { db } from "../client";
import { memberQueries } from "../org/organization.queries";
import { organization } from "../org/organization.sql";
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

/**
 * Check if user (authenticated or anonymous) can create a post
 * For external portal: checks org settings for anonymous permissions
 * For authenticated users: always allowed
 */
export async function canCreatePost(
  organizationId: string,
  userId?: string | null
): Promise<boolean> {
  // If user is authenticated, they can create posts
  if (userId) {
    return true;
  }

  // Anonymous user - check org settings
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
    columns: { metadata: true },
  });

  if (!org) {
    return false;
  }

  // Parse settings from metadata
  const { parseOrganizationSettings } = await import(
    "../org/organization-settings"
  );
  const settings = parseOrganizationSettings(org.metadata);

  return settings.publicAccess.allowAnonymousSubmissions;
}

/**
 * Check if user (authenticated or anonymous) can vote on a post
 */
export async function canVoteOnPost(
  postId: string,
  userId?: string | null
): Promise<boolean> {
  const post = await db.query.feedbackPost.findFirst({
    where: eq(feedbackPost.id, postId),
    columns: { organizationId: true },
  });

  if (!post) {
    return false;
  }

  // If user is authenticated, they can vote
  if (userId) {
    return true;
  }

  // Anonymous user - check org settings
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, post.organizationId),
    columns: { metadata: true },
  });

  if (!org) {
    return false;
  }

  const { parseOrganizationSettings } = await import(
    "../org/organization-settings"
  );
  const settings = parseOrganizationSettings(org.metadata);

  return settings.publicAccess.allowAnonymousVoting;
}

/**
 * Check if user (authenticated or anonymous) can comment on a post
 */
export async function canCommentOnPost(
  postId: string,
  userId?: string | null
): Promise<boolean> {
  const post = await db.query.feedbackPost.findFirst({
    where: eq(feedbackPost.id, postId),
    columns: { organizationId: true },
  });

  if (!post) {
    return false;
  }

  // If user is authenticated, they can comment
  if (userId) {
    return true;
  }

  // Anonymous user - check org settings
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, post.organizationId),
    columns: { metadata: true },
  });

  if (!org) {
    return false;
  }

  const { parseOrganizationSettings } = await import(
    "../org/organization-settings"
  );
  const settings = parseOrganizationSettings(org.metadata);

  return settings.publicAccess.allowAnonymousComments;
}
