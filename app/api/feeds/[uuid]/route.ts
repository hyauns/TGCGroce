export const dynamic = "force-dynamic"
// Extend timeout for large feeds (Vercel Pro: 60s, Hobby: 10s)
export const maxDuration = 60

import { getFeedConfigurationById, streamFeedProducts, type FeedProductRow } from "@/lib/repositories/feeds"
import { siteUrl } from "@/lib/site-config"

/**
 * GET /api/feeds/[uuid]/route
 *
 * Public, unauthenticated endpoint. Google Merchant Center crawls this URL.
 *
 * Architecture:
 *   1. Look up the FeedConfiguration by UUID
 *   2. Create a ReadableStream
 *   3. Loop: fetch 500 products at a time via OFFSET/LIMIT
 *   4. For each batch, serialize each product to an <item> XML block
 *      and enqueue it to the stream immediately
 *   5. When a batch returns < 500 rows, write the closing tags and close
 *
 * Memory Safety:
 *   At most 500 product rows (~200KB) are held in memory at any time.
 *   The stream flushes each batch before fetching the next.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const { uuid } = await params

  // Basic UUID format validation to prevent SQL injection via malformed input
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(uuid)) {
    return new Response("Not Found", { status: 404 })
  }

  const config = await getFeedConfigurationById(uuid)
  if (!config) {
    return new Response("Not Found", { status: 404 })
  }

  const CHUNK_SIZE = 500
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ── XML Header ───────────────────────────────────────────────
        controller.enqueue(encoder.encode(
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n` +
          `<channel>\n` +
          `<title>TCG Lore - ${escapeXml(config.name)}</title>\n` +
          `<link>${siteUrl}</link>\n` +
          `<description>Google Merchant Center product feed: ${escapeXml(config.name)}</description>\n`
        ))

        // ── Paginated product streaming ──────────────────────────────
        let offset = 0
        let hasMore = true

        while (hasMore) {
          const products = await streamFeedProducts(config, offset, CHUNK_SIZE)

          for (const product of products) {
            controller.enqueue(encoder.encode(buildItemXml(product)))
          }

          if (products.length < CHUNK_SIZE) {
            hasMore = false
          } else {
            offset += CHUNK_SIZE
          }
        }

        // ── Close tags ───────────────────────────────────────────────
        controller.enqueue(encoder.encode(`</channel>\n</rss>\n`))
        controller.close()
      } catch (error) {
        console.error("[feeds/xml] Stream error:", error)
        controller.error(error)
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Feed-Id": config.id,
      "X-Feed-Name": config.name,
    },
  })
}

// ============================================================
// XML Helpers
// ============================================================

/**
 * Escape special XML characters to prevent malformed output.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/**
 * Strip HTML tags from a string (for product descriptions).
 */
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim()
}

/**
 * Build the product slug from the name.
 */
function buildSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Resolve the absolute image URL.
 * Handles:
 *   - Already-absolute URLs (https://...)
 *   - Relative paths (/images/...)
 *   - CDN URLs that don't need prefixing
 */
function resolveImageUrl(imageUrl: string | null): string {
  if (!imageUrl) return `${siteUrl}/placeholder.png`
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl
  }
  return `${siteUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`
}

/**
 * Map stock_quantity + is_pre_order to GMC availability string.
 */
function mapAvailability(stockQuantity: number, isPreOrder: boolean | null): string {
  if (isPreOrder) return "preorder"
  return stockQuantity > 0 ? "in_stock" : "out_of_stock"
}

/**
 * Map product_type to GMC condition.
 * Sealed products → new. Singles/Cards → new (TCG singles are "new" product condition).
 */
function mapCondition(): string {
  return "new"
}

/**
 * Build a single <item> block for one product.
 * Strict GMC specification compliance.
 */
function buildItemXml(product: FeedProductRow): string {
  const slug = buildSlug(product.name)
  const price = parseFloat(product.price || "0").toFixed(2)
  const description = product.description
    ? stripHtml(product.description).slice(0, 5000)
    : product.name
  const imageUrl = resolveImageUrl(product.image_url)
  const availability = mapAvailability(product.stock_quantity, product.is_pre_order)
  const condition = mapCondition()
  const brand = product.brands || "TCG Lore"
  const productTypeLabel = product.product_type?.toLowerCase().includes("sealed")
    ? "Sealed"
    : "Singles"

  return (
    `<item>\n` +
    `  <g:id>${product.id}</g:id>\n` +
    `  <g:title>${escapeXml(product.name)}</g:title>\n` +
    `  <g:description>${escapeXml(description)}</g:description>\n` +
    `  <g:link>${siteUrl}/product/${slug}</g:link>\n` +
    `  <g:image_link>${escapeXml(imageUrl)}</g:image_link>\n` +
    `  <g:price>${price} USD</g:price>\n` +
    `  <g:availability>${availability}</g:availability>\n` +
    `  <g:condition>${condition}</g:condition>\n` +
    `  <g:brand>${escapeXml(brand)}</g:brand>\n` +
    `  <g:google_product_category>2363</g:google_product_category>\n` +
    `  <g:identifier_exists>no</g:identifier_exists>\n` +
    `  <g:custom_label_0>${productTypeLabel}</g:custom_label_0>\n` +
    (product.rarity ? `  <g:custom_label_1>${escapeXml(product.rarity)}</g:custom_label_1>\n` : ``) +
    (product.category_name ? `  <g:product_type>${escapeXml(product.category_name)}</g:product_type>\n` : ``) +
    `</item>\n`
  )
}
