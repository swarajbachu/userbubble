import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import {
  automationApiKeyQueries,
  githubConfigQueries,
  oauthConnectionQueries,
  prJobQueries,
} from "@userbubble/db/queries";
import {
  deleteApiKeyValidator,
  saveApiKeyValidator,
  saveGithubConfigValidator,
  triggerPrGenerationValidator,
} from "@userbubble/db/schema";
import { z } from "zod";

import {
  completeCodexOAuth,
  disconnectCodex,
  initiateCodexOAuth,
} from "../services/codex-oauth";
import { orgAdminProcedure, orgProcedure } from "../trpc";

const MAX_CONCURRENT_JOBS = 1;
const MAX_DAILY_JOBS = 10; // TODO: restore to 10 after testing

export const automationRouter = {
  // Get API key status (which providers are configured + hints)
  getApiKeyStatus: orgAdminProcedure.query(async ({ ctx }) => {
    const keys = await automationApiKeyQueries.getStatus(ctx.org.id);
    return keys;
  }),

  // Save an API key (encrypts and stores)
  saveApiKey: orgAdminProcedure
    .input(
      z.object({
        provider: saveApiKeyValidator.shape.provider,
        key: saveApiKeyValidator.shape.key,
      })
    )
    .mutation(async ({ ctx, input }) => {
      await automationApiKeyQueries.save(ctx.org.id, input.provider, input.key);
      return { success: true };
    }),

  // Delete an API key
  deleteApiKey: orgAdminProcedure
    .input(
      z.object({
        provider: deleteApiKeyValidator.shape.provider,
      })
    )
    .mutation(async ({ ctx, input }) => {
      await automationApiKeyQueries.delete(ctx.org.id, input.provider);
      return { success: true };
    }),

  // Get GitHub repo config
  getGithubConfig: orgAdminProcedure.query(async ({ ctx }) => {
    const config = await githubConfigQueries.get(ctx.org.id);
    return config ?? null;
  }),

  // Save GitHub repo config
  saveGithubConfig: orgAdminProcedure
    .input(
      z.object({
        repoFullName: saveGithubConfigValidator.shape.repoFullName,
        defaultBranch: saveGithubConfigValidator.shape.defaultBranch,
      })
    )
    .mutation(async ({ ctx, input }) => {
      await githubConfigQueries.save(
        ctx.org.id,
        input.repoFullName,
        input.defaultBranch
      );
      return { success: true };
    }),

  // Validate GitHub token has access to the configured repo
  validateGithubAccess: orgAdminProcedure.mutation(async ({ ctx }) => {
    const [token, config] = await Promise.all([
      automationApiKeyQueries.getDecrypted(ctx.org.id, "github"),
      githubConfigQueries.get(ctx.org.id),
    ]);

    if (!token) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "GitHub token not configured",
      });
    }

    if (!config) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "GitHub repository not configured",
      });
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${config.repoFullName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `GitHub access failed: ${data.message ?? response.statusText}`,
        });
      }

      return { success: true, repoFullName: config.repoFullName };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to validate GitHub access",
      });
    }
  }),

  // Initiate OAuth PKCE flow — returns auth URL for user to open
  initiateOAuthConnection: orgAdminProcedure
    .input(z.object({ provider: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (input.provider !== "codex") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unsupported OAuth provider: ${input.provider}`,
        });
      }
      return initiateCodexOAuth(ctx.org.id);
    }),

  // Complete OAuth — user pastes the redirect URL from their browser
  completeOAuthConnection: orgAdminProcedure
    .input(
      z.object({
        provider: z.string().min(1),
        callbackUrl: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.provider !== "codex") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unsupported OAuth provider: ${input.provider}`,
        });
      }
      return completeCodexOAuth(ctx.org.id, input.callbackUrl);
    }),

  // Get OAuth connection status
  getOAuthConnectionStatus: orgAdminProcedure
    .input(z.object({ provider: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const conn = await oauthConnectionQueries.getStatus(
        ctx.org.id,
        input.provider
      );

      if (!conn) {
        return { status: "not_connected" as const };
      }

      if (conn.status === "active") {
        return {
          status: "active" as const,
          accountId: conn.accountId,
        };
      }

      return {
        status: "pending" as const,
        authUrl: conn.verificationUri,
      };
    }),

  // Disconnect OAuth
  disconnectOAuth: orgAdminProcedure
    .input(z.object({ provider: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (input.provider !== "codex") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unsupported OAuth provider: ${input.provider}`,
        });
      }
      await disconnectCodex(ctx.org.id);
      return { success: true };
    }),

  // Get repo analysis status + project context
  getRepoAnalysisStatus: orgAdminProcedure.query(async ({ ctx }) => {
    const config = await githubConfigQueries.get(ctx.org.id);
    if (!config) {
      return null;
    }
    return {
      analysisStatus: config.analysisStatus,
      analysisError: config.analysisError,
      projectContext: config.projectContext,
      projectContextUpdatedAt: config.projectContextUpdatedAt,
    };
  }),

  // Trigger repo analysis on the worker
  analyzeRepo: orgAdminProcedure.mutation(async ({ ctx }) => {
    const config = await githubConfigQueries.get(ctx.org.id);
    if (!config) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "GitHub repository must be configured first",
      });
    }

    const [apiKeys, oauthConns] = await Promise.all([
      automationApiKeyQueries.getStatus(ctx.org.id),
      oauthConnectionQueries.listActive(ctx.org.id),
    ]);

    const hasGithub = apiKeys.some((k) => k.provider === "github");
    if (!hasGithub) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "GitHub token must be configured",
      });
    }

    const hasAnthropic = apiKeys.some((k) => k.provider === "anthropic");
    const hasCodex = oauthConns.some((c) => c.provider === "codex");

    if (!(hasAnthropic || hasCodex)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "An AI provider (Anthropic key or Codex) must be configured for repo analysis",
      });
    }

    // Set status to pending
    await githubConfigQueries.updateAnalysisStatus(ctx.org.id, "pending");

    // Trigger worker
    const webhookSecret = process.env.MODAL_WEBHOOK_SECRET;
    const webhookUrl = process.env.MODAL_WEBHOOK_URL;

    if (webhookUrl && webhookSecret) {
      const analyzeUrl = webhookUrl.replace("/generate-pr", "/analyze-repo");
      try {
        await fetch(analyzeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${webhookSecret}`,
          },
          body: JSON.stringify({ organizationId: ctx.org.id }),
        });
      } catch {
        await githubConfigQueries.updateAnalysisStatus(
          ctx.org.id,
          "failed",
          "Failed to reach worker"
        );
      }
    }

    return { success: true };
  }),

  // Trigger PR generation for a feedback post
  triggerPrGeneration: orgAdminProcedure
    .input(
      z.object({
        feedbackPostId: triggerPrGenerationValidator.shape.feedbackPostId,
        additionalContext: triggerPrGenerationValidator.shape.additionalContext,
        preferredProvider: triggerPrGenerationValidator.shape.preferredProvider,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check rate limits
      const hasRunning = await prJobQueries.hasRunningJob(ctx.org.id);
      if (hasRunning) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Only ${MAX_CONCURRENT_JOBS} concurrent job(s) allowed per organization`,
        });
      }

      const todayCount = await prJobQueries.countTodayJobs(ctx.org.id);
      if (todayCount >= MAX_DAILY_JOBS) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Daily limit of ${MAX_DAILY_JOBS} jobs reached`,
        });
      }

      // Check what AI providers are available
      const [apiKeys, oauthConns, config] = await Promise.all([
        automationApiKeyQueries.getStatus(ctx.org.id),
        oauthConnectionQueries.listActive(ctx.org.id),
        githubConfigQueries.get(ctx.org.id),
      ]);

      const hasGithub = apiKeys.some((k) => k.provider === "github");
      const hasAnthropic = apiKeys.some((k) => k.provider === "anthropic");
      const hasCodex = oauthConns.some((c) => c.provider === "codex");

      if (!hasGithub) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "GitHub token must be configured",
        });
      }

      if (!(hasAnthropic || hasCodex)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An AI provider (Anthropic key or Codex) must be configured",
        });
      }

      if (!config) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "GitHub repository must be configured",
        });
      }

      // Auto-select provider: prefer caller's choice, then Codex, then Anthropic
      const preferred = input.preferredProvider;
      let aiProvider: string;
      if (preferred === "codex" && hasCodex) {
        aiProvider = "codex";
      } else if (preferred === "anthropic" && hasAnthropic) {
        aiProvider = "anthropic";
      } else if (hasCodex) {
        aiProvider = "codex";
      } else {
        aiProvider = "anthropic";
      }

      // Create the job
      const job = await prJobQueries.create({
        organizationId: ctx.org.id,
        feedbackPostId: input.feedbackPostId,
        triggeredById: ctx.session.user.id,
        status: "pending",
        aiProvider,
        additionalContext: input.additionalContext,
        progressLog: [{ ts: new Date().toISOString(), message: "Job created" }],
      });

      if (!job) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create job",
        });
      }

      // Trigger Modal webhook
      const webhookSecret = process.env.MODAL_WEBHOOK_SECRET;
      const webhookUrl = process.env.MODAL_WEBHOOK_URL;

      if (webhookUrl && webhookSecret) {
        try {
          await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${webhookSecret}`,
            },
            body: JSON.stringify({ jobId: job.id }),
          });
        } catch {
          await prJobQueries.appendProgress(
            job.id,
            "Warning: Failed to notify worker, job will be picked up by polling"
          );
        }
      }

      return { jobId: job.id };
    }),

  // Get job status (for polling)
  getJobStatus: orgProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await prJobQueries.getById(input.jobId);
      if (!job || job.organizationId !== ctx.org.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }
      return job;
    }),

  // List all jobs for a feedback post
  listJobsForPost: orgProcedure
    .input(z.object({ feedbackPostId: z.string() }))
    .query(async ({ ctx, input }) =>
      prJobQueries.listForPost(input.feedbackPostId, ctx.org.id)
    ),

  // Cancel a running job
  cancelJob: orgAdminProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = await prJobQueries.getById(input.jobId);
      if (!job || job.organizationId !== ctx.org.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      const activeStatuses = [
        "pending",
        "cloning",
        "analyzing",
        "implementing",
        "creating_pr",
      ];
      if (!activeStatuses.includes(job.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Job is not in an active state",
        });
      }

      await prJobQueries.updateStatus(input.jobId, "cancelled");
      return { success: true };
    }),
} satisfies TRPCRouterRecord;
