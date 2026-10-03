import { getPublicOrganization } from "~/lib/get-organization";
import { indexItems, publicUrl, sitemapResponse } from "~/lib/public-sitemap";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ org: string; kind: string; page: string }> }
) {
  const { org, kind, page } = await params;
  const organization = await getPublicOrganization(org);
  if (kind === "pages" && page === "0") {
    return sitemapResponse(
      ["", "/feedback", "/roadmap", "/changelog"].map((path) => ({
        url: publicUrl(org, path),
      }))
    );
  }
  const number = Number(page);
  if (
    (kind !== "feedback" && kind !== "changelog") ||
    !Number.isSafeInteger(number) ||
    number < 0
  ) {
    return new Response("Not found", { status: 404 });
  }
  const items = await indexItems(organization.id, kind, number);
  return sitemapResponse(
    items.map((item) => ({
      url: publicUrl(org, `/${kind}/${item.id}`),
      updatedAt: item.updatedAt,
    }))
  );
}
