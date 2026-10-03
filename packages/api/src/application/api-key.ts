import { Effect } from "effect";
import {
  ApiKeyCreateInput,
  ApiKeyIdInput,
  ApiKeyToggleInput,
  ApiKeyUpdateInput,
  OrganizationInput,
} from "../contracts/inputs";
import {
  ApiKeySummary,
  ApiKeys,
  CreatedApiKey,
  Success,
} from "../contracts/outputs";
import { ApplicationError as TRPCError } from "./errors";
import * as access from "./policies/access";
import { protectedProcedure } from "./procedure";
import { CredentialRepository } from "./repositories/credentials";

const MAX_ACTIVE_KEYS = 10;

export const apiKeyOperations = {
  /**
   * List all API keys for organization
   * Returns keys with masked values (only preview shown)
   */
  list: protectedProcedure
    .effectInput(OrganizationInput)
    .output(ApiKeys)
    .query(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* CredentialRepository;
        // Permission check - all members can view
        const canView = yield* access.isMember(
          ctx.session.user.id,
          input.organizationId
        );

        if (!canView) {
          return yield* Effect.fail(
            new TRPCError({
              code: "FORBIDDEN",
              message: "You must be a member to view API keys",
            })
          );
        }

        return yield* repository.list(input.organizationId);
      })
    ),

  /**
   * Create new API key
   * Returns the raw key ONLY ONCE - it will never be shown again
   */
  create: protectedProcedure
    .effectInput(ApiKeyCreateInput)
    .output(CreatedApiKey)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* CredentialRepository;
        // Permission check - only owners/admins can manage
        const canManage = yield* access.isAdmin(
          ctx.session.user.id,
          input.organizationId
        );

        if (!canManage) {
          return yield* Effect.fail(
            new TRPCError({
              code: "FORBIDDEN",
              message: "Only owners and admins can manage API keys",
            })
          );
        }

        // Check active key limit
        const activeCount = yield* repository.countActive(input.organizationId);

        if (activeCount >= MAX_ACTIVE_KEYS) {
          return yield* Effect.fail(
            new TRPCError({
              code: "BAD_REQUEST",
              message: `Maximum of ${MAX_ACTIVE_KEYS} active API keys allowed`,
            })
          );
        }

        const created = yield* repository.create(input);
        if (!created) {
          return yield* Effect.fail(
            new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
          );
        }
        return created;
      })
    ),

  /**
   * Update API key name and description
   */
  update: protectedProcedure
    .effectInput(ApiKeyUpdateInput)
    .output(ApiKeySummary)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* CredentialRepository;
        // Get the API key to check organization
        const apiKey = yield* repository.find(input.id);
        if (!apiKey) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "API key not found",
            })
          );
        }

        // Permission check
        const canManage = yield* access.isAdmin(
          ctx.session.user.id,
          apiKey.organizationId
        );

        if (!canManage) {
          return yield* Effect.fail(
            new TRPCError({
              code: "FORBIDDEN",
              message: "Only owners and admins can manage API keys",
            })
          );
        }

        const updated = yield* repository.update(input.id, {
          name: input.name,
          description: input.description,
        });
        if (!updated) {
          return yield* Effect.fail(new TRPCError({ code: "NOT_FOUND" }));
        }
        return updated;
      })
    ),

  /**
   * Toggle API key active status (revoke/restore)
   */
  toggleActive: protectedProcedure
    .effectInput(ApiKeyToggleInput)
    .output(ApiKeySummary)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* CredentialRepository;
        // Get the API key to check organization
        const apiKey = yield* repository.find(input.id);
        if (!apiKey) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "API key not found",
            })
          );
        }

        // Permission check
        const canManage = yield* access.isAdmin(
          ctx.session.user.id,
          apiKey.organizationId
        );

        if (!canManage) {
          return yield* Effect.fail(
            new TRPCError({
              code: "FORBIDDEN",
              message: "Only owners and admins can manage API keys",
            })
          );
        }

        const updated = yield* repository.toggle(input.id, input.isActive);
        if (!updated) {
          return yield* Effect.fail(new TRPCError({ code: "NOT_FOUND" }));
        }
        return updated;
      })
    ),

  /**
   * Delete API key (hard delete)
   */
  delete: protectedProcedure
    .effectInput(ApiKeyIdInput)
    .output(Success)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* CredentialRepository;
        // Get the API key to check organization
        const apiKey = yield* repository.find(input.id);
        if (!apiKey) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "API key not found",
            })
          );
        }

        // Permission check
        const canManage = yield* access.isAdmin(
          ctx.session.user.id,
          apiKey.organizationId
        );

        if (!canManage) {
          return yield* Effect.fail(
            new TRPCError({
              code: "FORBIDDEN",
              message: "Only owners and admins can manage API keys",
            })
          );
        }

        yield* repository.delete(input.id);
        return { success: true };
      })
    ),
};
