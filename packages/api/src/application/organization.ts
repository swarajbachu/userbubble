import { Clock, Effect } from "effect";
import {
  CancelInvitationInput,
  EmptyInput,
  OnboardingInput,
  OrganizationCreateInput,
  OrganizationInput,
  OrganizationInviteInput,
  OrganizationSlugInput,
  OrganizationUpdateInput,
} from "../contracts/inputs";
import {
  Available,
  Invitation,
  Invitations,
  Organization,
  Organizations,
  Success,
} from "../contracts/outputs";
import { ApplicationError } from "./errors";
import {
  orgAdminProcedure,
  orgProcedure,
  protectedProcedure,
} from "./procedure";
import { OrganizationRepository } from "./repositories/organization";

export const organizationOperations = {
  list: protectedProcedure
    .effectInput(EmptyInput)
    .output(Organizations)
    .query(({ ctx }) =>
      Effect.gen(function* () {
        const repository = yield* OrganizationRepository;
        const organizations = yield* repository.list(ctx.session.user.id);
        return organizations.filter(
          (organization) =>
            !ctx.delegatedOrganizationId ||
            organization.id === ctx.delegatedOrganizationId
        );
      })
    ),
  get: orgProcedure
    .effectInput(OrganizationInput)
    .output(Organization)
    .query(({ ctx }) =>
      Effect.gen(function* () {
        const repository = yield* OrganizationRepository;
        const org = yield* repository.find(ctx.org.id);
        if (!org) {
          return yield* Effect.fail(
            new ApplicationError({ code: "NOT_FOUND" })
          );
        }
        return org;
      })
    ),
  checkSlug: protectedProcedure
    .effectInput(OrganizationSlugInput)
    .output(Available)
    .query(({ input }) =>
      Effect.gen(function* () {
        const repository = yield* OrganizationRepository;
        return yield* repository.slugAvailable(input.slug);
      })
    ),
  create: protectedProcedure
    .effectInput(OrganizationCreateInput)
    .output(Organization)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* OrganizationRepository;
        if (!(yield* repository.slugAvailable(input.slug))) {
          return yield* Effect.fail(
            new ApplicationError({
              code: "CONFLICT",
              message: "This address is already in use",
            })
          );
        }
        return yield* repository.create(input, ctx.session.user.id);
      })
    ),
  update: orgAdminProcedure
    .effectInput(OrganizationUpdateInput)
    .output(Organization)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* OrganizationRepository;
        const {
          organizationId: _organizationId,
          expectedRevision,
          ...updates
        } = input;
        const org = yield* repository.update(
          ctx.org.id,
          updates,
          expectedRevision
        );
        if (!org) {
          return yield* Effect.fail(
            new ApplicationError({
              code: "CONFLICT",
              message:
                "Organization changed. Retrieve the latest settingsRevision and retry.",
            })
          );
        }
        return org;
      })
    ),
  initializeOnboarding: orgAdminProcedure
    .effectInput(OrganizationInput)
    .output(Success)
    .mutation(({ ctx }) =>
      Effect.gen(function* () {
        const repository = yield* OrganizationRepository;
        const updated = yield* repository.patchOnboarding(ctx.org.id, {});
        if (!updated) {
          return yield* Effect.fail(
            new ApplicationError({ code: "NOT_FOUND" })
          );
        }
        return { success: true };
      })
    ),
  updateOnboarding: orgAdminProcedure
    .effectInput(OnboardingInput)
    .output(Success)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* OrganizationRepository;
        const updated = yield* repository.patchOnboarding(
          ctx.org.id,
          input.steps
        );
        if (!updated) {
          return yield* Effect.fail(
            new ApplicationError({ code: "NOT_FOUND" })
          );
        }
        return { success: true };
      })
    ),
  listInvitations: orgAdminProcedure
    .effectInput(OrganizationInput)
    .output(Invitations)
    .query(({ ctx }) =>
      Effect.gen(function* () {
        const repository = yield* OrganizationRepository;
        return yield* repository.invitations(ctx.org.id);
      })
    ),
  invite: orgAdminProcedure
    .effectInput(OrganizationInviteInput)
    .output(Invitation)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* OrganizationRepository;
        const existing = yield* repository.pendingInvitation(
          input.email,
          ctx.org.id
        );
        if (existing) {
          return existing;
        }
        const now = yield* Clock.currentTimeMillis;
        const created = yield* repository.createInvitation({
          organizationId: ctx.org.id,
          inviterId: ctx.session.user.id,
          email: input.email,
          role: input.role,
          status: "pending",
          expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
        });
        if (!created) {
          return yield* Effect.fail(
            new ApplicationError({ code: "INTERNAL_SERVER_ERROR" })
          );
        }
        return created;
      })
    ),
  cancelInvitation: orgAdminProcedure
    .effectInput(CancelInvitationInput)
    .output(Invitation)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* OrganizationRepository;
        const invitation = yield* repository.invitation(input.invitationId);
        if (!invitation || invitation.organizationId !== ctx.org.id) {
          return yield* Effect.fail(
            new ApplicationError({ code: "NOT_FOUND" })
          );
        }
        const cancelled = yield* repository.cancelInvitation(
          invitation.id,
          ctx.org.id
        );
        if (!cancelled) {
          return yield* Effect.fail(
            new ApplicationError({
              code: "CONFLICT",
              message: "This invitation is no longer pending",
            })
          );
        }
        return cancelled;
      })
    ),
};
