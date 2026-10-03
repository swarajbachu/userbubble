import { Schema } from "effect";

export const ErrorCode = Schema.Literals([
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "TOO_MANY_REQUESTS",
  "INTERNAL_SERVER_ERROR",
  "TIMEOUT",
  "SERVICE_UNAVAILABLE",
]);
export type ErrorCode = Schema.Schema.Type<typeof ErrorCode>;

export class ApplicationError extends Schema.TaggedError<ApplicationError>()(
  "ApplicationError",
  {
    code: ErrorCode,
    message: Schema.String,
  }
) {
  constructor(options: { code: ErrorCode; message?: string }) {
    super({ code: options.code, message: options.message ?? options.code });
  }
}

const transientDatabaseCodes = new Set([
  "40001",
  "40P01",
  "53300",
  "57P01",
  "57P02",
  "57P03",
  "08000",
  "08001",
  "08003",
  "08004",
  "08006",
  "08007",
  "08P01",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "EPIPE",
]);

export function applicationError(cause: unknown): ApplicationError {
  if (cause instanceof ApplicationError) {
    return cause;
  }
  // Drizzle wraps driver failures in `cause`. Inspect only known codes;
  // never expose SQL, credentials, payloads or driver messages.
  let current = cause;
  for (
    let depth = 0;
    depth < 8 && current && typeof current === "object";
    depth++
  ) {
    const code = "code" in current ? current.code : undefined;
    if (code === "57014" || code === "55P03") {
      return new ApplicationError({
        code: "TIMEOUT",
        message:
          "The database operation timed out. Retry with the same idempotency key when supported.",
      });
    }
    if (typeof code === "string" && transientDatabaseCodes.has(code)) {
      return new ApplicationError({
        code: "SERVICE_UNAVAILABLE",
        message:
          "The database is temporarily unavailable. Retry with the same idempotency key when supported.",
      });
    }
    current = "cause" in current ? current.cause : undefined;
  }
  return new ApplicationError({
    code: "INTERNAL_SERVER_ERROR",
    message: "The operation could not be completed",
  });
}
