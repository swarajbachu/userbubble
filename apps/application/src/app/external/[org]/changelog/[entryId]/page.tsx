import { ApplicationError } from "@userbubble/api/management";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getPublicOrganization } from "~/lib/get-organization";
import {
  contentText,
  jsonLd,
  publicRelease,
  publicUrl,
  releaseHtml,
} from "~/lib/public-content";

type Props = { params: Promise<{ org: string; entryId: string }> };
const getEntry = cache(async (org: string, id: string) => {
  const organization = await getPublicOrganization(org);
  try {
    const entry = await publicRelease(id);
    if (
      !entry ||
      entry.organizationId !== organization.id ||
      !entry.isPublished
    ) {
      notFound();
    }
    return { organization, entry };
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
});
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { org, entryId } = await params;
  const { organization, entry } = await getEntry(org, entryId);
  const url = publicUrl(org, `/changelog/${entry.id}`);
  const title = `${entry.title} · ${organization.name}`;
  const description = contentText(entry.description).slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: (entry.publishedAt ?? entry.createdAt).toISOString(),
      modifiedTime: entry.updatedAt.toISOString(),
      images: entry.coverImageUrl ? [{ url: entry.coverImageUrl }] : [],
    },
    twitter: {
      card: entry.coverImageUrl ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}
export default async function ReleasePage({ params }: Props) {
  const { org, entryId } = await params;
  const { organization, entry } = await getEntry(org, entryId);
  const date = entry.publishedAt ?? entry.createdAt;
  const structured = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: entry.title,
    description: contentText(entry.description).slice(0, 200),
    datePublished: date.toISOString(),
    dateModified: entry.updatedAt.toISOString(),
    url: publicUrl(org, `/changelog/${entry.id}`),
    author: {
      "@type": entry.author ? "Person" : "Organization",
      name: entry.author?.name ?? organization.name,
    },
    image: entry.coverImageUrl ?? undefined,
  };
  return (
    <article className="mx-auto max-w-3xl py-5">
      <Link
        className="text-muted-foreground text-sm hover:text-foreground"
        href={publicUrl(org, "/changelog")}
      >
        ← All releases
      </Link>
      <header className="mt-8 border-b pb-7">
        <time
          className="font-mono text-muted-foreground text-xs"
          dateTime={date.toISOString()}
        >
          {date.toLocaleDateString("en-US", {
            dateStyle: "long",
            timeZone: "UTC",
          })}
        </time>
        <h1 className="mt-4 font-medium text-3xl leading-tight tracking-tight sm:text-4xl">
          {entry.title}
        </h1>
        <p className="mt-4 text-muted-foreground text-sm">
          {entry.author?.name ?? organization.name}
          {entry.version && ` · v${entry.version}`}
        </p>
      </header>
      {entry.coverImageUrl && (
        <Image
          alt=""
          className="squircle mt-7 h-auto w-full rounded-2xl"
          height={500}
          src={entry.coverImageUrl}
          unoptimized
          width={1200}
        />
      )}
      <div
        className="tiptap-content prose prose-sm dark:prose-invert mt-7 max-w-none break-words leading-relaxed"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Server-side allowlist sanitation.
        dangerouslySetInnerHTML={{ __html: releaseHtml(entry.description) }}
      />
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Escaped JSON prevents HTML script termination.
        dangerouslySetInnerHTML={{ __html: jsonLd(structured) }}
        type="application/ld+json"
      />
    </article>
  );
}
