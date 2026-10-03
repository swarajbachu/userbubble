import { Context, type Effect } from "effect";
import type { ApplicationError } from "./errors";

export type Membership = {
  id: string;
  role: "owner" | "admin" | "member";
  organizationId: string;
  userId: string;
};
export class Authorization extends Context.Service<
  Authorization,
  {
    membership: (
      userId: string,
      organizationId: string
    ) => Effect.Effect<Membership | undefined, ApplicationError>;
  }
>()("userbubble/Authorization") {}
