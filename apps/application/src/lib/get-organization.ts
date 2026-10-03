import { serverReads } from "@userbubble/api/management";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getOrgContext } from "./get-org-context";

export const getOrganization = cache(
  async (slug: string) => (await getOrgContext(slug)).organization
);

/** Public branding lookup; never includes installation secrets. */
export const getPublicOrganization = cache(async (slug: string) => {
  const organization = await serverReads.organizationBySlug(slug);
  if (!organization) {
    notFound();
  }
  return organization;
});
