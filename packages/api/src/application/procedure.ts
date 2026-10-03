import type { Auth } from "@userbubble/auth";
import { Effect, Schema } from "effect";
import { z } from "zod";
import { EmptyInput, OrganizationInput } from "../contracts/inputs";
import { Authorization } from "./authorization";
import { ApplicationError, applicationError } from "./errors";
import type { ChangelogRepository } from "./repositories/changelog";
import type { ConnectionRepository } from "./repositories/connections";
import type { CredentialRepository } from "./repositories/credentials";
import type { FeedbackRepository } from "./repositories/feedback";
import type { MembershipRepository } from "./repositories/membership";
import type { OrganizationRepository } from "./repositories/organization";
import type { ProfileRepository } from "./repositories/profile";
import type { PublicIndexRepository } from "./repositories/public-index";
import type { ReferenceRepository } from "./repositories/references";

export type ApplicationContext = {
  authApi: Auth["api"];
  headers?: Headers;
  requestId?: string;
  agentId?: string;
  delegatedOrganizationId?: string;
  session: Awaited<ReturnType<Auth["api"]["getSession"]>>;
  identifiedOrgId: string | null;
  isIdentified: boolean;
};
type AuthenticatedContext = ApplicationContext & {
  session: NonNullable<ApplicationContext["session"]>;
};
type OrganizationContext = AuthenticatedContext & {
  org: { id: string; memberId: string; role: "owner" | "admin" | "member" };
};
export type Access =
  | "public"
  | "authenticated"
  | "identified"
  | "member"
  | "admin";
export type ApplicationServices =
  | Authorization
  | ProfileRepository
  | ReferenceRepository
  | OrganizationRepository
  | MembershipRepository
  | CredentialRepository
  | ConnectionRepository
  | PublicIndexRepository
  | ChangelogRepository
  | FeedbackRepository;

export type Operation<I, O> = {
  input: z.ZodType<I, I>;
  output?: Schema.Codec<O, unknown>;
  inputContract: Schema.Codec<I, unknown>;
  access: Access;
  kind: "query" | "mutation";
  execute: (
    context: ApplicationContext,
    input: unknown
  ) => Effect.Effect<O, ApplicationError, ApplicationServices>;
};

/** Validate and project outputs before any transport can serialize them. */
function withOutput<I, O>(
  operation: Operation<I, O>,
  output: Schema.Codec<O, unknown>
): Operation<I, O> {
  return {
    ...operation,
    output,
    execute: (context, input) =>
      operation.execute(context, input).pipe(
        Effect.flatMap((result) =>
          Schema.decodeUnknownEffect(output)(result).pipe(
            Effect.mapError(
              () =>
                new ApplicationError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "Operation returned an invalid result",
                })
            )
          )
        )
      ),
  };
}

type Handler<C, I, O> = (args: {
  ctx: C;
  input: I;
}) => Effect.Effect<O, ApplicationError, ApplicationServices>;
type Procedure<C extends ApplicationContext, I> = {
  effectInput<J extends I>(contract: Schema.Codec<J, unknown>): Procedure<C, J>;
  output<O>(schema: Schema.Codec<O, unknown>): {
    query(handler: Handler<C, I, O>): Operation<I, O>;
    mutation(handler: Handler<C, I, O>): Operation<I, O>;
  };
  query<O>(handler: Handler<C, I, O>): Operation<I, O>;
  mutation<O>(handler: Handler<C, I, O>): Operation<I, O>;
};

// SuperJSON preserves explicit undefined properties; JSON omits them.
// Normalize object properties so both transports use the same optional inputs.
export function normalizeInput(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeInput);
  }
  if (
    value === null ||
    typeof value !== "object" ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, field]) => field !== undefined)
      .map(([key, field]) => [key, normalizeInput(field)])
  );
}

function procedure<C extends ApplicationContext, I>(
  access: Access,
  inputContract: Schema.Codec<I, unknown>
): Procedure<C, I> {
  // tRPC parser compatibility delegates to the same Effect contract.
  const schema = z.unknown().transform((value, ctx) => {
    try {
      const normalized = normalizeInput(value ?? {});
      const decoded = Schema.decodeUnknownSync(inputContract)(normalized);
      // Retain execution metadata for the common boundary; business handlers
      // still receive only the fields declared by their Effect input contract.
      if (
        normalized &&
        typeof normalized === "object" &&
        decoded &&
        typeof decoded === "object"
      ) {
        const metadata = normalized as Record<string, unknown>;
        return {
          ...decoded,
          ...(metadata.organizationId !== undefined
            ? { organizationId: metadata.organizationId }
            : {}),
          ...(metadata.idempotencyKey !== undefined
            ? { idempotencyKey: metadata.idempotencyKey }
            : {}),
        };
      }
      return decoded;
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid operation input" });
      return z.NEVER;
    }
  });
  const create = <O>(
    kind: "query" | "mutation",
    handler: Handler<C, I, O>
  ): Operation<I, O> => ({
    input: schema as z.ZodType<I, I>,
    inputContract,
    access,
    kind,
    execute: (context, rawInput) =>
      Effect.gen(function* () {
        const input = yield* Schema.decodeUnknownEffect(inputContract)(
          normalizeInput(rawInput ?? {})
        ).pipe(
          Effect.mapError(
            () =>
              new ApplicationError({
                code: "BAD_REQUEST",
                message: "Invalid operation input",
              })
          )
        );
        if (access !== "public" && !context.session) {
          return yield* Effect.fail(
            new ApplicationError({ code: "UNAUTHORIZED" })
          );
        }
        if (
          ["authenticated", "member", "admin"].includes(access) &&
          context.isIdentified
        ) {
          return yield* Effect.fail(
            new ApplicationError({ code: "FORBIDDEN" })
          );
        }
        let ctx: ApplicationContext | OrganizationContext = context;
        if (access === "member" || access === "admin") {
          if (!context.session) {
            return yield* Effect.fail(
              new ApplicationError({ code: "UNAUTHORIZED" })
            );
          }
          const organizationId = (input as { organizationId: string })
            .organizationId;
          const authorization = yield* Authorization;
          const membership = yield* authorization.membership(
            context.session.user.id,
            organizationId
          );
          if (
            !membership ||
            (access === "admin" && membership.role === "member")
          ) {
            return yield* Effect.fail(
              new ApplicationError({ code: "FORBIDDEN" })
            );
          }
          ctx = {
            ...context,
            session: context.session,
            org: {
              id: organizationId,
              memberId: membership.id,
              role: membership.role,
            },
          };
        }
        const result = yield* Effect.try({
          try: () => handler({ ctx: ctx as C, input }),
          catch: applicationError,
        });
        return yield* result;
      }),
  });
  return {
    effectInput: <J extends I>(contract: Schema.Codec<J, unknown>) =>
      procedure<C, J>(access, contract),
    output: <O>(output: Schema.Codec<O, unknown>) => ({
      query: (handler: Handler<C, I, O>) =>
        withOutput(create("query", handler), output),
      mutation: (handler: Handler<C, I, O>) =>
        withOutput(create("mutation", handler), output),
    }),
    query: <O>(handler: Handler<C, I, O>) => create("query", handler),
    mutation: <O>(handler: Handler<C, I, O>) => create("mutation", handler),
  };
}
export const publicProcedure = procedure<
  ApplicationContext,
  Record<never, never>
>("public", EmptyInput);
export const protectedProcedure = procedure<
  AuthenticatedContext,
  Record<never, never>
>("authenticated", EmptyInput);
export const identifiedProcedure = procedure<
  AuthenticatedContext,
  Record<never, never>
>("identified", EmptyInput);
export const orgProcedure = procedure<
  OrganizationContext,
  { organizationId: string }
>("member", OrganizationInput);
export const orgAdminProcedure = procedure<
  OrganizationContext,
  { organizationId: string }
>("admin", OrganizationInput);

export function assertOrgAccess(
  ctx: Pick<ApplicationContext, "isIdentified" | "identifiedOrgId">,
  organizationId: string
) {
  if (ctx.isIdentified && ctx.identifiedOrgId !== organizationId) {
    throw new ApplicationError({ code: "FORBIDDEN" });
  }
}
