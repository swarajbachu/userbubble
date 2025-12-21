"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "https://app.userbubble.com",
  fetchOptions: {
    credentials: "include",
  },
});
