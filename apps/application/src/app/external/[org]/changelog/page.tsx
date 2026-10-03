import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPublicOrganization } from "~/lib/get-organization";
import { contentText, publicReleases, publicUrl } from "~/lib/public-content";

type Props = {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ page?: string }>;
};
const pageNumber = (value?: string) =>
  Math.max(1, Math.min(100_000, Number.parseInt(value ?? "1", 10) || 1));
export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { org } = await params;
  const organization = await getPublicOrganization(org);
  const page = pageNumber((await searchParams).page);
  const url = publicUrl(org, `/changelog${page > 1 ? `?page=${page}` : ""}`);
  const title = `What's new · ${organization.name}${page > 1 ? ` · Page ${page}` : ""}`;
  const description = `Product updates, improvements, and release notes from ${organization.name}.`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      types: { "application/rss+xml": publicUrl(org, "/changelog/feed.xml") },
    },
    openGraph: { title, description, url, type: "website" },
  };
}
export default async function ChangelogPage({ params, searchParams }: Props) {
  const { org } = await params;
  const organization = await getPublicOrganization(org);
  const page = pageNumber((await searchParams).page);
  const entries = await publicReleases(organization.id, page);
  return (
    <div className="mx-auto max-w-3xl py-5">
      <header className="mb-10">
        <p className="text-muted-foreground text-xs">{organization.name}</p>
        <h1 className="mt-2 font-medium text-3xl tracking-tight">What's new</h1>
        <p className="mt-3 text-muted-foreground text-sm">
          The latest improvements, big and small.
        </p>
        <Link
          className="mt-3 inline-block text-muted-foreground text-xs underline underline-offset-4"
          href={publicUrl(org, "/changelog/feed.xml")}
        >
          Subscribe with RSS
        </Link>
      </header>
      <div className="space-y-8">
        {entries.slice(0, 20).map((entry) => (
          <article
            className="squircle overflow-hidden rounded-2xl border bg-card"
            key={entry.id}
          >
            {entry.coverImageUrl && (
              <div className="aspect-[2.4/1] overflow-hidden bg-muted">
                <Image
                  alt=""
                  className="h-full w-full object-cover"
                  height={500}
                  loading="lazy"
                  src={entry.coverImageUrl}
                  unoptimized
                  width={1200}
                />
              </div>
            )}
            <div className="p-5 sm:p-7">
              <div className="flex items-center gap-3 text-muted-foreground text-xs">
                <time
                  dateTime={(
                    entry.publishedAt ?? entry.createdAt
                  ).toISOString()}
                >
                  {(entry.publishedAt ?? entry.createdAt).toLocaleDateString(
                    "en-US",
                    { dateStyle: "long", timeZone: "UTC" }
                  )}
                </time>
                {entry.version && (
                  <span className="rounded-md bg-muted px-2 py-1 font-mono">
                    v{entry.version}
                  </span>
                )}
              </div>
              <h2 className="mt-4 font-medium text-xl tracking-tight">
                <Link
                  className="hover:underline"
                  href={publicUrl(org, `/changelog/${entry.id}`)}
                >
                  {entry.title}
                </Link>
              </h2>
              <p className="mt-3 line-clamp-3 text-muted-foreground text-sm leading-relaxed">
                {contentText(entry.description)}
              </p>
              <div className="mt-5 flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">
                  {entry.author?.name ?? organization.name}
                </span>
                <Link
                  className="underline underline-offset-4"
                  href={publicUrl(org, `/changelog/${entry.id}`)}
                >
                  Read release <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      {entries.length === 0 && (
        <p className="squircle rounded-2xl border p-8 text-muted-foreground text-sm">
          No releases here yet. Check back for the next update.
        </p>
      )}
      <nav
        aria-label="Release pages"
        className="mt-8 flex justify-between text-sm"
      >
        {page > 1 ? (
          <Link href={publicUrl(org, `/changelog?page=${page - 1}`)}>
            ← Newer releases
          </Link>
        ) : (
          <span />
        )}
        {entries.length > 20 && (
          <Link href={publicUrl(org, `/changelog?page=${page + 1}`)}>
            Older releases →
          </Link>
        )}
      </nav>
    </div>
  );
}
