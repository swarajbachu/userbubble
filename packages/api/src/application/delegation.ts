import type { AgentSession, Auth } from "@userbubble/auth";
import { Clock, Effect, Schema } from "effect";
import { AgentContextInput } from "../contracts/agent-input";
import { describeOperations, operationCatalog } from "./catalog";
import { ApplicationError } from "./errors";
import { executeProductOperation } from "./execution";
import type { ApplicationServices } from "./procedure";
import { DelegationRepository } from "./repositories/delegation";

export function agentCapabilities(): NonNullable<
  import("@userbubble/auth").AgentAuthOptions["capabilities"]
> {
  return describeOperations().map((operation) => ({
    name: operation.id,
    description: operation.description,
    ...(operation.outputSchema ? { output: operation.outputSchema } : {}),
    input: operation.agentInputSchema,
    requiredConstraints: ["organizationId"],
    approvalStrength: "session" as const,
  }));
}

/** Called only after the transport verifies signature, audience, grants and revocation. */
type DelegationEffect = Effect.Effect<
  unknown,
  ApplicationError,
  ApplicationServices | DelegationRepository
>;
export const agentOperation: (
  auth: Auth,
  session: AgentSession,
  request: { id: string; requestId?: string },
  input?: Record<string, unknown>
) => DelegationEffect = Effect.fn("agentOperation")(function* (
  auth: Auth,
  agentSession: AgentSession,
  request: { id: string; requestId?: string },
  input: Record<string, unknown> = {}
): Effect.fn.Return<
  unknown,
  ApplicationError,
  ApplicationServices | DelegationRepository
> {
  if (!agentSession.userId || agentSession.user.id !== agentSession.userId) {
    return yield* Effect.fail(new ApplicationError({ code: "UNAUTHORIZED" }));
  }
  return yield* delegatedOperation(
    auth,
    { userId: agentSession.userId, agentId: agentSession.agentId },
    request,
    input
  );
});

export const delegatedOperation: (
  auth: Auth,
  identity: { userId: string; agentId: string },
  request: { id: string; requestId?: string },
  input?: Record<string, unknown>
) => DelegationEffect = Effect.fn("delegatedOperation")(function* (
  auth: Auth,
  identity: { userId: string; agentId: string },
  request: { id: string; requestId?: string },
  input: Record<string, unknown> = {}
): Effect.fn.Return<
  unknown,
  ApplicationError,
  ApplicationServices | DelegationRepository
> {
  const { id, requestId } = request;
  const operation = operationCatalog[id];
  if (!operation) {
    return yield* Effect.fail(new ApplicationError({ code: "NOT_FOUND" }));
  }
  const metadata = yield* Schema.decodeUnknownEffect(AgentContextInput)(
    input
  ).pipe(
    Effect.mapError(
      () =>
        new ApplicationError({
          code: "BAD_REQUEST",
          message:
            "Provide an organizationId and a valid optional idempotencyKey",
        })
    )
  );
  const organizationId = metadata.organizationId;
  const repository = yield* DelegationRepository;
  const user = yield* repository.user(identity.userId);
  if (!user) {
    return yield* new ApplicationError({ code: "FORBIDDEN" });
  }
  const timestamp = yield* Clock.currentTimeMillis;
  const now = new Date(timestamp);
  return yield* executeProductOperation(
    id,
    operation,
    {
      agentId: identity.agentId,
      requestId,
      delegatedOrganizationId: organizationId,
      authApi: auth.api,
      session: {
        user,
        session: {
          id: `agent:${identity.agentId}`,
          token: "",
          sessionType: "authenticated",
          authMethod: "agent",
          userId: user.id,
          createdAt: now,
          updatedAt: now,
          expiresAt: new Date(timestamp + 60_000),
        },
      },
      isIdentified: false,
      identifiedOrgId: null,
    },
    input
  );
});
