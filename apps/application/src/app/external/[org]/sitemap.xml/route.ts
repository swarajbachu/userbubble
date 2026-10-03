import { getPublicOrganization } from "~/lib/get-organization";
import { indexCounts, publicUrl, sitemapResponse } from "~/lib/public-sitemap";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params;
  const organization = await getPublicOrganization(org);
  const counts = await indexCounts(organization.id);
  const urls = [{ url: publicUrl(org, "/sitemap/pages/0") }];
  for (const kind of ["feedback", "changelog"] as const) {
    for (let page = 0; page < Math.ceil(counts[kind] / 10_000); page += 1) {
      urls.push({ url: publicUrl(org, `/sitemap/${kind}/${page}`) });
    }
  }
  return sitemapResponse(urls, true);
}
