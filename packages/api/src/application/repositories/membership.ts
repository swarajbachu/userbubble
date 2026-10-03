import { Context, type Effect, type Schema } from "effect";
import type { MemberRole, Members, Success } from "../../contracts/outputs";
import type { ApplicationError } from "../errors";

export class MembershipRepository extends Context.Service<
  MembershipRepository,
  {
    list: (
      organizationId: string
    ) => Effect.Effect<Schema.Schema.Type<typeof Members>, ApplicationError>;
    change: (input: {
      organizationId: string;
      actorId: string;
      memberId: string;
      role?: Schema.Schema.Type<typeof MemberRole>;
      remove?: boolean;
    }) => Effect.Effect<Schema.Schema.Type<typeof Success>, ApplicationError>;
  }
>()("userbubble/MembershipRepository") {}
