import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/site-config"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteUrl

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/*", "/api/*", "/checkout/*", "/cart", "/account/*"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
