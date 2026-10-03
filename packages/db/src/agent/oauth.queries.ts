import { and, eq, sql } from "drizzle-orm";
import { db, inTransaction } from "../client";
import {
  oauthAccessToken,
  oauthClient,
  oauthConsent,
  oauthRefreshToken,
} from "./oauth.sql";

export const oauthConnectionQueries = {
  active: async (
    userId: string,
    clientId: string,
    organizationId: string,
    issuedAt: number
  ) => {
    const [consent] = await db
      .select({
        scopes: oauthConsent.scopes,
        createdAt: oauthConsent.createdAt,
      })
      .from(oauthConsent)
      .innerJoin(oauthClient, eq(oauthClient.clientId, oauthConsent.clientId))
      .where(
        and(
          eq(oauthConsent.userId, userId),
          eq(oauthConsent.clientId, clientId),
          eq(oauthConsent.referenceId, organizationId),
          sql`${oauthClient.disabled} IS NOT TRUE`
        )
      );
    return Boolean(
      consent?.scopes.includes("userbubble:manage") &&
        issuedAt >= Math.floor(consent.createdAt.getTime() / 1000)
    );
  },
  list: (userId: string) =>
    db
      .select({
        id: oauthConsent.id,
        clientId: oauthConsent.clientId,
        name: oauthClient.name,
        organizationId: oauthConsent.referenceId,
        scopes: oauthConsent.scopes,
        createdAt: oauthConsent.createdAt,
      })
      .from(oauthConsent)
      .innerJoin(oauthClient, eq(oauthClient.clientId, oauthConsent.clientId))
      .where(eq(oauthConsent.userId, userId)),
  revoke: (userId: string, consentId: string) =>
    inTransaction(async () => {
      const [consent] = await db
        .delete(oauthConsent)
        .where(
          and(eq(oauthConsent.id, consentId), eq(oauthConsent.userId, userId))
        )
        .returning();
      if (!consent) {
        return false;
      }
      const same = (
        table: typeof oauthAccessToken | typeof oauthRefreshToken
      ) =>
        and(
          eq(table.userId, userId),
          eq(table.clientId, consent.clientId),
          consent.referenceId
            ? eq(table.referenceId, consent.referenceId)
            : sql`${table.referenceId} IS NULL`
        );
      await db
        .update(oauthAccessToken)
        .set({ revoked: new Date() })
        .where(same(oauthAccessToken));
      await db
        .update(oauthRefreshToken)
        .set({ revoked: new Date() })
        .where(same(oauthRefreshToken));
      return true;
    }),
};
