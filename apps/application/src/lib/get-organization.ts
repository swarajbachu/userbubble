import { organizationQueries } from "@userbubble/db/queries";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { auth } from "~/auth/server";

/**
 * Cached organization fetch - deduplicates requests within same render
 * Layout calls this, pages call this - only 1 DB query per request
 * Requires authenticated session
 */
export const getOrganization = cache(async (slug: string) => {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
    query: { organizationSlug: slug },
  });

  if (!organization) {
    notFound();
  }

  return organization;
});

/**
 * Fetch organization for public/external routes (no auth required)
 * Uses direct DB query instead of Better Auth API
 * Cached to deduplicate requests within same render
 */
export const getPublicOrganization = cache(async (slug: string) => {
  const organization = await organizationQueries.findBySlug(slug);

  if (!organization) {
    notFound();
  }

  return organization;
});
