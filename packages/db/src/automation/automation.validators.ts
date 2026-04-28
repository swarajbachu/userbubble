import { z } from "zod";
import { prJobStatuses } from "./automation.sql";

export const apiKeyProviderValidator = z.string().min(1);
export const prJobStatusValidator = z.enum(prJobStatuses);

export const saveApiKeyValidator = z.object({
  organizationId: z.string().min(1),
  provider: apiKeyProviderValidator,
  key: z.string().min(1),
});

export const deleteApiKeyValidator = z.object({
  organizationId: z.string().min(1),
  provider: apiKeyProviderValidator,
});

export const saveGithubConfigValidator = z.object({
  organizationId: z.string().min(1),
  repoFullName: z
    .string()
    .min(3)
    .regex(
      /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/,
      "Must be in format owner/repo"
    ),
  defaultBranch: z.string().min(1).max(256).default("main"),
});

export const triggerPrGenerationValidator = z.object({
  organizationId: z.string().min(1),
  feedbackPostId: z.string().min(1),
  additionalContext: z.string().max(5000).optional(),
  preferredProvider: z.string().min(1).optional(),
});
