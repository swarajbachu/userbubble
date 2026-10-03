import { Context, type Effect, type Schema } from "effect";
import type { ReferenceAddInput } from "../../contracts/inputs";
import type { Activity, Reference, References } from "../../contracts/outputs";
import type { ApplicationError } from "../errors";

type Result<A> = Effect.Effect<A, ApplicationError>;
export class ReferenceRepository extends Context.Service<
  ReferenceRepository,
  {
    postOrganization: (postId: string) => Result<string | undefined>;
    list: (postId: string) => Result<Schema.Schema.Type<typeof References>>;
    add: (
      input: Schema.Schema.Type<typeof ReferenceAddInput> & { authorId: string }
    ) => Result<Schema.Schema.Type<typeof Reference> | undefined>;
    delete: (id: string, organizationId: string) => Result<void>;
    activity: (
      organizationId: string
    ) => Result<Schema.Schema.Type<typeof Activity>>;
  }
>()("userbubble/ReferenceRepository") {}
