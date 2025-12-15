import { getChangelogEntries } from "@critichut/db/queries";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ChangelogBoard } from "~/components/changelog/changelog-board";
import { getOrganization } from "~/lib/get-organization";

type ExternalChangelogPageProps = {
  params: Promise<{ org: string }>;
};

export async function generateMetadata({
  params,
}: ExternalChangelogPageProps): Promise<Metadata> {
  const { org } = await params;
  const organization = await getOrganization(org);

  const entries = await getChangelogEntries(organization.id, {
    published: true,
    limit: 3,
  });

  const latestVersions = entries
    .filter((e) => e.version)
    .map((e) => `v${e.version}`)
    .slice(0, 3)
    .join(", ");

  const description = latestVersions
    ? `Latest updates: ${latestVersions}. View all product updates and release notes for ${organization.name}.`
    : `Product updates and release notes for ${organization.name}.`;

  return {
    title: `Changelog - ${organization.name}`,
    description,
    openGraph: {
      title: `${organization.name} Changelog`,
      description,
      url: `/external/${org}/changelog`,
      type: "website",
      images: organization.logoUrl ? [{ url: organization.logoUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${organization.name} Changelog`,
      description,
      images: organization.logoUrl ? [organization.logoUrl] : [],
    },
    alternates: {
      types: {
        "application/rss+xml": `/external/${org}/changelog/feed.xml`,
      },
    },
  };
}

export default async function ExternalChangelogPage({
  params,
}: ExternalChangelogPageProps) {
  const { org } = await params;
  const organization = await getOrganization(org);

  const entries = await getChangelogEntries(organization.id, {
    published: true,
    limit: 10,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${organization.name} Changelog`,
    description: `Product updates and release notes for ${organization.name}`,
    url: `/external/${org}/changelog`,
    blogPost: entries.map((entry) => ({
      "@type": "BlogPosting",
      headline: entry.version
        ? `v${entry.version}: ${entry.title}`
        : entry.title,
      description: stripHtml(entry.description).substring(0, 200),
      datePublished:
        entry.publishedAt?.toISOString() ?? entry.createdAt.toISOString(),
      dateModified: entry.updatedAt.toISOString(),
      author: entry.author
        ? { "@type": "Person", name: entry.author.name }
        : undefined,
      image: entry.coverImageUrl,
      keywords: entry.tags?.join(", "),
    })),
  };

  return (
    <>
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is safe with JSON.stringify
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
      <div className="w-full">
        <div className="mb-6">
          <h1 className="font-bold text-2xl">Changelog</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Stay updated with our latest releases and improvements
          </p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <ChangelogBoard org={org} organizationId={organization.id} />
        </Suspense>
      </div>
    </>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}
