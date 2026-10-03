import type { AgentSession, Auth } from "@userbubble/auth";
import { Effect, Layer, ManagedRuntime, Result } from "effect";
import { authorizationLive } from "../infrastructure/authorization";
import { changelogRepositoryLive } from "../infrastructure/changelog";
import { connectionRepositoryLive } from "../infrastructure/connections";
import { credentialRepositoryLive } from "../infrastructure/credentials";
import { databaseLifetime } from "../infrastructure/database-lifetime";
import { delegationRepositoryLive } from "../infrastructure/delegation";
import { feedbackRepositoryLive } from "../infrastructure/feedback";
import { identificationRepositoryLive } from "../infrastructure/identification";
import { membershipRepositoryLive } from "../infrastructure/membership";
import { organizationRepositoryLive } from "../infrastructure/organization";
import { profileRepositoryLive } from "../infrastructure/profile";
import { publicIndexRepositoryLive } from "../infrastructure/public-index";
import { referenceRepositoryLive } from "../infrastructure/references";
import { operationCatalog } from "./catalog";
import { operationDeadline } from "./deadline";
import { agentOperation, delegatedOperation } from "./delegation";
import { executeProductOperation } from "./execution";
import { identifyCustomer } from "./identification";
import type { ApplicationContext, Operation } from "./procedure";
import { readModels } from "./read-models";
import type { IdentificationRepository } from "./repositories/identification";

const applicationLive = Layer.mergeAll(
  databaseLifetime,
  authorizationLive,
  identificationRepositoryLive,
  profileRepositoryLive,
  referenceRepositoryLive,
  organizationRepositoryLive,
  membershipRepositoryLive,
  credentialRepositoryLive,
  connectionRepositoryLive,
  publicIndexRepositoryLive,
  changelogRepositoryLive,
  feedbackRepositoryLive,
  delegationRepositoryLive
);

const runtime = ManagedRuntime.make(applicationLive);
export const disposeApplicationRuntime = () => runtime.dispose();

/** Promise execution belongs at framework and protocol boundaries. */
async function run<A>(
  program: Effect.Effect<
    A,
    import("./errors").ApplicationError,
    | IdentificationRepository
    | import("./procedure").ApplicationServices
    | import("./repositories/delegation").DelegationRepository
  >
): Promise<A> {
  const result = await runtime.runPromise(Effect.result(program));
  if (Result.isFailure(result)) {
    throw result.failure;
  }
  return result.success;
}
/** Read compositions have one overall bound in addition to per-statement limits. */
function runRead<A>(program: Parameters<typeof run<A>>[0]): Promise<A> {
  return run(operationDeadline(program));
}

export function executeOperation<I, O>(
  operation: Operation<I, O>,
  context: ApplicationContext,
  input: unknown
): Promise<O> {
  const id = Object.keys(operationCatalog).find(
    (key) => operationCatalog[key] === operation
  );
  return run(
    id
      ? executeProductOperation(id, operation, context, input ?? {})
      : operation.execute(context, input)
  );
}
export function executeDelegatedOperation(
  auth: Auth,
  identity: { userId: string; agentId: string },
  request: { id: string; requestId?: string },
  input: Record<string, unknown> = {}
) {
  return run(delegatedOperation(auth, identity, request, input));
}
export function executeAgentOperation(
  auth: Auth,
  agentSession: AgentSession,
  request: { id: string; requestId?: string },
  input: Record<string, unknown> = {}
) {
  return run(agentOperation(auth, agentSession, request, input));
}

/** Internal server read adapters; callers supply identities from verified sessions. */
export const serverReads = {
  organizationContext: (context: ApplicationContext, slug: string) =>
    runRead(readModels.organizationContext(context, slug)),
  organizationBySlug: (slug: string) =>
    runRead(readModels.organizationBySlug(slug)),
  organizations: (userId: string) => runRead(readModels.organizations(userId)),
  user: (userId: string) => runRead(readModels.user(userId)),
  membership: (userId: string, organizationId: string) =>
    runRead(readModels.membership(userId, organizationId)),
  activeOAuth: (
    userId: string,
    clientId: string,
    organizationId: string,
    issuedAt: number
  ) =>
    runRead(readModels.activeOAuth(userId, clientId, organizationId, issuedAt)),
  publishedReleases: (
    context: ApplicationContext,
    organizationId: string,
    limit: number
  ) => runRead(readModels.publishedReleases(context, organizationId, limit)),
  feedbackThread: (
    context: ApplicationContext,
    organizationId: string,
    postId: string
  ) => runRead(readModels.feedbackThread(context, organizationId, postId)),
};

export const executeIdentification = (key: string, input: unknown) =>
  run(identifyCustomer(key, input));
