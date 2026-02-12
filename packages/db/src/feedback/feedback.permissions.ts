import { eq } from "drizzle-orm";
import { db } from "../client";
import { memberQueries } from "../org/organization.queries";
import type { Role } from "../org/organization.sql";
import { organization } from "../org/organization.sql";
import { feedbackComment, feedbackPost } from "./feedback.sql";

// ---------------------------------------------------------------------------
// Sync helpers — accept pre-resolved context, no DB queries
// ---------------------------------------------------------------------------

type PermissionContext = { userId: string; role: Role };

/**
 * Sync check: can user modify a feedback post?
 * Rules: Post author OR org admin/owner
 */
export const canModifyPostSync = (
  ctx: PermissionContext,
  post: { authorId: string | null }
): boolean =>
  post.authorId === ctx.userId || ctx.role === "owner" || ctx.role === "admin";

/**
 * Sync check: can user delete a comment?
 * Rules: Comment author OR org admin/owner
 */
export const canDeleteCommentSync = (
  ctx: PermissionContext,
  comment: { authorId: string | null }
): boolean =>
  comment.authorId === ctx.userId ||
  ctx.role === "owner" ||
  ctx.role === "admin";

/**
 * Sync check: can user view a feedback post?
 * Rules: Public posts = everyone, Private posts = author OR team member
 */
export const canViewPostSync = (
  ctx: { userId?: string | null; role?: Role | null },
  post: { isPublic: boolean; authorId: string | null }
): boolean => {
  if (post.isPublic) {
    return true;
  }
  if (!ctx.userId) {
    return false;
  }
  if (post.authorId === ctx.userId) {
    return true;
  }
  // Any org member can view private posts
  return ctx.role != null;
};

// ---------------------------------------------------------------------------
// Async helpers — need DB access (anonymous permission checks, etc.)
// ---------------------------------------------------------------------------

/**
 * Check if user can modify a feedback post (async, queries DB)
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

  if (post.authorId === userId) {
    return true;
  }

  return memberQueries.hasRole(userId, post.organizationId, ["admin", "owner"]);
}

/**
 * Check if user can delete a feedback post (async, queries DB)
 * Rules: Same as modify
 */
export async function canDeletePost(
  userId: string,
  postId: string
): Promise<boolean> {
  return canModifyPost(userId, postId);
}

/**
 * Check if user can delete a comment (async, queries DB)
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

  if (comment.authorId === userId) {
    return true;
  }

  const post = await db.query.feedbackPost.findFirst({
    where: eq(feedbackPost.id, comment.postId),
    columns: { organizationId: true },
  });

  if (!post) {
    return false;
  }

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
 */
export async function canCreatePost(
  organizationId: string,
  userId?: string | null
): Promise<boolean> {
  if (userId) {
    return true;
  }

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
    columns: { metadata: true },
  });

  if (!org) {
    return false;
  }

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

  if (userId) {
    return true;
  }

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

  if (userId) {
    return true;
  }

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

/**
 * Check if user can view a feedback post (async, queries DB)
 */
export async function canViewPost(
  postId: string,
  userId?: string | null
): Promise<boolean> {
  const post = await db.query.feedbackPost.findFirst({
    where: eq(feedbackPost.id, postId),
    columns: {
      isPublic: true,
      authorId: true,
      organizationId: true,
    },
  });

  if (!post) {
    return false;
  }

  if (post.isPublic) {
    return true;
  }

  if (!userId) {
    return false;
  }

  if (post.authorId === userId) {
    return true;
  }

  return memberQueries.isMember(userId, post.organizationId);
}
