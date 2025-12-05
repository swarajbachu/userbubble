import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { auth } from "~/auth/server";

/**
 * Cached organization fetch - deduplicates requests within same render
 * Layout calls this, pages call this - only 1 DB query per request
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
