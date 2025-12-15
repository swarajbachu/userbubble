import { getChangelogEntries } from "@userbubble/db/queries";
import { getOrganization } from "~/lib/get-organization";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params;
  const organization = await getOrganization(org);

  // Fetch published entries only
  const entries = await getChangelogEntries(organization.id, {
    published: true,
    limit: 50, // RSS best practice: 50-100 items
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const feedUrl = `${baseUrl}/org/${org}/changelog`;

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(organization.name)} Changelog</title>
    <link>${feedUrl}</link>
    <description>Product updates and release notes for ${escapeXml(organization.name)}</description>
    <language>en</language>
    <atom:link href="${feedUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${
      organization.logo
        ? `<image>
      <url>${escapeXml(organization.logo)}</url>
      <title>${escapeXml(organization.name)}</title>
      <link>${feedUrl}</link>
    </image>`
        : ""
    }
    ${entries
      .map(
        (entry) => `
    <item>
      <title>${escapeXml(entry.version ? `v${entry.version}: ${entry.title}` : entry.title)}</title>
      <link>${feedUrl}#${entry.id}</link>
      <guid isPermaLink="false">${entry.id}</guid>
      <pubDate>${new Date(entry.publishedAt ?? entry.createdAt).toUTCString()}</pubDate>
      ${entry.author ? `<author>${escapeXml(entry.author.name)}</author>` : ""}
      <description><![CDATA[${entry.description}]]></description>
      ${entry.tags?.map((tag) => `<category>${escapeXml(tag)}</category>`).join("\n      ") || ""}
      ${entry.coverImageUrl ? `<enclosure url="${escapeXml(entry.coverImageUrl)}" type="image/jpeg"/>` : ""}
    </item>`
      )
      .join("\n")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600", // Cache for 1 hour
    },
  });
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
