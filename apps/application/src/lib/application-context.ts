import type { ApplicationContext } from "@userbubble/api/management";
import { cache } from "react";
import { auth, getSession } from "~/auth/server";

export const getApplicationContext = cache(
  async (): Promise<ApplicationContext> => {
    const session = await getSession();
    const isIdentified = session?.session.sessionType === "identified";
    return {
      authApi: auth.api,
      session,
      isIdentified,
      identifiedOrgId: isIdentified
        ? (session?.session.activeOrganizationId ?? null)
        : null,
    };
  }
);
