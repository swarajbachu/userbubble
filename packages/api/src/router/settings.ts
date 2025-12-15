import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import {
  memberQueries,
  organizationPermissions,
  organizationQueries,
} from "@userbubble/db/queries";
import {
  organizationSettingsSchema,
  parseOrganizationSettings,
  serializeOrganizationSettings,
} from "@userbubble/db/schema";
import { z } from "zod";

import { protectedProcedure } from "../trpc";

export const settingsRouter = {
  // Get current user's role in organization
  getMyRole: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) =>
      organizationPermissions.getUserRole(
        ctx.session.user.id,
        input.organizationId
      )
    ),

  // Update organization settings (branding, feedback, changelog, etc.)
  updateSettings: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        settings: organizationSettingsSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Permission check
      const canManage = await organizationPermissions.canManageSettings(
        ctx.session.user.id,
        input.organizationId
      );

      if (!canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can manage settings",
        });
      }

      // Get current settings
      const org = await organizationQueries.findById(input.organizationId);
      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      const currentSettings = parseOrganizationSettings(org.metadata);
      const mergedSettings = { ...currentSettings, ...input.settings };
      const serialized = serializeOrganizationSettings(mergedSettings);

      return organizationQueries.update(input.organizationId, {
        metadata: serialized,
      });
    }),

  // List members with search/filter
  listMembers: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Permission check
      const isMember = await memberQueries.isMember(
        ctx.session.user.id,
        input.organizationId
      );
      if (!isMember) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      let members = await memberQueries.listByOrganization(
        input.organizationId
      );

      // Client-side search filter
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
  updateMemberRole: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        organizationId: z.string(),
        role: z.enum(["owner", "admin", "member"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Permission check
      const canManage = await organizationPermissions.canManageMembers(
        ctx.session.user.id,
        input.organizationId
      );

      if (!canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can manage members",
        });
      }

      return memberQueries.updateRole(input.memberId, input.role);
    }),

  // Remove member
  removeMember: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        organizationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Permission check
      const canManage = await organizationPermissions.canManageMembers(
        ctx.session.user.id,
        input.organizationId
      );

      if (!canManage) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

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
  deleteOrganization: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        confirmationName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const canDelete = await organizationPermissions.canDeleteOrganization(
        ctx.session.user.id,
        input.organizationId
      );

      if (!canDelete) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can delete the organization",
        });
      }

      const org = await organizationQueries.findById(input.organizationId);
      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Verify confirmation
      if (org.name !== input.confirmationName) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organization name does not match",
        });
      }

      await organizationQueries.delete(input.organizationId);
      return { success: true };
    }),
} satisfies TRPCRouterRecord;
