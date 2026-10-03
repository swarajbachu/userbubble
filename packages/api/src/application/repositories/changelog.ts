import { Context, type Effect, type Schema } from "effect";
import type {
  ChangelogCreateInput,
  ChangelogListInput,
  ChangelogUpdateInput,
} from "../../contracts/inputs";
import type {
  ChangelogDetail,
  ChangelogEntry,
  ChangelogLinks,
  LinkedFeedback,
} from "../../contracts/outputs";
import type { ApplicationError } from "../errors";

type Result<A> = Effect.Effect<A, ApplicationError>;
type Detail = Schema.Schema.Type<typeof ChangelogDetail>;
type Entry = Schema.Schema.Type<typeof ChangelogEntry>;
export class ChangelogRepository extends Context.Service<
  ChangelogRepository,
  {
    list: (
      organizationId: string,
      options: Omit<
        Schema.Schema.Type<typeof ChangelogListInput>,
        "organizationId"
      >
    ) => Result<Omit<Detail, "linkedFeedback">[]>;
    find: (id: string) => Result<Detail | null>;
    linkedFeedback: (
      id: string
    ) => Result<readonly Schema.Schema.Type<typeof LinkedFeedback>[]>;
    postOrganization: (id: string) => Result<string | undefined>;
    create: (
      input: Schema.Schema.Type<typeof ChangelogCreateInput> & {
        authorId: string;
        publishedAt?: Date;
      }
    ) => Result<Entry>;
    save: (
      id: string,
      organizationId: string,
      patch: Omit<
        Schema.Schema.Type<typeof ChangelogUpdateInput>,
        "organizationId" | "id"
      >
    ) => Result<Entry | undefined>;
    publish: (
      id: string,
      expectedRevision?: number
    ) => Result<Entry | undefined>;
    delete: (id: string, expectedRevision?: number) => Result<boolean>;
    link: (
      id: string,
      postIds: readonly string[],
      expectedRevision?: number
    ) => Result<Schema.Schema.Type<typeof ChangelogLinks>>;
    unlink: (
      id: string,
      postIds: readonly string[],
      expectedRevision?: number
    ) => Result<void>;
  }
>()("userbubble/ChangelogRepository") {}
