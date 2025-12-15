import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { organizationQueries } from "@userbubble/db/queries";
import { z } from "zod";

import { publicProcedure } from "../trpc";

export const organizationRouter = {
  // Get organization by slug
  // Used by server components to fetch org data for display
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const org = await organizationQueries.findBySlug(input.slug);

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      return org;
    }),
} satisfies TRPCRouterRecord;
