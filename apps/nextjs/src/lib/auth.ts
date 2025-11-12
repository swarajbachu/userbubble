import { initAuth } from "@critichut/auth";
import { cache } from "react";
import { headers } from "next/headers";

import { env } from "~/env";

export const auth = cache(async () => {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  return session;
});

function getAuth() {
  return initAuth({
    baseUrl: env.BETTER_AUTH_URL,
    productionUrl: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    googleClientId: env.AUTH_GOOGLE_ID,
    googleClientSecret: env.AUTH_GOOGLE_SECRET,
  });
}

export const authClient = getAuth();
