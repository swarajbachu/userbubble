import { authRouter } from "./router/auth";
import { automationRouter } from "./router/automation";
import { changelogRouter } from "./router/changelog";
import { feedbackRouter } from "./router/feedback";
import { postRouter } from "./router/post";
import { settingsRouter } from "./router/settings";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  automation: automationRouter,
  post: postRouter,
  feedback: feedbackRouter,
  changelog: changelogRouter,
  settings: settingsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
