import { validateApiKeyWithOrg } from "@userbubble/auth";
import { apiKeyQueries, identifiedUserQueries } from "@userbubble/db/queries";
import { generateId } from "better-auth";
import { Effect, Layer } from "effect";
import { applicationError } from "../application/errors";
import { IdentificationRepository } from "../application/repositories/identification";

export const identificationRepositoryLive = Layer.succeed(
  IdentificationRepository,
  {
    validateKey: (key) =>
      Effect.tryPromise({
        try: async () => {
          const value = await validateApiKeyWithOrg(key);
          return value
            ? {
                keyId: value.apiKey.id,
                organizationId: value.organization.id,
                organizationSlug: value.organization.slug,
              }
            : null;
        },
        catch: applicationError,
      }),
    touchKey: (id) =>
      Effect.tryPromise({
        try: async () => {
          await apiKeyQueries.updateLastUsed(id);
        },
        catch: applicationError,
      }),
    upsert: (input) =>
      Effect.tryPromise({
        try: () =>
          identifiedUserQueries.upsert({
            ...input,
            id: generateId(),
            userId: null,
          }),
        catch: applicationError,
      }),
  }
);
