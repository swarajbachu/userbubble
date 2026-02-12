import { memberQueries, organizationQueries } from "@userbubble/db/queries";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getSession } from "~/auth/server";
import { getOrganization } from "./get-organization";

/**
 * Resolves the authenticated org context for server components.
 * Deduplicates via React cache() within a single request.
 *
 * Returns the organization (Better Auth object), session, and member (id + role).
 * Calls notFound() if org missing or user is not a member.
 * Redirects to /sign-in if no session.
 */
export const getOrgContext = cache(async (slug: string) => {
  const [organization, session] = await Promise.all([
    getOrganization(slug),
    getSession(),
  ]);

  if (!session) {
    redirect("/sign-in");
  }

  const member = await memberQueries.findByUserAndOrg(
    session.user.id,
    organization.id
  );

  if (!member) {
    notFound();
  }

  return {
    organization,
    session,
    member: { id: member.id, role: member.role },
  };
});

/**
 * Resolves org context using a direct DB query (returns full Drizzle Organization with metadata).
 * Use this when you need access to organization.metadata (e.g., settings pages).
 */
export const getOrgContextWithMetadata = cache(async (slug: string) => {
  const [organization, session] = await Promise.all([
    organizationQueries.findBySlug(slug),
    getSession(),
  ]);

  if (!organization) {
    notFound();
  }

  if (!session) {
    redirect("/sign-in");
  }

  const member = await memberQueries.findByUserAndOrg(
    session.user.id,
    organization.id
  );

  if (!member) {
    notFound();
  }

  return {
    organization,
    session,
    member: { id: member.id, role: member.role },
  };
});
