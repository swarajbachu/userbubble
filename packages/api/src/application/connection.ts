import { Effect } from "effect";
import {
  ApprovalInput,
  ApprovalResponseInput,
  EmptyInput,
  RevokeConnectionInput,
  RevokeOAuthInput,
} from "../contracts/inputs";
import { Connections, OAuthConnections, Success } from "../contracts/outputs";
import { ApplicationError } from "./errors";
import { protectedProcedure } from "./procedure";
import { ConnectionRepository } from "./repositories/connections";
export const connectionOperations = {
  listOAuth: protectedProcedure
    .effectInput(EmptyInput)
    .output(OAuthConnections)
    .query(({ ctx }) =>
      Effect.gen(function* () {
        const repository = yield* ConnectionRepository;
        return (yield* repository.listOAuth(ctx.session.user.id)).filter(
          (item) =>
            !ctx.delegatedOrganizationId ||
            item.organizationId === ctx.delegatedOrganizationId
        );
      })
    ),
  revokeOAuth: protectedProcedure
    .effectInput(RevokeOAuthInput)
    .output(Success)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* ConnectionRepository;
        if (
          ctx.delegatedOrganizationId &&
          !(yield* repository.listOAuth(ctx.session.user.id)).some(
            (item) =>
              item.id === input.consentId &&
              item.organizationId === ctx.delegatedOrganizationId
          )
        ) {
          return yield* Effect.fail(
            new ApplicationError({ code: "NOT_FOUND" })
          );
        }
        if (
          !(yield* repository.revokeOAuth(ctx.session.user.id, input.consentId))
        ) {
          return yield* Effect.fail(
            new ApplicationError({ code: "NOT_FOUND" })
          );
        }
        return { success: true };
      })
    ),
  list: protectedProcedure
    .effectInput(EmptyInput)
    .output(Connections)
    .query(({ ctx }) =>
      Effect.gen(function* () {
        const repository = yield* ConnectionRepository;
        const organizationId = ctx.delegatedOrganizationId;
        const connections = yield* repository.list(ctx.session.user.id);
        if (!organizationId) {
          return connections;
        }
        return connections
          .map((item) => ({
            ...item,
            grants: item.grants.filter((grant) =>
              constrainedTo(grant.constraints, organizationId)
            ),
          }))
          .filter((item) => item.grants.length > 0);
      })
    ),
  revoke: protectedProcedure
    .effectInput(RevokeConnectionInput)
    .output(Success)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* ConnectionRepository;
        const organizationId = ctx.delegatedOrganizationId;
        if (organizationId) {
          const target = (yield* repository.list(ctx.session.user.id)).find(
            (item) => item.id === input.agentId
          );
          if (
            !(
              target?.grants.length &&
              target.grants.every((grant) =>
                constrainedTo(grant.constraints, organizationId)
              )
            )
          ) {
            return yield* Effect.fail(
              new ApplicationError({
                code: "FORBIDDEN",
                message:
                  "This connection has grants outside your authorized workspace",
              })
            );
          }
        }
        if (!(yield* repository.revoke(ctx.session.user.id, input.agentId))) {
          return yield* Effect.fail(
            new ApplicationError({ code: "NOT_FOUND" })
          );
        }
        return { success: true };
      })
    ),
};
// Authentication bootstrap requires the human browser session and is not an agent capability.
export const approvalOperations = {
  get: protectedProcedure.effectInput(ApprovalInput).query(({ ctx, input }) =>
    Effect.gen(function* () {
      const repository = yield* ConnectionRepository;
      if (ctx.agentId) {
        return yield* Effect.fail(new ApplicationError({ code: "FORBIDDEN" }));
      }
      const request = yield* repository.approval(
        ctx.session.user.id,
        input.agentId,
        input.code
      );
      if (!request) {
        return yield* Effect.fail(
          new ApplicationError({
            code: "NOT_FOUND",
            message: "This request is invalid or has expired",
          })
        );
      }
      return request;
    })
  ),
  respond: protectedProcedure
    .effectInput(ApprovalResponseInput)
    .mutation(({ ctx, input }) =>
      Effect.gen(function* () {
        const repository = yield* ConnectionRepository;
        if (ctx.agentId || !ctx.headers) {
          return yield* Effect.fail(
            new ApplicationError({ code: "FORBIDDEN" })
          );
        }
        const request = yield* repository.approval(
          ctx.session.user.id,
          input.agentId,
          input.code
        );
        if (!request) {
          return yield* Effect.fail(
            new ApplicationError({ code: "NOT_FOUND" })
          );
        }
        return yield* repository.respond(
          ctx,
          input.agentId,
          input.code,
          input.action
        );
      })
    ),
};

function constrainedTo(raw: string | null, organizationId: string) {
  try {
    return (
      raw !== null && JSON.parse(raw).organizationId?.eq === organizationId
    );
  } catch {
    return false;
  }
}
