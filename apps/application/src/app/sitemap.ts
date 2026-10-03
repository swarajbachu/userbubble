import type { MetadataRoute } from "next";
import { indexOrganizations, publicUrl } from "~/lib/public-sitemap";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return (await indexOrganizations()).flatMap(({ slug }) =>
    ["", "/feedback", "/roadmap", "/changelog"].map((path) => ({
      url: publicUrl(slug, path),
    }))
  );
}
