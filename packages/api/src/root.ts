import { authRouter } from "./router/auth";
import { feedbackRouter } from "./router/feedback";
import { organizationRouter } from "./router/organization";
import { postRouter } from "./router/post";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
  feedback: feedbackRouter,
  organization: organizationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
