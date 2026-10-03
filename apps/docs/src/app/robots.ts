import type { MetadataRoute } from "next";
import { docsUrl } from "@/lib/urls";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: docsUrl("/sitemap.xml"),
  };
}
