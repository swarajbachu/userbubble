const MANAGEMENT_PATH =
  /^(\/organization\/|\/oauth2\/|\/agent\/|\/host\/|\/capability\/|\/admin\/|\/update-user$|\/delete-user$|\/change-password$|\/set-password$|\/change-email$|\/link-social$|\/unlink-account$)/;

import type { BetterAuthPlugin } from "better-auth";
import { APIError } from "better-auth";
import { createAuthMiddleware, getSessionFromCtx } from "better-auth/api";

/** Embed sessions can participate in feedback, but cannot become account or workspace credentials. */
export function managementSessionGuard() {
  return {
    id: "management-session-guard",
    hooks: {
      before: [
        {
          matcher: (ctx) => MANAGEMENT_PATH.test(ctx.path ?? ""),
          handler: createAuthMiddleware(async (ctx) => {
            const session = await getSessionFromCtx(ctx);
            if (session?.session.sessionType === "identified") {
              throw new APIError("FORBIDDEN", {
                message:
                  "Use a full UserBubble account to manage workspace access",
              });
            }
          }),
        },
      ],
    },
  } satisfies BetterAuthPlugin;
}
