import { Context, type Effect } from "effect";
import type { ApplicationError } from "../errors";
import type { ApplicationContext } from "../procedure";

export type ReceiptOptions = {
  actorId: string;
  organizationId: string;
  operation: string;
  key: string;
  input: unknown;
};
export type AuditRecord = {
  id: string;
  organizationId: string | null;
  actorId: string;
  agentId: string | null;
  operation: string;
  outcome: "success" | "failure";
  requestId: string;
  resourceId?: string;
};
export class DelegationRepository extends Context.Service<
  DelegationRepository,
  {
    user: (
      id: string
    ) => Effect.Effect<
      NonNullable<ApplicationContext["session"]>["user"] | undefined,
      ApplicationError
    >;
    uuid: Effect.Effect<string>;
    audit: (record: AuditRecord) => Effect.Effect<void, ApplicationError>;
    transaction: <A, R>(
      work: Effect.Effect<A, ApplicationError, R>
    ) => Effect.Effect<A, ApplicationError, R>;
    withReceipt: <A, R>(
      options: ReceiptOptions,
      work: Effect.Effect<A, ApplicationError, R>
    ) => Effect.Effect<A, ApplicationError, R>;
  }
>()("userbubble/DelegationRepository") {}
