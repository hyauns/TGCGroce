import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/site-config"
import { getSitemapProductsBatch, getTotalActiveProductsCount } from "@/lib/repositories/sitemap"

export const revalidate = 86400 // Cache for 24 hours

// Fetch up to 10,000 URLs per sitemap chunk to stay well under Google's 50k limit and improve TTFB
const CHUNK_SIZE = 10000

export async function generateSitemaps() {
  const totalProducts = await getTotalActiveProductsCount()
  const totalPages = Math.ceil(totalProducts / CHUNK_SIZE)
  
  const sitemaps = [{ id: 0 }] // id: 0 for core routes
  for (let i = 0; i < totalPages; i++) {
    sitemaps.push({ id: i + 1 }) // id: 1..N for product chunks
  }
  return sitemaps
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl
  const now = new Date()

  if (id === 0) {
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
    return coreRoutes
  }

  // Fetch product chunk for id > 0
  const chunkIndex = id - 1
  const offset = chunkIndex * CHUNK_SIZE
  const productsResult = await getSitemapProductsBatch(offset, CHUNK_SIZE)

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

  return productRoutes
}
