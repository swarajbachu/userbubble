import type { MetadataRoute } from "next";
import { source } from "@/lib/source";
import { docsUrl } from "@/lib/urls";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", ...source.getPages().map((page) => page.url)].map((path) => ({
    url: docsUrl(path),
  }));
}
