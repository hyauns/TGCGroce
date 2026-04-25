import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/site-config"
import { getSitemapProductsBatch } from "@/lib/repositories/sitemap"

// Fetch up to 50,000 URLs to perfectly balance TTFB latency and stay below Google's 50k limit
const CHUNK_SIZE = 50000

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl
  const now = new Date()

  // Resolve the lightweight Core / Global application routing table
  const coreRoutes: MetadataRoute.Sitemap = [
    {
        url: baseUrl,
        lastModified: now,
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${baseUrl}/products`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5,
      },
      {
        url: `${baseUrl}/faq`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5,
      },
      {
        url: `${baseUrl}/shipping`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.4,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5,
      },
      {
        url: `${baseUrl}/privacy`,
        lastModified: now,
        changeFrequency: "yearly",
        priority: 0.3,
      },
      {
        url: `${baseUrl}/terms`,
        lastModified: now,
        changeFrequency: "yearly",
        priority: 0.3,
      },
      {
        url: `${baseUrl}/returns`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.4,
      },
      {
        url: `${baseUrl}/cookies`,
        lastModified: now,
        changeFrequency: "yearly",
        priority: 0.3,
      },
      {
        url: `${baseUrl}/best-price-guarantee`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.4,
      },
      {
        url: `${baseUrl}/preorder-info`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.5,
      },
    ]

  // Fetch massive batch of products up to 50k limit
  const productsResult = await getSitemapProductsBatch(0, CHUNK_SIZE)

  const productRoutes: MetadataRoute.Sitemap = productsResult.map((product) => {
    // Mimics the fallback slug generator algorithm reliably
    const computedSlug = product.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    return {
      url: `${baseUrl}/products/${computedSlug}`,
      lastModified: product.updated_at,
      changeFrequency: "weekly",
      priority: 0.7,
    }
  })

  return [...coreRoutes, ...productRoutes]
}
