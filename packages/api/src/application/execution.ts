import { Effect, Result, Schema } from "effect";
import { allowsIdempotency, IdempotencyKey } from "../contracts/agent-input";
import { ResourceId } from "../contracts/inputs";
import { Authorization } from "./authorization";
import { operationDeadline } from "./deadline";
import { ApplicationError, applicationError } from "./errors";
import {
  type ApplicationContext,
  normalizeInput,
  type Operation,
} from "./procedure";
import { ChangelogRepository } from "./repositories/changelog";
import { CredentialRepository } from "./repositories/credentials";
import { DelegationRepository } from "./repositories/delegation";
import { FeedbackRepository } from "./repositories/feedback";

const Metadata = Schema.Struct({
  organizationId: Schema.optionalKey(ResourceId),
  idempotencyKey: Schema.optionalKey(IdempotencyKey),
});

/** Resolve resource ownership before recording a caller-supplied organization. */
const resourceOrganization = Effect.fn("execution.resourceOrganization")(
  function* (id: string, input: Record<string, unknown>) {
    if (id.startsWith("feedback.") && (input.postId || input.id)) {
      const repository = yield* FeedbackRepository;
      const postId =
        id === "feedback.deleteComment"
          ? (yield* repository.findComment(String(input.id)))?.postId
          : String(input.postId ?? input.id);
      return postId
        ? (yield* repository.find(postId))?.post.organizationId
        : undefined;
    }
    if (id.startsWith("changelog.") && (input.entryId || input.id)) {
      return (yield* (yield* ChangelogRepository).find(
        String(input.entryId ?? input.id)
      ))?.organizationId;
    }
    if (id.startsWith("apiKey.") && input.id) {
      return (yield* (yield* CredentialRepository).find(String(input.id)))
        ?.organizationId;
    }
    return;
  }
);

/** Common management boundary. Anonymous/installation traffic retains its public contract. */
export const executeProductOperation = <I, O>(
  id: string,
  operation: Operation<I, O>,
  context: ApplicationContext,
  rawInput: unknown
) =>
  Effect.gen(function* () {
    if (!context.session || context.isIdentified) {
      const publicWork = operation.execute(context, rawInput);
      return yield* operation.kind === "query"
        ? operationDeadline(publicWork)
        : publicWork;
    }
    const repository = yield* DelegationRepository;
    const requestId = context.requestId ?? (yield* repository.uuid);
    const userId = context.session.user.id;
    let organizationId: string | null = context.delegatedOrganizationId ?? null;
    let resourceId: string | undefined;
    const audit = (outcome: "success" | "failure") =>
      Effect.gen(function* () {
        yield* repository.audit({
          id: yield* repository.uuid,
          organizationId,
          actorId: userId,
          agentId: context.agentId ?? null,
          operation: id,
          outcome,
          requestId,
          ...(resourceId ? { resourceId } : {}),
        });
      });
    const result = yield* Effect.result(
      Effect.gen(function* () {
        if (
          !rawInput ||
          typeof rawInput !== "object" ||
          Array.isArray(rawInput)
        ) {
          return yield* new ApplicationError({ code: "BAD_REQUEST" });
        }
        const input = rawInput as Record<string, unknown>;
        const headerKey = context.headers?.get("idempotency-key");
        if (
          headerKey &&
          input.idempotencyKey !== undefined &&
          input.idempotencyKey !== headerKey
        ) {
          return yield* new ApplicationError({
            code: "BAD_REQUEST",
            message: "Conflicting idempotency keys",
          });
        }
        const metadata = yield* Schema.decodeUnknownEffect(Metadata)({
          ...input,
          ...(headerKey !== null && headerKey !== undefined
            ? { idempotencyKey: headerKey }
            : {}),
        }).pipe(
          Effect.mapError(
            () =>
              new ApplicationError({
                code: "BAD_REQUEST",
                message: "Invalid execution metadata",
              })
          )
        );
        if (metadata.idempotencyKey && !allowsIdempotency(id, operation.kind)) {
          return yield* new ApplicationError({
            code: "BAD_REQUEST",
            message: "This operation does not accept idempotency keys",
          });
        }
        if (
          context.delegatedOrganizationId &&
          metadata.organizationId !== undefined &&
          metadata.organizationId !== context.delegatedOrganizationId
        ) {
          return yield* new ApplicationError({ code: "FORBIDDEN" });
        }
        if (
          metadata.idempotencyKey &&
          !metadata.organizationId &&
          !id.startsWith("account.") &&
          !id.startsWith("connection.") &&
          id !== "organization.create"
        ) {
          return yield* new ApplicationError({
            code: "BAD_REQUEST",
            message: "Select organizationId when using an idempotency key",
          });
        }
        const decodedInput = yield* Schema.decodeUnknownEffect(
          operation.inputContract
        )(normalizeInput(input)).pipe(
          Effect.mapError(
            () =>
              new ApplicationError({
                code: "BAD_REQUEST",
                message: "Invalid operation input",
              })
          )
        );
        const businessInput = decodedInput as Record<string, unknown>;
        const actualOrganization = yield* resourceOrganization(
          id,
          businessInput
        );
        if (
          actualOrganization &&
          metadata.organizationId &&
          actualOrganization !== metadata.organizationId
        ) {
          return yield* new ApplicationError({ code: "NOT_FOUND" });
        }
        organizationId =
          actualOrganization ??
          context.delegatedOrganizationId ??
          metadata.organizationId ??
          null;
        const resource =
          id.startsWith("account.") || id.startsWith("connection.")
            ? undefined
            : (businessInput.postId ??
              businessInput.entryId ??
              businessInput.id);
        resourceId = typeof resource === "string" ? resource : undefined;
        const membership = organizationId
          ? yield* (yield* Authorization).membership(userId, organizationId)
          : undefined;
        if (
          (context.agentId ||
            operation.access === "member" ||
            operation.access === "admin") &&
          !membership
        ) {
          return yield* new ApplicationError({ code: "FORBIDDEN" });
        }
        if (operation.access === "admin" && membership?.role === "member") {
          return yield* new ApplicationError({ code: "FORBIDDEN" });
        }
        if (
          metadata.organizationId &&
          !membership &&
          operation.access === "authenticated"
        ) {
          return yield* new ApplicationError({ code: "FORBIDDEN" });
        }
        // A user must retain the same organization authority for a cached result.
        // Changes cause a conflict, never a replay with stale authority.
        const authority = membership
          ? { id: membership.id, role: membership.role }
          : null;
        const work = operation.execute({ ...context, requestId }, input);
        const execute = Effect.gen(function* () {
          let value: O;
          if (metadata.idempotencyKey && operation.output) {
            const codec = Schema.toCodecJson(operation.output);
            const canonicalInput = yield* Schema.encodeEffect(
              Schema.toCodecJson(operation.inputContract)
            )(decodedInput).pipe(Effect.mapError(applicationError));
            const encoded = yield* repository.withReceipt(
              {
                actorId: context.agentId
                  ? `agent:${context.agentId}`
                  : `user:${userId}`,
                organizationId: organizationId ?? `account:${userId}`,
                operation: id,
                key: metadata.idempotencyKey,
                input: {
                  input: canonicalInput,
                  authority,
                },
              },
              work.pipe(
                Effect.flatMap(Schema.encodeEffect(codec)),
                Effect.mapError(applicationError)
              )
            );
            value = yield* Schema.decodeUnknownEffect(codec)(encoded).pipe(
              Effect.mapError(applicationError)
            );
          } else {
            value = yield* work;
          }
          yield* audit("success");
          return value;
        });
        // The product write, receipt, and successful audit commit or roll back together.
        return yield* operation.kind === "mutation"
          ? repository.transaction(operationDeadline(execute))
          : operationDeadline(execute);
      })
    );
    if (Result.isFailure(result)) {
      yield* Effect.result(audit("failure"));
      return yield* Effect.fail(result.failure);
    }
    return result.success;
  });
