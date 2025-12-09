import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../client";
import { changelogEntry, changelogFeedbackLink } from "./changelog.sql";

/**
 * Get all changelog entries for an organization
 */
export async function getChangelogEntries(
  organizationId: string,
  options?: {
    published?: boolean;
    limit?: number;
    offset?: number;
  }
) {
  const { published, limit = 20, offset = 0 } = options || {};

  const conditions = [eq(changelogEntry.organizationId, organizationId)];

  if (published !== undefined) {
    conditions.push(eq(changelogEntry.isPublished, published));
  }

  const entries = await db.query.changelogEntry.findMany({
    where: and(...conditions),
    orderBy: [desc(changelogEntry.publishedAt), desc(changelogEntry.createdAt)],
    limit,
    offset,
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
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
          email: true,
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
  }
) {
  const [entry] = await db
    .update(changelogEntry)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(changelogEntry.id, entryId))
    .returning();

  return entry;
}

/**
 * Publish a changelog entry
 */
export async function publishChangelogEntry(entryId: string) {
  const [entry] = await db
    .update(changelogEntry)
    .set({
      isPublished: true,
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(changelogEntry.id, entryId))
    .returning();

  return entry;
}

/**
 * Delete a changelog entry
 */
export async function deleteChangelogEntry(entryId: string) {
  await db.delete(changelogEntry).where(eq(changelogEntry.id, entryId));
}

/**
 * Link feedback posts to a changelog entry
 */
export async function linkFeedbackToChangelog(
  changelogEntryId: string,
  feedbackPostIds: string[]
) {
  if (feedbackPostIds.length === 0) {
    return [];
  }

  // Get existing links
  const existingLinks = await db.query.changelogFeedbackLink.findMany({
    where: eq(changelogFeedbackLink.changelogEntryId, changelogEntryId),
  });

  const existingPostIds = existingLinks.map((link) => link.feedbackPostId);

  // Only insert new links
  const newPostIds = feedbackPostIds.filter(
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
}

/**
 * Unlink feedback posts from a changelog entry
 */
export async function unlinkFeedbackFromChangelog(
  changelogEntryId: string,
  feedbackPostIds: string[]
) {
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
