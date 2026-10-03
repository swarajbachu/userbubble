import { Context, type Effect, type Schema } from "effect";
import type { Connections, OAuthConnections } from "../../contracts/outputs";
import type { ApplicationError } from "../errors";
import type { ApplicationContext } from "../procedure";

type Result<A> = Effect.Effect<A, ApplicationError>;
export type ApprovalRequest = {
  id: string;
  name: string;
  grants: { capability: string; constraints: string | null }[];
};
export class ConnectionRepository extends Context.Service<
  ConnectionRepository,
  {
    activeOAuth: (
      userId: string,
      clientId: string,
      organizationId: string,
      issuedAt: number
    ) => Result<boolean>;
    list: (userId: string) => Result<Schema.Schema.Type<typeof Connections>>;
    listOAuth: (
      userId: string
    ) => Result<Schema.Schema.Type<typeof OAuthConnections>>;
    revoke: (userId: string, agentId: string) => Result<boolean>;
    revokeOAuth: (userId: string, consentId: string) => Result<boolean>;
    approval: (
      userId: string,
      agentId: string,
      code: string
    ) => Result<ApprovalRequest | null>;
    respond: (
      context: ApplicationContext,
      agentId: string,
      code: string,
      action: "approve" | "deny"
    ) => Result<
      Awaited<ReturnType<ApplicationContext["authApi"]["approveCapability"]>>
    >;
  }
>()("userbubble/ConnectionRepository") {}
