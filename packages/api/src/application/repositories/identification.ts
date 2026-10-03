import { Context, type Effect } from "effect";
import type { ApplicationError } from "../errors";

type Result<A> = Effect.Effect<A, ApplicationError>;
export type IdentifiedCustomer = {
  externalId: string;
  email: string;
  name: string | null;
  avatar: string | null;
};
export class IdentificationRepository extends Context.Service<
  IdentificationRepository,
  {
    validateKey: (key: string) => Result<{
      keyId: string;
      organizationId: string;
      organizationSlug: string;
    } | null>;
    touchKey: (id: string) => Result<void>;
    upsert: (
      input: IdentifiedCustomer & { organizationId: string }
    ) => Result<IdentifiedCustomer | undefined>;
  }
>()("userbubble/IdentificationRepository") {}
