import { getPublicOrganization } from "~/lib/get-organization";
import { publicUrl } from "~/lib/public-content";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params;
  await getPublicOrganization(org);
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /embed/\nSitemap: ${publicUrl(org, "/sitemap.xml")}\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}
