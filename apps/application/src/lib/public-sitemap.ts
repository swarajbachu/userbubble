import "server-only";
import {
  executeOperation,
  publicIndexOperations,
} from "@userbubble/api/management";
import { auth } from "~/auth/server";

const context = () => ({
  authApi: auth.api,
  session: null,
  identifiedOrgId: null,
  isIdentified: false,
});
export const indexOrganizations = () =>
  executeOperation(publicIndexOperations.organizations, context(), {});
export const indexCounts = (organizationId: string) =>
  executeOperation(publicIndexOperations.counts, context(), { organizationId });
export const indexItems = (
  organizationId: string,
  kind: "feedback" | "changelog",
  page: number
) =>
  executeOperation(publicIndexOperations.items, context(), {
    organizationId,
    kind,
    page,
  });
const xml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
export function sitemapResponse(
  urls: { url: string; updatedAt?: Date }[],
  index = false
) {
  const root = index ? "sitemapindex" : "urlset";
  const item = index ? "sitemap" : "url";
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><${root} xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((value) => `<${item}><loc>${xml(value.url)}</loc>${value.updatedAt ? `<lastmod>${value.updatedAt.toISOString()}</lastmod>` : ""}</${item}>`).join("")}</${root}>`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    }
  );
}
export { publicUrl } from "./public-content";
