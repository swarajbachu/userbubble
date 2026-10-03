import { and, asc, eq, sql } from "drizzle-orm";
import { changelogEntry } from "../changelog/changelog.sql";
import { db } from "../client";
import { feedbackPost } from "../feedback/feedback.sql";
import { organization } from "./organization.sql";

export const publicIndexQueries = {
  organizations: () =>
    db
      .select({ slug: organization.slug })
      .from(organization)
      .orderBy(asc(organization.slug)),
  counts: async (organizationId: string) => {
    const [posts, releases] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(feedbackPost)
        .where(
          and(
            eq(feedbackPost.organizationId, organizationId),
            eq(feedbackPost.isPublic, true)
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(changelogEntry)
        .where(
          and(
            eq(changelogEntry.organizationId, organizationId),
            eq(changelogEntry.isPublished, true)
          )
        ),
    ]);
    return {
      feedback: posts[0]?.count ?? 0,
      changelog: releases[0]?.count ?? 0,
    };
  },
  items: (
    organizationId: string,
    kind: "feedback" | "changelog",
    page: number
  ) => {
    const table = kind === "feedback" ? feedbackPost : changelogEntry;
    const visible =
      kind === "feedback" ? feedbackPost.isPublic : changelogEntry.isPublished;
    return db
      .select({ id: table.id, updatedAt: table.updatedAt })
      .from(table)
      .where(and(eq(table.organizationId, organizationId), eq(visible, true)))
      .orderBy(asc(table.id))
      .limit(10_000)
      .offset(page * 10_000);
  },
};
