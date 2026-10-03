import {
  connectionQueries,
  oauthConnectionQueries,
} from "@userbubble/db/queries";
import { Effect, Layer, Schema } from "effect";
import { ApplicationError, applicationError } from "../application/errors";
import { ConnectionRepository } from "../application/repositories/connections";

export const connectionRepositoryLive = Layer.succeed(ConnectionRepository, {
  activeOAuth: (userId, clientId, organizationId, issuedAt) =>
    Effect.tryPromise({
      try: () =>
        oauthConnectionQueries.active(
          userId,
          clientId,
          organizationId,
          issuedAt
        ),
      catch: applicationError,
    }),
  list: (userId) =>
    Effect.tryPromise({
      try: () => connectionQueries.list(userId),
      catch: applicationError,
    }),
  listOAuth: (userId) =>
    Effect.tryPromise({
      try: () => oauthConnectionQueries.list(userId),
      catch: applicationError,
    }),
  revoke: (userId, agentId) =>
    Effect.tryPromise({
      try: () => connectionQueries.revoke(userId, agentId),
      catch: applicationError,
    }),
  revokeOAuth: (userId, consentId) =>
    Effect.tryPromise({
      try: () => oauthConnectionQueries.revoke(userId, consentId),
      catch: applicationError,
    }),
  approval: (userId, agentId, code) =>
    Effect.tryPromise({
      try: () => connectionQueries.approval(userId, agentId, code),
      catch: applicationError,
    }),
  respond: (context, agentId, code, action) =>
    Effect.tryPromise({
      try: async () => {
        if (!context.headers) {
          throw new ApplicationError({ code: "FORBIDDEN" });
        }
        const result = await context.authApi.approveCapability({
          headers: context.headers,
          asResponse: true,
          body: { agent_id: agentId, user_code: code, action, ttl: 86_400 },
        });
        const value: unknown = await result.json();
        if (!result.ok) {
          throw new ApplicationError({
            code: "BAD_REQUEST",
            message: "Unable to respond to this approval request",
          });
        }
        return Schema.decodeUnknownSync(
          Schema.Union([
            Schema.Struct({ status: Schema.String }),
            Schema.Struct({ error: Schema.String, message: Schema.String }),
          ])
        )(value);
      },
      catch: applicationError,
    }),
});
