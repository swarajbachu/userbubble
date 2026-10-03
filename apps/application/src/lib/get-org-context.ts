import { ApplicationError, serverReads } from "@userbubble/api/management";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getApplicationContext } from "./application-context";

/** Authorization is shared with application services; React cache deduplicates a render. */
export const getOrgContext = cache(async (slug: string) => {
  try {
    return await serverReads.organizationContext(
      await getApplicationContext(),
      slug
    );
  } catch (error) {
    if (error instanceof ApplicationError) {
      if (error.code === "UNAUTHORIZED") {
        redirect("/sign-in");
      }
      if (error.code === "NOT_FOUND") {
        notFound();
      }
    }
    throw error;
  }
});
export const getOrgContextWithMetadata = getOrgContext;
