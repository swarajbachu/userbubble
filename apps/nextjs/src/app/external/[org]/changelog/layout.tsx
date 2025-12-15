import type { ReactNode } from "react";

type ChangelogLayoutProps = {
  children: ReactNode;
  params: Promise<{ org: string }>;
};

export default async function ChangelogLayout({
  children,
  params,
}: ChangelogLayoutProps) {
  const { org } = await params;

  return (
    <>
      <link
        href="/changelog/feed.xml"
        rel="alternate"
        title="Changelog RSS Feed"
        type="application/rss+xml"
      />
      {children}
    </>
  );
}
