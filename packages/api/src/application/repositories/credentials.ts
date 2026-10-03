import { Context, type Effect, type Schema } from "effect";
import type {
  ApiKeyCreateInput,
  ApiKeyUpdateInput,
} from "../../contracts/inputs";
import type {
  ApiKeySummary,
  ApiKeys,
  CreatedApiKey,
} from "../../contracts/outputs";
import type { ApplicationError } from "../errors";

type Result<A> = Effect.Effect<A, ApplicationError>;
type Key = Schema.Schema.Type<typeof ApiKeySummary>;
export class CredentialRepository extends Context.Service<
  CredentialRepository,
  {
    list: (
      organizationId: string
    ) => Result<Schema.Schema.Type<typeof ApiKeys>>;
    countActive: (organizationId: string) => Result<number>;
    create: (
      input: Schema.Schema.Type<typeof ApiKeyCreateInput>
    ) => Result<Schema.Schema.Type<typeof CreatedApiKey> | undefined>;
    find: (id: string) => Result<Key | undefined>;
    update: (
      id: string,
      patch: Omit<Schema.Schema.Type<typeof ApiKeyUpdateInput>, "id">
    ) => Result<Key | undefined>;
    toggle: (id: string, active: boolean) => Result<Key | undefined>;
    delete: (id: string) => Result<void>;
  }
>()("userbubble/CredentialRepository") {}
