import { authRouter } from "./router/auth";
import { feedbackRouter } from "./router/feedback";
import { postRouter } from "./router/post";
import { settingsRouter } from "./router/settings";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
  feedback: feedbackRouter,
  settings: settingsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
