import { parseOrganizationSettings } from "@userbubble/validators";
import { Effect } from "effect";
import { Authorization } from "../authorization";
import { OrganizationRepository } from "../repositories/organization";

type Viewer = string | null | undefined;
type PostAccess = {
  organizationId: string;
  authorId: string | null;
  isPublic: boolean;
};
export const membership = Effect.fn("access.membership")(function* (
  userId: string,
  organizationId: string
) {
  return yield* (yield* Authorization).membership(userId, organizationId);
});
export const isMember = Effect.fn("access.isMember")(function* (
  userId: string,
  organizationId: string
) {
  return Boolean(yield* membership(userId, organizationId));
});
export const isAdmin = Effect.fn("access.isAdmin")(function* (
  userId: string,
  organizationId: string
) {
  const member = yield* membership(userId, organizationId);
  return member?.role === "owner" || member?.role === "admin";
});
export const canViewPost = Effect.fn("access.canViewPost")(function* (
  post: PostAccess,
  userId: Viewer,
  allowMembership = true
) {
  if (post.isPublic) {
    return true;
  }
  if (!userId) {
    return false;
  }
  return (
    post.authorId === userId ||
    (allowMembership && (yield* isMember(userId, post.organizationId)))
  );
});
export const canModify = Effect.fn("access.canModify")(function* (
  resource: { authorId: string | null; organizationId: string },
  userId: string,
  allowMembership = true
) {
  return (
    resource.authorId === userId ||
    (allowMembership && (yield* isAdmin(userId, resource.organizationId)))
  );
});
export const canParticipate = Effect.fn("access.canParticipate")(function* (
  organizationId: string,
  userId: Viewer,
  action: "submit" | "vote" | "comment"
) {
  if (userId) {
    return true;
  }
  const organization = yield* (yield* OrganizationRepository).find(
    organizationId
  );
  if (!organization) {
    return false;
  }
  const settings = parseOrganizationSettings(
    organization.metadata
  ).publicAccess;
  if (action === "submit") {
    return settings.allowAnonymousSubmissions;
  }
  if (action === "vote") {
    return settings.allowAnonymousVoting;
  }
  return settings.allowAnonymousComments;
});
