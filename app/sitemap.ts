import type { MetadataRoute } from "next"
import { getAllProducts } from "@/lib/products"
import { siteUrl } from "@/lib/site-config"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl
  const products = await getAllProducts()
  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
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
    {
      url: `${baseUrl}/wishlist`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.4,
    },
  ]

  // Dynamic product pages
  const productPages: MetadataRoute.Sitemap = products.map((product) => {
    const slug = product.slug || product.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    return {
      url: `${baseUrl}/products/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: product.isHot || product.isNew ? 0.8 : 0.7,
    }
  })

  return [...staticPages, ...productPages]
}
