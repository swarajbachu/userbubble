import { getChangelogEntries, getFeedbackPosts } from "@critichut/db/queries";
import type { MetadataRoute } from "next";
import { auth } from "~/auth/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Get all organizations using Better Auth
  const orgs = await auth.api.listOrganizations({
    headers: new Headers(),
  });

  const publicPages: MetadataRoute.Sitemap = [];

  for (const org of orgs) {
    // Changelog pages
    const changelogEntries = await getChangelogEntries(org.id, {
      published: true,
      limit: 1, // Only need latest for lastModified
    });

    if (changelogEntries.length > 0) {
      const changelogEntry = changelogEntries[0];
      if (!changelogEntry) {
        continue;
      }
      publicPages.push({
        url: `${baseUrl}/external/${org.slug}/changelog`,
        lastModified: new Date(
          changelogEntry.publishedAt ?? changelogEntry.updatedAt
        ),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    // Feedback pages
    const feedbackPosts = await getFeedbackPosts(org.id, {
      sortBy: "recent",
    });

    if (feedbackPosts.length > 0) {
      // Add feedback index page
      publicPages.push({
        url: `${baseUrl}/external/${org.slug}/feedback`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      });

      // Add individual feedback posts (top 50)
      for (const post of feedbackPosts.slice(0, 50)) {
        publicPages.push({
          url: `${baseUrl}/external/${org.slug}/feedback/${post.post.id}`,
          lastModified: new Date(post.post.updatedAt),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }

    // Roadmap page
    publicPages.push({
      url: `${baseUrl}/external/${org.slug}/roadmap`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });

    // Organization portal home
    publicPages.push({
      url: `${baseUrl}/external/${org.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    });
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...publicPages,
  ];
}
