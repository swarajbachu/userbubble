import { invitationQueries, organizationQueries } from "@userbubble/db/queries";
import { Effect, Layer } from "effect";
import { applicationError } from "../application/errors";
import { OrganizationRepository } from "../application/repositories/organization";

export const organizationRepositoryLive = Layer.succeed(
  OrganizationRepository,
  {
    delete: (id) =>
      Effect.tryPromise({
        try: () => organizationQueries.delete(id),
        catch: applicationError,
      }),
    list: (userId) =>
      Effect.tryPromise({
        try: async () =>
          (await organizationQueries.listUserOrganizations(userId)).map(
            ({ organization, role }) => ({ ...organization, role })
          ),
        catch: applicationError,
      }),
    bySlug: (slug) =>
      Effect.tryPromise({
        try: () => organizationQueries.findBySlug(slug),
        catch: applicationError,
      }),
    find: (id) =>
      Effect.tryPromise({
        try: () => organizationQueries.findById(id),
        catch: applicationError,
      }),
    slugAvailable: (slug) =>
      Effect.tryPromise({
        try: () => organizationQueries.isSlugAvailable(slug),
        catch: applicationError,
      }),
    create: (input, userId) =>
      Effect.tryPromise({
        try: () => organizationQueries.createWithOwner(input, userId),
        catch: applicationError,
      }),
    patchOnboarding: (id, steps) =>
      Effect.tryPromise({
        try: () => organizationQueries.patchOnboarding(id, steps),
        catch: applicationError,
      }),
    update: (id, patch, expectedSettingsRevision) =>
      Effect.tryPromise({
        try: () =>
          expectedSettingsRevision === undefined
            ? organizationQueries.update(id, patch)
            : organizationQueries.update(id, patch, expectedSettingsRevision),
        catch: applicationError,
      }),
    invitations: (organizationId) =>
      Effect.tryPromise({
        try: () => invitationQueries.listByOrganization(organizationId),
        catch: applicationError,
      }),
    pendingInvitation: (email, organizationId) =>
      Effect.tryPromise({
        try: () => invitationQueries.findPending(email, organizationId),
        catch: applicationError,
      }),
    invitation: (id) =>
      Effect.tryPromise({
        try: () => invitationQueries.findById(id),
        catch: applicationError,
      }),
    createInvitation: (input) =>
      Effect.tryPromise({
        try: () => invitationQueries.create(input),
        catch: applicationError,
      }),
    cancelInvitation: (id, organizationId) =>
      Effect.tryPromise({
        try: () => invitationQueries.cancel(id, organizationId),
        catch: applicationError,
      }),
  }
);
