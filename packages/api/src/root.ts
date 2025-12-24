import { apiKeyRouter } from "./router/api-key";
import { authRouter } from "./router/auth";
import { changelogRouter } from "./router/changelog";
import { feedbackRouter } from "./router/feedback";
import { postRouter } from "./router/post";
import { settingsRouter } from "./router/settings";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
  feedback: feedbackRouter,
  changelog: changelogRouter,
  settings: settingsRouter,
  apiKey: apiKeyRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
