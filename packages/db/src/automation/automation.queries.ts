import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../client";
import { decrypt, encrypt, getKeyHint } from "../lib/encryption";
import {
  type ApiKeyProvider,
  type NewPrGenerationJob,
  organizationApiKey,
  organizationGithubConfig,
  organizationOAuthConnection,
  type PrJobStatus,
  prGenerationJob,
} from "./automation.sql";

/**
 * API Key Queries
 */
export const apiKeyQueries = {
  /**
   * Get status of configured API keys for an org (provider + hint, no decryption)
   */
  getStatus: async (organizationId: string) => {
    const keys = await db
      .select({
        provider: organizationApiKey.provider,
        keyHint: organizationApiKey.keyHint,
        updatedAt: organizationApiKey.updatedAt,
      })
      .from(organizationApiKey)
      .where(eq(organizationApiKey.organizationId, organizationId));

    return keys;
  },

  /**
   * Save (upsert) an encrypted API key
   */
  save: async (
    organizationId: string,
    provider: ApiKeyProvider,
    plainKey: string
  ) => {
    const encryptedKey = encrypt(plainKey);
    const keyHint = getKeyHint(plainKey);

    const [result] = await db
      .insert(organizationApiKey)
      .values({
        organizationId,
        provider,
        encryptedKey,
        keyHint,
      })
      .onConflictDoUpdate({
        target: [
          organizationApiKey.organizationId,
          organizationApiKey.provider,
        ],
        set: { encryptedKey, keyHint },
      })
      .returning();

    return result;
  },

  /**
   * Delete an API key
   */
  delete: async (organizationId: string, provider: ApiKeyProvider) => {
    await db
      .delete(organizationApiKey)
      .where(
        and(
          eq(organizationApiKey.organizationId, organizationId),
          eq(organizationApiKey.provider, provider)
        )
      );
  },

  /**
   * Get decrypted API key (for use in worker only)
   */
  getDecrypted: async (organizationId: string, provider: ApiKeyProvider) => {
    const key = await db.query.organizationApiKey.findFirst({
      where: and(
        eq(organizationApiKey.organizationId, organizationId),
        eq(organizationApiKey.provider, provider)
      ),
    });

    if (!key) {
      return null;
    }

    return decrypt(key.encryptedKey);
  },

  /**
   * Check if GitHub key is configured (AI provider check is separate)
   */
  hasGithubKey: async (organizationId: string) => {
    const keys = await db
      .select({ provider: organizationApiKey.provider })
      .from(organizationApiKey)
      .where(
        and(
          eq(organizationApiKey.organizationId, organizationId),
          eq(organizationApiKey.provider, "github")
        )
      )
      .limit(1);

    return keys.length > 0;
  },
};

/**
 * OAuth Connection Queries
 */
export const oauthConnectionQueries = {
  /**
   * Get connection status (no token decryption)
   */
  getStatus: async (organizationId: string, provider: string) => {
    const conn = await db.query.organizationOAuthConnection.findFirst({
      where: and(
        eq(organizationOAuthConnection.organizationId, organizationId),
        eq(organizationOAuthConnection.provider, provider)
      ),
      columns: {
        id: true,
        status: true,
        deviceAuthId: true,
        userCode: true,
        verificationUri: true,
        deviceAuthExpiresAt: true,
        accountId: true,
        updatedAt: true,
      },
    });
    return conn ?? null;
  },

  /**
   * List active OAuth connections for an org
   */
  listActive: async (organizationId: string) =>
    db
      .select({
        provider: organizationOAuthConnection.provider,
        accountId: organizationOAuthConnection.accountId,
      })
      .from(organizationOAuthConnection)
      .where(
        and(
          eq(organizationOAuthConnection.organizationId, organizationId),
          eq(organizationOAuthConnection.status, "active")
        )
      ),

  /**
   * Upsert a pending device flow connection
   */
  upsertPending: async (
    organizationId: string,
    provider: string,
    data: {
      deviceAuthId: string;
      userCode: string;
      verificationUri: string;
      deviceAuthExpiresAt: Date;
    }
  ) => {
    const [result] = await db
      .insert(organizationOAuthConnection)
      .values({
        organizationId,
        provider,
        status: "pending",
        ...data,
        encryptedAccessToken: null,
        encryptedRefreshToken: null,
        tokenExpiresAt: null,
        accountId: null,
      })
      .onConflictDoUpdate({
        target: [
          organizationOAuthConnection.organizationId,
          organizationOAuthConnection.provider,
        ],
        set: {
          status: "pending",
          ...data,
          encryptedAccessToken: null,
          encryptedRefreshToken: null,
          tokenExpiresAt: null,
          accountId: null,
        },
      })
      .returning();
    return result;
  },

  /**
   * Activate a connection after successful OAuth
   */
  activate: async (
    organizationId: string,
    provider: string,
    data: {
      encryptedAccessToken: string;
      encryptedRefreshToken: string | null;
      tokenExpiresAt: Date | null;
      accountId: string | null;
    }
  ) => {
    const [result] = await db
      .update(organizationOAuthConnection)
      .set({
        status: "active",
        deviceAuthId: null,
        userCode: null,
        verificationUri: null,
        deviceAuthExpiresAt: null,
        ...data,
      })
      .where(
        and(
          eq(organizationOAuthConnection.organizationId, organizationId),
          eq(organizationOAuthConnection.provider, provider)
        )
      )
      .returning();
    return result;
  },

  /**
   * Get decrypted tokens (worker-only)
   */
  getDecryptedTokens: async (organizationId: string, provider: string) => {
    const conn = await db.query.organizationOAuthConnection.findFirst({
      where: and(
        eq(organizationOAuthConnection.organizationId, organizationId),
        eq(organizationOAuthConnection.provider, provider),
        eq(organizationOAuthConnection.status, "active")
      ),
      columns: {
        encryptedAccessToken: true,
        encryptedRefreshToken: true,
        tokenExpiresAt: true,
        accountId: true,
      },
    });

    if (!conn?.encryptedAccessToken) {
      return null;
    }

    return {
      accessToken: decrypt(conn.encryptedAccessToken),
      refreshToken: conn.encryptedRefreshToken
        ? decrypt(conn.encryptedRefreshToken)
        : null,
      tokenExpiresAt: conn.tokenExpiresAt,
      accountId: conn.accountId,
    };
  },

  /**
   * Update tokens (for refresh)
   */
  updateTokens: async (
    organizationId: string,
    provider: string,
    data: {
      encryptedAccessToken: string;
      encryptedRefreshToken: string | null;
      tokenExpiresAt: Date | null;
    }
  ) => {
    await db
      .update(organizationOAuthConnection)
      .set(data)
      .where(
        and(
          eq(organizationOAuthConnection.organizationId, organizationId),
          eq(organizationOAuthConnection.provider, provider)
        )
      );
  },

  /**
   * Delete an OAuth connection
   */
  delete: async (organizationId: string, provider: string) => {
    await db
      .delete(organizationOAuthConnection)
      .where(
        and(
          eq(organizationOAuthConnection.organizationId, organizationId),
          eq(organizationOAuthConnection.provider, provider)
        )
      );
  },
};

/**
 * GitHub Config Queries
 */
export const githubConfigQueries = {
  /**
   * Get GitHub config for an org
   */
  get: async (organizationId: string) =>
    db.query.organizationGithubConfig.findFirst({
      where: eq(organizationGithubConfig.organizationId, organizationId),
    }),

  /**
   * Save (upsert) GitHub config
   */
  save: async (
    organizationId: string,
    repoFullName: string,
    defaultBranch: string
  ) => {
    const [result] = await db
      .insert(organizationGithubConfig)
      .values({
        organizationId,
        repoFullName,
        defaultBranch,
      })
      .onConflictDoUpdate({
        target: [organizationGithubConfig.organizationId],
        set: { repoFullName, defaultBranch },
      })
      .returning();

    return result;
  },

  /**
   * Delete GitHub config
   */
  delete: async (organizationId: string) => {
    await db
      .delete(organizationGithubConfig)
      .where(eq(organizationGithubConfig.organizationId, organizationId));
  },
};

/**
 * PR Generation Job Queries
 */
export const prJobQueries = {
  /**
   * Create a new job
   */
  create: async (data: NewPrGenerationJob) => {
    const [job] = await db.insert(prGenerationJob).values(data).returning();
    return job;
  },

  /**
   * Get job by ID
   */
  getById: async (jobId: string) =>
    db.query.prGenerationJob.findFirst({
      where: eq(prGenerationJob.id, jobId),
    }),

  /**
   * Update job status
   */
  updateStatus: async (
    jobId: string,
    status: PrJobStatus,
    extra?: {
      progressLog?: Array<{ ts: string; message: string }>;
      prUrl?: string;
      branchName?: string;
      errorMessage?: string;
    }
  ) => {
    const updates: Record<string, unknown> = { status };

    if (extra?.progressLog) {
      updates.progressLog = extra.progressLog;
    }
    if (extra?.prUrl) {
      updates.prUrl = extra.prUrl;
    }
    if (extra?.branchName) {
      updates.branchName = extra.branchName;
    }
    if (extra?.errorMessage) {
      updates.errorMessage = extra.errorMessage;
    }
    if (status === "completed" || status === "failed") {
      updates.completedAt = new Date();
    }

    const [updated] = await db
      .update(prGenerationJob)
      .set(updates)
      .where(eq(prGenerationJob.id, jobId))
      .returning();

    return updated;
  },

  /**
   * Append to progress log
   */
  appendProgress: async (jobId: string, message: string) => {
    const job = await db.query.prGenerationJob.findFirst({
      where: eq(prGenerationJob.id, jobId),
      columns: { progressLog: true },
    });

    const currentLog = (job?.progressLog ?? []) as Array<{
      ts: string;
      message: string;
    }>;
    const newLog = [...currentLog, { ts: new Date().toISOString(), message }];

    await db
      .update(prGenerationJob)
      .set({ progressLog: newLog })
      .where(eq(prGenerationJob.id, jobId));
  },

  /**
   * List jobs for a feedback post
   */
  listForPost: async (feedbackPostId: string) =>
    db
      .select()
      .from(prGenerationJob)
      .where(eq(prGenerationJob.feedbackPostId, feedbackPostId))
      .orderBy(desc(prGenerationJob.createdAt)),

  /**
   * Check if org has a running job (for concurrency limit)
   */
  hasRunningJob: async (organizationId: string) => {
    const activeStatuses: PrJobStatus[] = [
      "pending",
      "cloning",
      "analyzing",
      "implementing",
      "creating_pr",
    ];

    const running = await db
      .select({ id: prGenerationJob.id })
      .from(prGenerationJob)
      .where(
        and(
          eq(prGenerationJob.organizationId, organizationId),
          sql`${prGenerationJob.status} = ANY(${activeStatuses})`
        )
      )
      .limit(1);

    return running.length > 0;
  },

  /**
   * Count jobs created today for an org (for daily limit)
   */
  countTodayJobs: async (organizationId: string) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(prGenerationJob)
      .where(
        and(
          eq(prGenerationJob.organizationId, organizationId),
          gte(prGenerationJob.createdAt, startOfDay)
        )
      );

    return result[0]?.count ?? 0;
  },

  /**
   * Get next pending job (for worker polling, if needed)
   */
  getNextPending: async () =>
    db.query.prGenerationJob.findFirst({
      where: eq(prGenerationJob.status, "pending"),
      orderBy: prGenerationJob.createdAt,
    }),
};
