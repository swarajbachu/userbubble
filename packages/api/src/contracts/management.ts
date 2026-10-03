import { Schema } from "effect";

/** Stable transport envelope; SDK-specific legacy validators stay behind adapters. */
export const ManagementRequest = Schema.Struct({
  operation: Schema.String.check(Schema.isMinLength(1)),
  arguments: Schema.Record(Schema.String, Schema.Unknown),
});
export const FeedbackCursor = Schema.Struct({
  updatedAt: Schema.String,
  id: Schema.String,
});
export const OperationFailure = Schema.Struct({
  code: Schema.Literals([
    "BAD_REQUEST",
    "UNAUTHORIZED",
    "FORBIDDEN",
    "NOT_FOUND",
    "CONFLICT",
    "TOO_MANY_REQUESTS",
    "INTERNAL_SERVER_ERROR",
  ]),
  message: Schema.String,
  requestId: Schema.String,
});
