import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { generateApiKey, getKeyPreview, hashApiKey } from "@userbubble/auth";
import { apiKeyPermissions, apiKeyQueries } from "@userbubble/db/queries";
import {
  createApiKeyValidator,
  toggleApiKeyValidator,
  updateApiKeyValidator,
} from "@userbubble/db/schema";
import { z } from "zod";

import { protectedProcedure } from "../trpc";

const MAX_ACTIVE_KEYS = 10;

export const apiKeyRouter = {
  /**
   * List all API keys for organization
   * Returns keys with masked values (only preview shown)
   */
  list: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Permission check - all members can view
      const canView = await apiKeyPermissions.canViewApiKeys(
        ctx.session.user.id,
        input.organizationId
      );

      if (!canView) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member to view API keys",
        });
      }

      return await apiKeyQueries.listByOrganization(input.organizationId);
    }),

  /**
   * Create new API key
   * Returns the raw key ONLY ONCE - it will never be shown again
   */
  create: protectedProcedure
    .input(createApiKeyValidator)
    .mutation(async ({ ctx, input }) => {
      // Permission check - only owners/admins can manage
      const canManage = await apiKeyPermissions.canManageApiKeys(
        ctx.session.user.id,
        input.organizationId
      );

      if (!canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can manage API keys",
        });
      }

      // Check active key limit
      const activeCount = await apiKeyQueries.countActiveKeys(
        input.organizationId
      );

      if (activeCount >= MAX_ACTIVE_KEYS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Maximum of ${MAX_ACTIVE_KEYS} active API keys allowed`,
        });
      }

      // Generate raw key
      const rawKey = generateApiKey();

      // Hash for storage
      const keyHash = await hashApiKey(rawKey);

      // Get preview (last 4 chars)
      const keyPreview = getKeyPreview(rawKey);

      // Create API key record
      const apiKey = await apiKeyQueries.create({
        organizationId: input.organizationId,
        name: input.name,
        description: input.description,
        keyHash,
        keyPreview,
        expiresAt: input.expiresAt,
      });

      // Return the API key record AND the raw key
      // IMPORTANT: The raw key is only returned here and never stored
      return {
        apiKey,
        rawKey, // Show this ONCE to the user
      };
    }),

  /**
   * Update API key name and description
   */
  update: protectedProcedure
    .input(updateApiKeyValidator)
    .mutation(async ({ ctx, input }) => {
      // Get the API key to check organization
      const apiKey = await apiKeyQueries.findById(input.id);
      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      // Permission check
      const canManage = await apiKeyPermissions.canManageApiKeys(
        ctx.session.user.id,
        apiKey.organizationId
      );

      if (!canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can manage API keys",
        });
      }

      return await apiKeyQueries.update(input.id, {
        name: input.name,
        description: input.description,
      });
    }),

  /**
   * Toggle API key active status (revoke/restore)
   */
  toggleActive: protectedProcedure
    .input(toggleApiKeyValidator)
    .mutation(async ({ ctx, input }) => {
      // Get the API key to check organization
      const apiKey = await apiKeyQueries.findById(input.id);
      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      // Permission check
      const canManage = await apiKeyPermissions.canManageApiKeys(
        ctx.session.user.id,
        apiKey.organizationId
      );

      if (!canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can manage API keys",
        });
      }

      return await apiKeyQueries.toggleActive(input.id, input.isActive);
    }),

  /**
   * Delete API key (hard delete)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get the API key to check organization
      const apiKey = await apiKeyQueries.findById(input.id);
      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      // Permission check
      const canManage = await apiKeyPermissions.canManageApiKeys(
        ctx.session.user.id,
        apiKey.organizationId
      );

      if (!canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can manage API keys",
        });
      }

      await apiKeyQueries.delete(input.id);
      return { success: true };
    }),
} satisfies TRPCRouterRecord;
