import { Context, type Effect } from "effect";
import type { ApplicationError } from "../errors";

type Result<A> = Effect.Effect<A, ApplicationError>;
export class PublicIndexRepository extends Context.Service<
  PublicIndexRepository,
  {
    organizations: () => Result<{ slug: string }[]>;
    counts: (
      organizationId: string
    ) => Result<{ feedback: number; changelog: number }>;
    items: (
      organizationId: string,
      kind: "feedback" | "changelog",
      page: number
    ) => Result<{ id: string; updatedAt: Date }[]>;
  }
>()("userbubble/PublicIndexRepository") {}
