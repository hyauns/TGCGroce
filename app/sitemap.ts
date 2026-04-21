import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/site-config"
import { getTotalActiveProductsCount, getSitemapProductsBatch } from "@/lib/repositories/sitemap"

// We chunk products by 10,000 URLs to perfectly balance TTFB latency and stay far below Google's 50k limit
const CHUNK_SIZE = 10000

export async function generateSitemaps() {
  const totalProducts = await getTotalActiveProductsCount()
  
  // Calculate how many product specific sitemap partitions we need
  const totalProductChunks = Math.ceil(totalProducts / CHUNK_SIZE)

  // Initialize with exactly 1 entry minimum (ID 0) which always holds the static and category core routes
  const sitemaps = [{ id: 0 }]

  // Push subsequent IDs incrementally for memory-friendly localized product batches
  for (let i = 1; i <= totalProductChunks; i++) {
    sitemaps.push({ id: i })
  }

  return sitemaps
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl
  const now = new Date()

  // ID 0: Resolve only the lightweight Core / Global application routing table
  if (id === 0) {
    return [
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
  }

  // IDs >= 1: Resolves Paginated Product Partitions (Database queries)
  // Determine standard database pagination ranges
  // Offset formula: chunk ID 1 = index 0. chunk ID 2 = index 10000.
  const offset = (id - 1) * CHUNK_SIZE
  
  // Safely grab only the bare minimum row properties isolated away from massive JOIN operations
  const productsResult = await getSitemapProductsBatch(offset, CHUNK_SIZE)

  // Dynamically map over product chunks 
  return productsResult.map((product) => {
    // Mimics the fallback slug generator algorithm reliably
    const computedSlug = product.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    return {
      url: `${baseUrl}/products/${computedSlug}`,
      lastModified: product.updated_at,
      changeFrequency: "weekly",
      priority: 0.7, // Assume base priority for dynamic products since hot/new is irrelevant to SEO crawlers at this scale
    }
  })
}
