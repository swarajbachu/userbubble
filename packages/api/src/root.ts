import { accountOperations } from "./application/account";
import {
  approvalOperations,
  connectionOperations,
} from "./application/connection";
import { organizationOperations } from "./application/organization";
import {
  activityOperations,
  referenceOperations,
} from "./application/references";
import { mutation, query } from "./operation-adapter";
import { apiKeyRouter } from "./router/api-key";
import { authRouter } from "./router/auth";
import { changelogRouter } from "./router/changelog";
import { feedbackRouter } from "./router/feedback";
import { settingsRouter } from "./router/settings";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  account: {
    getProfile: query(accountOperations.getProfile),
    updateProfile: mutation(accountOperations.updateProfile),
  },
  connection: {
    listOAuth: query(connectionOperations.listOAuth),
    revokeOAuth: mutation(connectionOperations.revokeOAuth),
    list: query(connectionOperations.list),
    revoke: mutation(connectionOperations.revoke),
  },
  approval: {
    get: query(approvalOperations.get),
    respond: mutation(approvalOperations.respond),
  },
  reference: {
    list: query(referenceOperations.list),
    add: mutation(referenceOperations.add),
    delete: mutation(referenceOperations.delete),
  },
  activity: { list: query(activityOperations.list) },
  organization: {
    list: query(organizationOperations.list),
    get: query(organizationOperations.get),
    create: mutation(organizationOperations.create),
    checkSlug: query(organizationOperations.checkSlug),
    update: mutation(organizationOperations.update),
    initializeOnboarding: mutation(organizationOperations.initializeOnboarding),
    updateOnboarding: mutation(organizationOperations.updateOnboarding),
    listInvitations: query(organizationOperations.listInvitations),
    invite: mutation(organizationOperations.invite),
    cancelInvitation: mutation(organizationOperations.cancelInvitation),
  },
  auth: authRouter,
  feedback: feedbackRouter,
  changelog: changelogRouter,
  settings: settingsRouter,
  apiKey: apiKeyRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
