import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { memberQueries, organizationQueries } from "@userbubble/db/queries";
import {
  organizationSettingsSchema,
  parseOrganizationSettings,
  serializeOrganizationSettings,
} from "@userbubble/db/schema";
import { z } from "zod";

import { orgAdminProcedure, orgProcedure } from "../trpc";

export const settingsRouter = {
  // Get current user's role in organization
  getMyRole: orgProcedure.query(({ ctx }) => ctx.org.role),

  // Update organization settings (branding, feedback, changelog, etc.)
  updateSettings: orgAdminProcedure
    .input(
      z.object({
        settings: organizationSettingsSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const org = await organizationQueries.findById(ctx.org.id);
      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      const currentSettings = parseOrganizationSettings(org.metadata);
      const mergedSettings = { ...currentSettings, ...input.settings };
      const serialized = serializeOrganizationSettings(mergedSettings);

      return organizationQueries.update(ctx.org.id, {
        metadata: serialized,
      });
    }),

  // List members with search/filter
  listMembers: orgProcedure
    .input(
      z.object({
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let members = await memberQueries.listByOrganization(ctx.org.id);

      if (input.search) {
        const search = input.search.toLowerCase();
        members = members.filter(
          (m) =>
            m.user.name?.toLowerCase().includes(search) ||
            m.user.email.toLowerCase().includes(search)
        );
      }

      return members;
    }),

  // Update member role
  updateMemberRole: orgAdminProcedure
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum(["owner", "admin", "member"]),
      })
    )
    .mutation(async ({ input }) =>
      memberQueries.updateRole(input.memberId, input.role)
    ),

  // Remove member
  removeMember: orgAdminProcedure
    .input(
      z.object({
        memberId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent removing yourself
      const member = await memberQueries.findById(input.memberId);
      if (member?.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove yourself from the organization",
        });
      }

      return memberQueries.remove(input.memberId);
    }),

  // Delete organization (owner only)
  deleteOrganization: orgProcedure
    .input(
      z.object({
        confirmationName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.org.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can delete the organization",
        });
      }

      const org = await organizationQueries.findById(ctx.org.id);
      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (org.name !== input.confirmationName) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organization name does not match",
        });
      }

      await organizationQueries.delete(ctx.org.id);
      return { success: true };
    }),
} satisfies TRPCRouterRecord;
