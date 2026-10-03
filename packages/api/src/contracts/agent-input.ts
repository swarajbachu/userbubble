import { Schema } from "effect";
import { ResourceId } from "./inputs";

export const IdempotencyKey = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(128)
);
export const AgentContextInput = Schema.Struct({
  organizationId: ResourceId,
  idempotencyKey: Schema.optionalKey(IdempotencyKey),
});

/** Credential responses contain a one-time secret and cannot be replayed. */
export const allowsIdempotency = (id: string, kind: "query" | "mutation") =>
  kind === "mutation" && !id.startsWith("apiKey.");
