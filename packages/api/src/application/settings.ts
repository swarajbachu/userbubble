import {
  parseOrganizationSettings,
  serializeOrganizationSettings,
} from "@userbubble/validators";
import { Effect } from "effect";
import {
  MemberListInput,
  MemberRemoveInput,
  MemberRoleInput,
  OrganizationDeleteInput,
  OrganizationInput,
  SettingsUpdateInput,
} from "../contracts/inputs";
import {
  MemberRole,
  Members,
  Organization,
  Success,
} from "../contracts/outputs";
import { ApplicationError as TRPCError } from "./errors";
import { orgAdminProcedure, orgProcedure } from "./procedure";
import { MembershipRepository } from "./repositories/membership";
import { OrganizationRepository } from "./repositories/organization";

export const settingsOperations = {
  // Get current user's role in organization
  getMyRole: orgProcedure
    .effectInput(OrganizationInput)
    .output(MemberRole)
    .query(({ ctx }) => Effect.succeed(ctx.org.role)),

  // Update organization settings (branding, feedback, changelog, etc.)
  updateSettings: orgAdminProcedure
    .effectInput(SettingsUpdateInput)
    .output(Organization)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const organizationRepository = yield* OrganizationRepository;
        const org = yield* organizationRepository.find(ctx.org.id);
        if (!org) {
          return yield* Effect.fail(
            new TRPCError({
              code: "NOT_FOUND",
              message: "Organization not found",
            })
          );
        }

        if (
          input.expectedRevision !== undefined &&
          input.expectedRevision !== org.settingsRevision
        ) {
          return yield* new TRPCError({
            code: "CONFLICT",
            message:
              "Settings changed. Retrieve the latest settingsRevision and retry.",
          });
        }
        const currentSettings = parseOrganizationSettings(org.metadata);
        const patch = input.settings;
        const mergedSettings = {
          publicAccess: {
            ...currentSettings.publicAccess,
            ...patch.publicAccess,
          },
          branding: { ...currentSettings.branding, ...patch.branding },
          feedback: {
            ...currentSettings.feedback,
            ...patch.feedback,
            boards: [
              ...(patch.feedback?.boards ?? currentSettings.feedback.boards),
            ],
            tags: [...(patch.feedback?.tags ?? currentSettings.feedback.tags)],
          },
          changelog: {
            ...currentSettings.changelog,
            ...patch.changelog,
            tags: [
              ...(patch.changelog?.tags ?? currentSettings.changelog.tags),
            ],
          },
          domain: { ...currentSettings.domain, ...patch.domain },
        };
        const serialized = serializeOrganizationSettings(mergedSettings);

        const updated = yield* organizationRepository.update(
          ctx.org.id,
          {
            metadata: serialized,
          },
          org.settingsRevision
        );
        if (!updated) {
          return yield* Effect.fail(
            new TRPCError({
              code: "CONFLICT",
              message:
                "Settings changed. Retrieve the latest settingsRevision and retry.",
            })
          );
        }
        return updated;
      })
    ),

  // List members with search/filter
  listMembers: orgProcedure
    .effectInput(MemberListInput)
    .output(Members)
    .query(({ ctx, input }) =>
      Effect.gen(function* () {
        const membershipRepository = yield* MembershipRepository;
        let members = yield* membershipRepository.list(ctx.org.id);

        if (input.search) {
          const search = input.search.toLowerCase();
          members = members.filter(
            (m) =>
              m.user.name?.toLowerCase().includes(search) ||
              m.user.email.toLowerCase().includes(search)
          );
        }

        return members;
      })
    ),

  // Update member role
  updateMemberRole: orgAdminProcedure
    .effectInput(MemberRoleInput)
    .output(Success)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const membershipRepository = yield* MembershipRepository;
        const result = yield* membershipRepository.change({
          organizationId: ctx.org.id,
          actorId: ctx.session.user.id,
          memberId: input.memberId,
          role: input.role,
        });
        return result;
      })
    ),

  // Remove member
  removeMember: orgAdminProcedure
    .effectInput(MemberRemoveInput)
    .output(Success)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const membershipRepository = yield* MembershipRepository;
        const result = yield* membershipRepository.change({
          organizationId: ctx.org.id,
          actorId: ctx.session.user.id,
          memberId: input.memberId,
          remove: true,
        });
        return result;
      })
    ),

  // Delete organization (owner only)
  deleteOrganization: orgProcedure
    .effectInput(OrganizationDeleteInput)
    .output(Success)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const organizationRepository = yield* OrganizationRepository;
        if (ctx.org.role !== "owner") {
          return yield* Effect.fail(
            new TRPCError({
              code: "FORBIDDEN",
              message: "Only the owner can delete the organization",
            })
          );
        }

        const org = yield* organizationRepository.find(ctx.org.id);
        if (!org) {
          return yield* Effect.fail(new TRPCError({ code: "NOT_FOUND" }));
        }

        if (org.name !== input.confirmationName) {
          return yield* Effect.fail(
            new TRPCError({
              code: "BAD_REQUEST",
              message: "Organization name does not match",
            })
          );
        }

        yield* organizationRepository.delete(ctx.org.id);
        return { success: true };
      })
    ),
};
