import { generateApiKey, getKeyPreview, hashApiKey } from "@userbubble/auth";
import { apiKeyQueries, CredentialLimitError } from "@userbubble/db/queries";
import { Effect, Layer } from "effect";
import { ApplicationError, applicationError } from "../application/errors";
import { CredentialRepository } from "../application/repositories/credentials";

const credentialError = (cause: unknown) =>
  cause instanceof CredentialLimitError
    ? new ApplicationError({ code: "BAD_REQUEST", message: cause.message })
    : applicationError(cause);

export const credentialRepositoryLive = Layer.succeed(CredentialRepository, {
  list: (organizationId) =>
    Effect.tryPromise({
      try: () => apiKeyQueries.listByOrganization(organizationId),
      catch: credentialError,
    }),
  countActive: (organizationId) =>
    Effect.tryPromise({
      try: () => apiKeyQueries.countActiveKeys(organizationId),
      catch: credentialError,
    }),
  create: (input) =>
    Effect.tryPromise({
      try: async () => {
        const rawKey = generateApiKey();
        const keyHash = await hashApiKey(rawKey);
        const apiKey = await apiKeyQueries.create({
          organizationId: input.organizationId,
          name: input.name,
          description: input.description,
          expiresAt: input.expiresAt,
          keyHash,
          keyPreview: getKeyPreview(rawKey),
        });
        return apiKey ? { apiKey, rawKey } : undefined;
      },
      catch: credentialError,
    }),
  find: (id) =>
    Effect.tryPromise({
      try: () => apiKeyQueries.findById(id),
      catch: credentialError,
    }),
  update: (id, patch) =>
    Effect.tryPromise({
      try: () => apiKeyQueries.update(id, patch),
      catch: credentialError,
    }),
  toggle: (id, active) =>
    Effect.tryPromise({
      try: () => apiKeyQueries.toggleActive(id, active),
      catch: credentialError,
    }),
  delete: (id) =>
    Effect.tryPromise({
      try: async () => {
        await apiKeyQueries.delete(id);
      },
      catch: credentialError,
    }),
});
