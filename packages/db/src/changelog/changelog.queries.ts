import { and, arrayOverlaps, desc, eq, inArray, sql } from "drizzle-orm";
import { db, inTransaction } from "../client";
import { changelogEntry, changelogFeedbackLink } from "./changelog.sql";

/**
 * Get all changelog entries for an organization
 */
export async function getChangelogEntries(
  organizationId: string,
  options?: {
    published?: boolean;
    tags?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }
) {
  const { published, limit = 20, offset = 0 } = options || {};

  const conditions = [eq(changelogEntry.organizationId, organizationId)];

  if (published !== undefined) {
    conditions.push(eq(changelogEntry.isPublished, published));
  }

  if (options?.tags?.length) {
    conditions.push(arrayOverlaps(changelogEntry.tags, options.tags));
  }
  const releaseDate = sql`coalesce(${changelogEntry.publishedAt}, ${changelogEntry.createdAt})`;
  if (options?.dateFrom) {
    conditions.push(sql`${releaseDate} >= ${options.dateFrom}`);
  }
  if (options?.dateTo) {
    conditions.push(sql`${releaseDate} <= ${options.dateTo}`);
  }

  const entries = await db.query.changelogEntry.findMany({
    where: and(...conditions),
    orderBy: [
      desc(changelogEntry.publishedAt),
      desc(changelogEntry.createdAt),
      desc(changelogEntry.id),
    ],
    limit,
    offset,
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return entries;
}

/**
 * Get a single changelog entry with linked feedback posts
 */
export async function getChangelogEntry(entryId: string) {
  const entry = await db.query.changelogEntry.findFirst({
    where: eq(changelogEntry.id, entryId),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  if (!entry) {
    return null;
  }

  // Get linked feedback posts
  const links = await db.query.changelogFeedbackLink.findMany({
    where: eq(changelogFeedbackLink.changelogEntryId, entryId),
    with: {
      feedbackPost: {
        columns: {
          id: true,
          title: true,
          description: true,
          status: true,
          category: true,
          voteCount: true,
          organizationId: true,
          isPublic: true,
        },
      },
    },
  });

  return {
    ...entry,
    linkedFeedback: links.map((link) => link.feedbackPost),
  };
}

/**
 * Create a new changelog entry
 */
export async function createChangelogEntry(data: {
  organizationId: string;
  authorId: string;
  title: string;
  description: string;
  version?: string;
  coverImageUrl?: string;
  tags?: string[];
  isPublished?: boolean;
  publishedAt?: Date;
}) {
  const [entry] = await db
    .insert(changelogEntry)
    .values({
      ...data,
      isPublished: data.isPublished ?? false,
      publishedAt: data.isPublished ? (data.publishedAt ?? new Date()) : null,
    })
    .returning();

  return entry;
}

/**
 * Create a new changelog entry with linked feedback posts in a transaction
 */
export async function createChangelogEntryWithFeedback(data: {
  organizationId: string;
  authorId: string;
  title: string;
  description: string;
  version?: string;
  coverImageUrl?: string;
  tags?: string[];
  isPublished?: boolean;
  publishedAt?: Date;
  feedbackPostIds?: string[];
}) {
  return await db.transaction(async (tx) => {
    // Create the changelog entry
    const [entry] = await tx
      .insert(changelogEntry)
      .values({
        organizationId: data.organizationId,
        authorId: data.authorId,
        title: data.title,
        description: data.description,
        version: data.version,
        coverImageUrl: data.coverImageUrl,
        tags: data.tags,
        isPublished: data.isPublished ?? false,
        publishedAt: data.isPublished ? (data.publishedAt ?? new Date()) : null,
      })
      .returning();

    if (!entry) {
      throw new Error("Failed to create changelog entry");
    }

    // Link feedback posts if provided
    if (data.feedbackPostIds && data.feedbackPostIds.length > 0) {
      await tx.insert(changelogFeedbackLink).values(
        data.feedbackPostIds.map((postId) => ({
          changelogEntryId: entry.id,
          feedbackPostId: postId,
        }))
      );
    }

    return entry;
  });
}

/**
 * Update an existing changelog entry
 */
export async function updateChangelogEntry(
  entryId: string,
  updates: {
    title?: string;
    description?: string;
    version?: string;
    coverImageUrl?: string;
    tags?: string[];
    isPublished?: boolean;
    publishedAt?: Date;
    scheduledFor?: Date;
  },
  expectedRevision?: number
) {
  const [entry] = await db
    .update(changelogEntry)
    .set({
      ...updates,
      updatedAt: new Date(),
      revision: sql`${changelogEntry.revision} + 1`,
    })
    .where(
      and(
        eq(changelogEntry.id, entryId),
        expectedRevision === undefined
          ? undefined
          : eq(changelogEntry.revision, expectedRevision)
      )
    )
    .returning();

  return entry;
}

/**
 * Publish a changelog entry
 */
export async function publishChangelogEntry(
  entryId: string,
  expectedRevision?: number
) {
  const [entry] = await db
    .update(changelogEntry)
    .set({
      isPublished: true,
      publishedAt: new Date(),
      updatedAt: new Date(),
      revision: sql`${changelogEntry.revision} + 1`,
    })
    .where(
      and(
        eq(changelogEntry.id, entryId),
        expectedRevision === undefined
          ? undefined
          : eq(changelogEntry.revision, expectedRevision)
      )
    )
    .returning();

  return entry;
}

/**
 * Delete a changelog entry
 */
export async function deleteChangelogEntry(
  entryId: string,
  expectedRevision?: number
) {
  const removed = await db
    .delete(changelogEntry)
    .where(
      and(
        eq(changelogEntry.id, entryId),
        expectedRevision === undefined
          ? undefined
          : eq(changelogEntry.revision, expectedRevision)
      )
    )
    .returning({ id: changelogEntry.id });
  return removed.length > 0;
}

export class ChangelogRevisionConflict extends Error {}
async function withRevision<T>(
  entryId: string,
  expectedRevision: number | undefined,
  work: () => Promise<T>
): Promise<T> {
  return inTransaction(async () => {
    const [entry] = await db
      .update(changelogEntry)
      .set({
        revision: sql`${changelogEntry.revision} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(changelogEntry.id, entryId),
          expectedRevision === undefined
            ? undefined
            : eq(changelogEntry.revision, expectedRevision)
        )
      )
      .returning({ id: changelogEntry.id });
    if (!entry) {
      throw new ChangelogRevisionConflict(
        "Release changed. Retrieve the latest revision and retry."
      );
    }
    return work();
  });
}

/**
 * Link feedback posts to a changelog entry
 */
export async function linkFeedbackToChangelog(
  changelogEntryId: string,
  feedbackPostIds: string[],
  expectedRevision?: number
) {
  return withRevision(changelogEntryId, expectedRevision, async () => {
    if (feedbackPostIds.length === 0) {
      return [];
    }

    // Get existing links
    const existingLinks = await db.query.changelogFeedbackLink.findMany({
      where: eq(changelogFeedbackLink.changelogEntryId, changelogEntryId),
    });

    const existingPostIds = existingLinks.map((link) => link.feedbackPostId);

    // Only insert new links
    const newPostIds = [...new Set(feedbackPostIds)].filter(
      (id) => !existingPostIds.includes(id)
    );

    if (newPostIds.length === 0) {
      return existingLinks;
    }

    const newLinks = await db
      .insert(changelogFeedbackLink)
      .values(
        newPostIds.map((postId) => ({
          changelogEntryId,
          feedbackPostId: postId,
        }))
      )
      .returning();

    return [...existingLinks, ...newLinks];
  });
}

/**
 * Unlink feedback posts from a changelog entry
 */
export async function unlinkFeedbackFromChangelog(
  changelogEntryId: string,
  feedbackPostIds: string[],
  expectedRevision?: number
) {
  return withRevision(changelogEntryId, expectedRevision, async () => {
    if (feedbackPostIds.length === 0) {
      return;
    }

    await db
      .delete(changelogFeedbackLink)
      .where(
        and(
          eq(changelogFeedbackLink.changelogEntryId, changelogEntryId),
          inArray(changelogFeedbackLink.feedbackPostId, feedbackPostIds)
        )
      );
  });
}

/**
 * Get all feedback posts linked to a changelog entry
 */
export async function getLinkedFeedback(changelogEntryId: string) {
  const links = await db.query.changelogFeedbackLink.findMany({
    where: eq(changelogFeedbackLink.changelogEntryId, changelogEntryId),
    with: {
      feedbackPost: true,
    },
  });

  return links.map((link) => link.feedbackPost);
}

/** Commit content, publication, and the selected feedback together. */
export async function saveChangelogEntry(
  entryId: string,
  organizationId: string,
  changes: {
    title?: string;
    description?: string;
    version?: string | null;
    coverImageUrl?: string | null;
    tags?: string[];
    feedbackPostIds?: string[];
    publish?: boolean;
    expectedRevision?: number;
  }
) {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(changelogEntry)
      .where(
        and(
          eq(changelogEntry.id, entryId),
          eq(changelogEntry.organizationId, organizationId)
        )
      )
      .for("update");
    if (
      !current ||
      (changes.expectedRevision !== undefined &&
        current.revision !== changes.expectedRevision)
    ) {
      return;
    }
    const {
      feedbackPostIds,
      publish,
      expectedRevision: _expectedRevision,
      ...content
    } = changes;
    const [saved] = await tx
      .update(changelogEntry)
      .set({
        ...content,
        ...(publish
          ? {
              isPublished: true,
              publishedAt: current.publishedAt ?? new Date(),
            }
          : {}),
        updatedAt: new Date(),
        revision: sql`${changelogEntry.revision} + 1`,
      })
      .where(
        and(
          eq(changelogEntry.id, entryId),
          eq(changelogEntry.organizationId, organizationId)
        )
      )
      .returning();
    if (feedbackPostIds !== undefined) {
      await tx
        .delete(changelogFeedbackLink)
        .where(eq(changelogFeedbackLink.changelogEntryId, entryId));
      const ids = [...new Set(feedbackPostIds)];
      if (ids.length) {
        await tx.insert(changelogFeedbackLink).values(
          ids.map((feedbackPostId) => ({
            changelogEntryId: entryId,
            feedbackPostId,
          }))
        );
      }
    }
    return saved;
  });
}
