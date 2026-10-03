import { Context, type Effect, type Schema } from "effect";
import type { UpdateProfileInput } from "../../contracts/inputs";
import type { Profile } from "../../contracts/outputs";
import type { ApplicationError } from "../errors";

export class ProfileRepository extends Context.Service<
  ProfileRepository,
  {
    find: (
      userId: string
    ) => Effect.Effect<
      Schema.Schema.Type<typeof Profile> | undefined,
      ApplicationError
    >;
    update: (
      userId: string,
      patch: Schema.Schema.Type<typeof UpdateProfileInput>
    ) => Effect.Effect<
      Schema.Schema.Type<typeof Profile> | undefined,
      ApplicationError
    >;
  }
>()("userbubble/ProfileRepository") {}
