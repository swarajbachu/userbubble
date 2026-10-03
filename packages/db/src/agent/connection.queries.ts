import { createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../client";
import { agent, agentCapabilityGrant, approvalRequest } from "./agent.sql";

export const connectionQueries = {
  list: async (userId: string) => {
    const agents = await db
      .select({
        id: agent.id,
        name: agent.name,
        status: agent.status,
        createdAt: agent.createdAt,
        lastUsedAt: agent.lastUsedAt,
      })
      .from(agent)
      .where(eq(agent.userId, userId));
    return Promise.all(
      agents.map(async (item) => ({
        ...item,
        grants: await db
          .select({
            capability: agentCapabilityGrant.capability,
            status: agentCapabilityGrant.status,
            constraints: agentCapabilityGrant.constraints,
            expiresAt: agentCapabilityGrant.expiresAt,
          })
          .from(agentCapabilityGrant)
          .where(eq(agentCapabilityGrant.agentId, item.id)),
      }))
    );
  },
  revoke: async (userId: string, agentId: string) => {
    const rows = await db
      .update(agent)
      .set({ status: "revoked", updatedAt: new Date() })
      .where(and(eq(agent.id, agentId), eq(agent.userId, userId)))
      .returning({ id: agent.id });
    return rows.length > 0;
  },
  approval: async (userId: string, agentId: string, code: string) => {
    const stripped = code.replaceAll(/[^A-Z0-9]/gi, "").toUpperCase();
    const normalized =
      stripped.length === 8
        ? `${stripped.slice(0, 4)}-${stripped.slice(4)}`
        : code.toUpperCase();
    const hash = createHash("sha256").update(normalized).digest("base64url");
    const [request] = await db
      .select({ id: approvalRequest.id })
      .from(approvalRequest)
      .where(
        and(
          eq(approvalRequest.agentId, agentId),
          eq(approvalRequest.userCodeHash, hash),
          eq(approvalRequest.status, "pending"),
          gt(approvalRequest.expiresAt, new Date())
        )
      );
    if (!request) {
      return null;
    }
    const [connection] = await db
      .select({ id: agent.id, name: agent.name, userId: agent.userId })
      .from(agent)
      .where(eq(agent.id, agentId));
    if (!connection || (connection.userId && connection.userId !== userId)) {
      return null;
    }
    const grants = await db
      .select({
        capability: agentCapabilityGrant.capability,
        constraints: agentCapabilityGrant.constraints,
      })
      .from(agentCapabilityGrant)
      .where(
        and(
          eq(agentCapabilityGrant.agentId, agentId),
          eq(agentCapabilityGrant.status, "pending")
        )
      );
    return { id: connection.id, name: connection.name, grants };
  },
};
