import { siteUrl } from "@/lib/site-config"
import { getTotalActiveProductsCount } from "@/lib/repositories/sitemap"

export async function GET() {
  const CHUNK_SIZE = 10000
  const totalProducts = await getTotalActiveProductsCount()
  const totalProductChunks = Math.ceil(totalProducts / CHUNK_SIZE)

  let sitemaps = []
  
  // ID 0 represents the static site map chunk
  sitemaps.push(`<sitemap><loc>${siteUrl}/sitemap/0.xml</loc></sitemap>`)

  for (let i = 1; i <= totalProductChunks; i++) {
    sitemaps.push(`<sitemap><loc>${siteUrl}/sitemap/${i}.xml</loc></sitemap>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemaps.join("\n  ")}
</sitemapindex>`

  return new Response(xml, {
    headers: {
      "Content-Type": "text/xml",
    },
  })
}
