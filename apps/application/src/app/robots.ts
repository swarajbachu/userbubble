import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/external/*", "/sign-in", "/sign-up"],
        disallow: ["/org/*", "/api/", "/dashboard", "/complete"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
