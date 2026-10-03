import { and, desc, eq } from "drizzle-orm";
import { db, inTransaction } from "../client";
import { type ApiKey, apiKey, type NewApiKey } from "./api-key.sql";

import { organization } from "./organization.sql";

export class CredentialLimitError extends Error {
  readonly code = "BAD_REQUEST";
  constructor() {
    super("Maximum of 10 active API keys allowed");
  }
}
async function lockQuota(organizationId: string) {
  await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .for("update");
}
async function requireCapacity(organizationId: string) {
  if ((await apiKeyQueries.countActiveKeys(organizationId)) >= 10) {
    throw new CredentialLimitError();
  }
}

export const apiKeyQueries = {
  /**
   * Find API key by ID
   */
  findById: async (id: string) =>
    db.query.apiKey.findFirst({
      where: eq(apiKey.id, id),
    }),

  /**
   * List all API keys for organization
   * Returns both active and inactive keys
   */
  listByOrganization: async (organizationId: string) =>
    db.query.apiKey.findMany({
      where: eq(apiKey.organizationId, organizationId),
      orderBy: desc(apiKey.createdAt),
    }),

  /**
   * Count active API keys for organization
   * Used to enforce 10-key limit
   */
  countActiveKeys: async (organizationId: string): Promise<number> => {
    const keys = await db.query.apiKey.findMany({
      where: and(
        eq(apiKey.organizationId, organizationId),
        eq(apiKey.isActive, true)
      ),
    });
    return keys.length;
  },

  /**
   * Create new API key
   */
  create: (data: NewApiKey) =>
    inTransaction(async () => {
      await lockQuota(data.organizationId);
      if (data.isActive !== false) {
        await requireCapacity(data.organizationId);
      }
      const [key] = await db.insert(apiKey).values(data).returning();
      return key;
    }),

  /**
   * Update API key (name, description, isActive)
   */
  update: async (
    id: string,
    data: Partial<Pick<ApiKey, "name" | "description">>
  ) => {
    const [updated] = await db
      .update(apiKey)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(apiKey.id, id))
      .returning();
    return updated;
  },

  /**
   * Update last used timestamp
   * Called on each successful authentication
   */
  updateLastUsed: async (id: string) => {
    await db
      .update(apiKey)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKey.id, id));
  },

  /**
   * Toggle key active status (soft delete/restore)
   */
  toggleActive: (id: string, isActive: boolean) =>
    inTransaction(async () => {
      const key = await apiKeyQueries.findById(id);
      if (!key) {
        return;
      }
      await lockQuota(key.organizationId);
      const current = await apiKeyQueries.findById(id);
      if (!current) {
        return;
      }
      if (isActive && !current.isActive) {
        await requireCapacity(current.organizationId);
      }
      const [updated] = await db
        .update(apiKey)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(apiKey.id, id))
        .returning();
      return updated;
    }),

  /**
   * Delete API key (hard delete)
   * Use toggleActive for soft delete instead
   */
  delete: async (id: string) => {
    await db.delete(apiKey).where(eq(apiKey.id, id));
  },

  /**
   * Find active API key by hash (EFFICIENT - O(1) lookup!)
   * Used for platform-agnostic authentication
   */
  findByHash: async (keyHash: string) =>
    db.query.apiKey.findFirst({
      where: and(eq(apiKey.keyHash, keyHash), eq(apiKey.isActive, true)),
      with: {
        organization: true,
      },
    }),

  /**
   * Check if key is expired
   */
  isExpired: (key: ApiKey): boolean => {
    if (!key.expiresAt) {
      return false;
    }
    return new Date() > new Date(key.expiresAt);
  },
};
