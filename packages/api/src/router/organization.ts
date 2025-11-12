import { getOrganizationBySlug } from "@critichut/db/org/organization.queries";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const organizationRouter = createTRPCRouter({
  // Get organization by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const org = await getOrganizationBySlug(input.slug);

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      return org;
    }),
});
