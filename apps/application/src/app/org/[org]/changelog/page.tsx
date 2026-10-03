import { serverReads } from "@userbubble/api/management";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getApplicationContext } from "~/lib/application-context";
import { getOrgContext } from "~/lib/get-org-context";
import { getOrganization } from "~/lib/get-organization";
import { ChangelogBoard } from "./_components/changelog-board";
import { ChangelogSkeleton } from "./_components/changelog-skeleton";

type ChangelogPageProps = {
  params: Promise<{ org: string }>;
};

export async function generateMetadata({
  params,
}: ChangelogPageProps): Promise<Metadata> {
  const { org } = await params;
  const organization = await getOrganization(org);

  // Get latest published entries for description
  const entries = await serverReads.publishedReleases(
    await getApplicationContext(),
    organization.id,
    3
  );

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
      url: `/org/${org}/changelog`,
      type: "website",
      images: organization.logo ? [{ url: organization.logo }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${organization.name} Changelog`,
      description,
      images: organization.logo ? [organization.logo] : [],
    },
    alternates: {
      types: {
        "application/rss+xml": `/org/${org}/changelog/feed.xml`,
      },
    },
  };
}

export default async function ChangelogPage({ params }: ChangelogPageProps) {
  const { org } = await params;

  const { organization, member } = await getOrgContext(org);
  const isAdmin = ["owner", "admin"].includes(member.role);

  // Fetch latest entries for structured data
  const entries = await serverReads.publishedReleases(
    await getApplicationContext(),
    organization.id,
    10
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${organization.name} Changelog`,
    description: `Product updates and release notes for ${organization.name}`,
    url: `/org/${org}/changelog`,
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
        ? {
            "@type": "Person",
            name: entry.author.name,
          }
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
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="font-bold text-2xl">Changelog</h1>
          <p className="text-muted-foreground text-sm">
            Product updates and release notes
          </p>
        </div>

        <Suspense fallback={<ChangelogSkeleton />}>
          <ChangelogBoard
            isAdmin={isAdmin}
            org={org}
            organizationId={organization.id}
          />
        </Suspense>
      </div>
    </>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}
