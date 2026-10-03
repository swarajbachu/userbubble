import { Context, type Effect, type Schema } from "effect";
import type {
  FeedbackCommentInput,
  FeedbackCreateInput,
  FeedbackListInput,
  FeedbackSearchInput,
  FeedbackUpdateInput,
} from "../../contracts/inputs";
import type {
  CommentDetail,
  Comments,
  FeedbackDetail,
  FeedbackList,
  FeedbackPage,
  FeedbackPost,
} from "../../contracts/outputs";
import type { ApplicationError } from "../errors";

type Result<A> = Effect.Effect<A, ApplicationError>;
type Post = Schema.Schema.Type<typeof FeedbackPost>;
type Comment = Schema.Schema.Type<typeof CommentDetail>["comment"];
export class FeedbackRepository extends Context.Service<
  FeedbackRepository,
  {
    search: (
      organizationId: string,
      options: Schema.Schema.Type<typeof FeedbackSearchInput>
    ) => Result<Schema.Schema.Type<typeof FeedbackPage>>;
    list: (
      organizationId: string,
      options: Omit<
        Schema.Schema.Type<typeof FeedbackListInput>,
        "organizationId"
      > & { userId?: string; includeOrganizationPrivate?: boolean }
    ) => Result<Schema.Schema.Type<typeof FeedbackList>>;
    find: (
      id: string
    ) => Result<Schema.Schema.Type<typeof FeedbackDetail> | undefined>;
    create: (
      input: Schema.Schema.Type<typeof FeedbackCreateInput> & {
        authorId: string | null;
        status: Post["status"];
        voteCount: number;
      }
    ) => Result<Post | undefined>;
    update: (
      id: string,
      patch: Omit<
        Schema.Schema.Type<typeof FeedbackUpdateInput>,
        "id" | "expectedRevision"
      >,
      revision?: number
    ) => Result<Post | undefined>;
    delete: (id: string) => Result<void>;
    hasVote: (postId: string, userId: string) => Result<boolean>;
    vote: (input: {
      postId: string;
      userId: string | null;
      sessionId: string | null;
      value: number;
    }) => Result<void>;
    removeVote: (
      postId: string,
      userId: string | null,
      sessionId: string | null
    ) => Result<void>;
    comments: (
      postId: string,
      organizationId: string
    ) => Result<Schema.Schema.Type<typeof Comments>>;
    findComment: (id: string) => Result<Comment | undefined>;
    createComment: (
      input: Omit<
        Schema.Schema.Type<typeof FeedbackCommentInput>,
        "authorName"
      > & { authorId: string | null; authorName?: string | null }
    ) => Result<Comment | undefined>;
    deleteComment: (id: string) => Result<void>;
  }
>()("userbubble/FeedbackRepository") {}
