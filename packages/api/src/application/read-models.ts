import { Effect, Schema } from "effect";
import { Organization, Organizations } from "../contracts/outputs";
import { Authorization } from "./authorization";
import { changelogOperations } from "./changelog";
import { ApplicationError, applicationError } from "./errors";
import { feedbackOperations } from "./feedback";
import * as access from "./policies/access";
import type { ApplicationContext } from "./procedure";
import { ConnectionRepository } from "./repositories/connections";
import { DelegationRepository } from "./repositories/delegation";
import { FeedbackRepository } from "./repositories/feedback";
import { OrganizationRepository } from "./repositories/organization";

const organizationBySlug = (slug: string) =>
  Effect.gen(function* () {
    const organization = yield* (yield* OrganizationRepository).bySlug(slug);
    if (!organization) {
      return;
    }
    return yield* Schema.decodeUnknownEffect(Organization)(organization).pipe(
      Effect.mapError(applicationError)
    );
  });

export const readModels = {
  organizationContext: (context: ApplicationContext, slug: string) =>
    Effect.gen(function* () {
      if (!context.session || context.isIdentified) {
        return yield* new ApplicationError({ code: "UNAUTHORIZED" });
      }
      const organization = yield* organizationBySlug(slug);
      if (!organization) {
        return yield* new ApplicationError({ code: "NOT_FOUND" });
      }
      const member = yield* access.membership(
        context.session.user.id,
        organization.id
      );
      if (
        !member ||
        (context.delegatedOrganizationId &&
          context.delegatedOrganizationId !== organization.id)
      ) {
        return yield* new ApplicationError({ code: "NOT_FOUND" });
      }
      return { organization, member, session: context.session };
    }),
  organizationBySlug,
  organizations: (userId: string) =>
    Effect.flatMap(OrganizationRepository, (repository) =>
      repository
        .list(userId)
        .pipe(
          Effect.flatMap(Schema.decodeUnknownEffect(Organizations)),
          Effect.mapError(applicationError)
        )
    ),
  user: (userId: string) =>
    Effect.flatMap(DelegationRepository, (repository) =>
      repository.user(userId)
    ),
  membership: (userId: string, organizationId: string) =>
    Effect.flatMap(Authorization, (repository) =>
      repository.membership(userId, organizationId)
    ),
  activeOAuth: (
    userId: string,
    clientId: string,
    organizationId: string,
    issuedAt: number
  ) =>
    Effect.flatMap(ConnectionRepository, (repository) =>
      repository.activeOAuth(userId, clientId, organizationId, issuedAt)
    ),
  publishedReleases: (
    context: ApplicationContext,
    organizationId: string,
    limit: number
  ) =>
    changelogOperations.getAll.execute(context, {
      organizationId,
      published: true,
      limit,
    }),
  feedbackThread: Effect.fn("readModels.feedbackThread")(function* (
    context: ApplicationContext,
    organizationId: string,
    postId: string
  ) {
    const post = yield* feedbackOperations.getById.execute(context, {
      id: postId,
    });
    if (post.post.organizationId !== organizationId) {
      return yield* new ApplicationError({ code: "NOT_FOUND" });
    }
    const comments = yield* feedbackOperations.getComments.execute(context, {
      postId,
    });
    const userId = context.session?.user.id;
    const isAdmin =
      userId && !context.isIdentified
        ? yield* access.isAdmin(userId, organizationId)
        : false;
    const canModify = userId
      ? yield* access.canModify(post.post, userId, !context.isIdentified)
      : false;
    const hasUserVoted = userId
      ? yield* (yield* FeedbackRepository).hasVote(postId, userId)
      : false;
    return { post, comments, isAdmin, canModify, hasUserVoted };
  }),
};
