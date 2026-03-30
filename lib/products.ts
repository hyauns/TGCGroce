import "server-only"
import { neon } from "@neondatabase/serverless"
import { generateReviewCount } from "./review-generator"
import { generateRealisticSalesCount } from "./sales-generator"

// ============================================================
// Public types — matching the Product interface expected by pages
// ============================================================

export interface Product {
  id: number
  name: string
  slug: string
  price: number
  originalPrice?: number
  image: string
  category: string        // Display name, e.g. "Pokemon TCG"
  categorySlug?: string   // URL slug, e.g. "pokemon-tcg"
  categoryId?: number     // FK to product_categories.id
  rating?: number
  reviews?: number
  inStock: boolean
  isNew: boolean
  isHot: boolean
  isPreOrder: boolean
  preOrderDate?: string
  releaseDate?: string
  salesCount?: number
  description?: string
  features?: string[]
  specifications?: Record<string, string | undefined>
  stock?: number
  condition?: string
}

export interface CategoryMeta {
  id: number
  name: string
  slug: string
  description: string | null
}

// ============================================================
// Internal DB row types
// ============================================================

/** Raw row from the `products` table only */
interface DbProductRaw {
  id: number
  name: string
  category: string          // legacy varchar column (still populated)
  category_id: number | null // new FK column (nullable during migration)
  price: string
  original_price: string | null
  cost: string | null
  stock_quantity: number
  is_active: boolean
  created_at: Date
  updated_at?: Date
}

/** Row after JOIN with product_categories — category name & slug resolved authoritatively */
interface DbProductJoined extends DbProductRaw {
  pc_id: number | null
  pc_name: string | null   // authoritative category name from product_categories
  pc_slug: string | null   // authoritative category slug from product_categories
  pc_description: string | null
  // New columns added in migration
  is_pre_order: boolean | null   // NULL when column doesn't exist yet (caught via try/catch)
  release_date: Date | string | null
}

// ============================================================
// Database connection helper
// ============================================================

// ============================================================
// Database connection helper
// ============================================================

function getSqlConnection() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING

  if (!url) {
    // Guard: this log should only ever appear server-side.
    // The 'server-only' import above prevents client bundling,
    // but we double-guard here for defence in depth.
    if (typeof window === "undefined" && process.env.NODE_ENV !== "production") {
      console.error("[products] No database connection string found")
    }
    return null
  }

  return neon(url)
}

// ============================================================
// Pure utilities — imported from lib/product-utils.ts and
// re-exported here so server components that already import
// from 'lib/products' continue to work without changes.
// CLIENT COMPONENTS must import from 'lib/product-utils' directly.
// ============================================================
export {
  generateCategorySlug,
  normalizeCategoryParam,
  isHotProduct,
  isNewProduct,
} from "./product-utils"

// Internal alias used inside this file's mapper
import {
  generateCategorySlug as _categorySlug,
  isHotProduct as _isHot,
  isNewProduct as _isNew,
} from "./product-utils"

// Internal product-name slug (not exported — use generateSlug from lib/utils instead)
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .replace(/^-+|-+$/g, "")
}

/**
 * Canonical SELECT for all product queries.
 * Returns every column needed by mapJoinedRowToProduct.
 *
 * Join strategy (3-tier, most to least authoritative):
 *   1. products.category_id FK  → product_categories.id
 *   2. products.category string → product_categories.name (soft match)
 *   Whichever resolves first wins; pc_* columns are NULL when neither matches.
 */
const PRODUCT_JOIN_SQL = `
  FROM products p
  LEFT JOIN product_categories pc
         ON (p.category_id IS NOT NULL AND pc.id = p.category_id)
         OR (p.category_id IS NULL     AND pc.name = p.category AND pc.is_active = true)
` as const

// Badge helpers are re-exported above from lib/product-utils.
// No duplicate definitions here.

// ============================================================
// Internal mapper
// ============================================================

function mapJoinedRowToProduct(row: DbProductJoined): Product {
  const slug = generateSlug(row.name)
  const price = Number(row.price) || 0
  const originalPrice = row.original_price ? Number(row.original_price) : undefined

  // Resolve category display name: authoritative JOIN wins, then FK-derived, then raw column
  const categoryName = row.pc_name ?? row.category ?? "Uncategorized"
  const categorySlug = row.pc_slug ?? _categorySlug(categoryName)
  const categoryId = row.pc_id ?? row.category_id ?? undefined

  const image = `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(categoryName)}`

  const stockQuantity = row.stock_quantity || 0
  const inStock = stockQuantity > 0

  // isNew: created in the last 30 days
  const isNew = _isNew(row.created_at)

  // isHot: deterministic pseudo-random, seeded by product id (~30% of items)
  // See isHotProduct() JSDoc in lib/product-utils.ts for rationale.
  const isHot = _isHot(row.id)

  // ─── Seeded rating ──────────────────────────────────────────────────────────
  // No `rating` column exists in the products table yet.
  // We derive a deterministic, product-specific rating using the same seeded
  // Math.sin approach used across review-generator and sales-generator so that
  // all display surfaces (homepage cards, category page, PDP header, review tab)
  // show perfectly consistent numbers from a single source.
  const seedVal = Math.sin(row.id * 9301 + 49297) * 233280
  const norm = seedVal - Math.floor(seedVal)            // 0..1
  const seededRating = Math.round((3.8 + norm * 1.2) * 10) / 10  // 3.8 – 5.0, 1dp

  // ─── Review count (seeded) ────────────────────────────────────────────────
  const reviewFactors = {
    productId: row.id,
    productName: row.name,
    category: categoryName,
    price,
    rating: seededRating,
    isNew,
    isHot,
    isPreOrder: false,
  }
  const seededReviewCount = generateReviewCount(reviewFactors)

  // ─── Sales count (seeded) ─────────────────────────────────────────────────
  const seededSalesCount = generateRealisticSalesCount(
    row.id, price, categoryName, seededRating, isNew, isHot, false,
  )

  // ─── Pre-order & release date ────────────────────────────────────────────
  // Read is_pre_order from DB when available (will be null if column is missing —
  // the try/catch in getPreOrderProducts guards that case at query time).
  const isPreOrder = Boolean(row.is_pre_order)

  // Format release_date as a human-readable string if present.
  // Input may be a JS Date (neon driver), a date string, or null.
  let releaseDate: string | undefined
  if (row.release_date) {
    const d = row.release_date instanceof Date
      ? row.release_date
      : new Date(row.release_date)
    // e.g. "March 15, 2025" — locale-independent, readable on both card & PDP
    releaseDate = d.toLocaleDateString("en-US", {
      year:  "numeric",
      month: "long",
      day:   "numeric",
    })
  }

  return {
    id: row.id,
    name: row.name,
    slug,
    price,
    originalPrice,
    image,
    category: categoryName,
    categorySlug,
    categoryId: typeof categoryId === "number" ? categoryId : undefined,
    rating: seededRating,
    reviews: seededReviewCount,
    inStock,
    isNew,
    isHot,
    isPreOrder,
    releaseDate,
    stock: stockQuantity,
    salesCount: seededSalesCount,
    description: `Premium ${categoryName} trading card product. Shop with confidence at TGC Lore Inc.`,
    features: [
      `${stockQuantity} units available`,
      "Authentic product",
      "Ships within 1-3 business days",
    ],
  }
}

// ============================================================
// Data fetching functions
// ============================================================

/**
 * Fetch all active products, enriched with category metadata via JOIN.
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const sql = getSqlConnection()
    if (!sql) return []

    const rows = await sql`
      SELECT
        p.id, p.name, p.category, p.category_id, p.price, p.original_price,
        p.stock_quantity, p.is_active, p.created_at,
        p.is_pre_order, p.release_date,
        pc.id   AS pc_id,
        pc.name AS pc_name,
        pc.slug AS pc_slug,
        pc.description AS pc_description
      ${sql.unsafe(PRODUCT_JOIN_SQL)}
      WHERE p.is_active = true
      ORDER BY p.created_at DESC
    ` as DbProductJoined[]

    return rows.map(mapJoinedRowToProduct)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[products] Error fetching all products:", error)
    }
    return []
  }
}

/**
 * Fetch a single product by numeric ID, enriched with category JOIN.
 */
export async function getProductById(id: number): Promise<Product | undefined> {
  try {
    const sql = getSqlConnection()
    if (!sql) return undefined

    const rows = await sql`
      SELECT
        p.id, p.name, p.category, p.category_id, p.price, p.original_price,
        p.stock_quantity, p.is_active, p.created_at,
        p.is_pre_order, p.release_date,
        pc.id   AS pc_id,
        pc.name AS pc_name,
        pc.slug AS pc_slug,
        pc.description AS pc_description
      ${sql.unsafe(PRODUCT_JOIN_SQL)}
      WHERE p.is_active = true AND p.id = ${id}
      LIMIT 1
    ` as DbProductJoined[]

    if (!rows[0]) return undefined
    return mapJoinedRowToProduct(rows[0])
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[products] Error fetching product by ID:", error)
    }
    return undefined
  }
}

/**
 * Fetch a single product by its URL slug (derived from name).
 * Performs a full-table scan + in-memory slug match — acceptable because
 * the products table is small. Add a slug column to DB for better perf.
 */
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const sql = getSqlConnection()
    if (!sql) return undefined

    const rows = await sql`
      SELECT
        p.id, p.name, p.category, p.category_id, p.price, p.original_price,
        p.stock_quantity, p.is_active, p.created_at,
        p.is_pre_order, p.release_date,
        pc.id   AS pc_id,
        pc.name AS pc_name,
        pc.slug AS pc_slug,
        pc.description AS pc_description
      ${sql.unsafe(PRODUCT_JOIN_SQL)}
      WHERE p.is_active = true
    ` as DbProductJoined[]

    const match = rows.find((r) => generateSlug(r.name) === slug)
    if (!match) return undefined

    return mapJoinedRowToProduct(match)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[products] Error fetching product by slug:", error)
    }
    return undefined
  }
}

/**
 * Legacy helper — filter by raw category name string.
 * Kept for backward-compat; prefer getProductsByCategorySlug for new code.
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  if (category === "All Categories" || category === "all") return getAllProducts()

  try {
    const sql = getSqlConnection()
    if (!sql) return []

    const rows = await sql`
      SELECT
        p.id, p.name, p.category, p.category_id, p.price, p.original_price,
        p.stock_quantity, p.is_active, p.created_at,
        p.is_pre_order, p.release_date,
        pc.id   AS pc_id,
        pc.name AS pc_name,
        pc.slug AS pc_slug,
        pc.description AS pc_description
      ${sql.unsafe(PRODUCT_JOIN_SQL)}
      WHERE p.is_active = true
        AND (p.category = ${category} OR pc.name = ${category})
      ORDER BY p.created_at DESC
    ` as DbProductJoined[]

    return rows.map(mapJoinedRowToProduct)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[products] Error fetching products by category:", error)
    }
    return []
  }
}

/**
 * Resolve a category slug to its full metadata.
 *
 * Lookup priority:
 *   1. product_categories.slug  (authoritative, uses index)
 *   2. Derived slug from products.category string (fallback during migration)
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryMeta | null> {
  try {
    const sql = getSqlConnection()
    if (!sql) return null

    // Primary: look up in product_categories table
    const rows = await sql`
      SELECT id, name, slug, description
      FROM product_categories
      WHERE slug = ${slug} AND is_active = true
      LIMIT 1
    ` as CategoryMeta[]

    if (rows.length > 0) return rows[0]

    // Fallback: derive from raw category column (migration period)
    const productRows = await sql`
      SELECT DISTINCT category FROM products WHERE is_active = true
    ` as { category: string }[]

    const match = productRows.find((r) => _categorySlug(r.category) === slug)
    if (match) {
      return { id: 0, name: match.category, slug, description: null }
    }

    return null
  } catch {
    return null
  }
}

/**
 * PRIMARY category-filtered product query.
 *
 * Filter strategy — most to least authoritative:
 *   1. products.category_id = product_categories.id WHERE pc.slug = ?
 *      (uses the FK — fast index scan, correct after migration)
 *   2. products.category (varchar) JOIN product_categories ON name = category WHERE pc.slug = ?
 *      (soft-name match — works before category_id is backfilled)
 *   3. Slug-derived match against raw products.category string
 *      (last resort — no product_categories data at all)
 */
export async function getProductsByCategorySlug(slug: string): Promise<Product[]> {
  if (!slug || slug === "all") return getAllProducts()

  const sql = getSqlConnection()
  if (!sql) return []

  try {
    // ── Strategy 1 & 2 combined in one query via LEFT JOIN ──────────────────
    // The PRODUCT_JOIN_SQL already resolves category_id FK first, then
    // falls back to name-match. We filter WHERE the resolved pc.slug matches.
    const rows = await sql`
      SELECT
        p.id, p.name, p.category, p.category_id, p.price, p.original_price,
        p.stock_quantity, p.is_active, p.created_at,
        p.is_pre_order, p.release_date,
        pc.id   AS pc_id,
        pc.name AS pc_name,
        pc.slug AS pc_slug,
        pc.description AS pc_description
      ${sql.unsafe(PRODUCT_JOIN_SQL)}
      WHERE p.is_active = true
        AND pc.slug = ${slug}
        AND pc.is_active = true
      ORDER BY p.created_at DESC
    ` as DbProductJoined[]

    if (rows.length > 0) {
      return rows.map(mapJoinedRowToProduct)
    }

    // ── Strategy 3: Last-resort — no product_categories rows at all ──────────
    // Find a category string whose generated slug matches the URL param,
    // then return all products with that raw category value.
    const categoryRows = await sql`
      SELECT DISTINCT category FROM products WHERE is_active = true
    ` as { category: string }[]

    const matchedCategory = categoryRows.find(
      (r) => _categorySlug(r.category) === slug
    )

    if (!matchedCategory) return [] // Invalid slug → empty state

    const fallbackRows = await sql`
      SELECT
        p.id, p.name, p.category, p.category_id, p.price, p.original_price,
        p.stock_quantity, p.is_active, p.created_at,
        p.is_pre_order, p.release_date,
        NULL::integer AS pc_id,
        NULL::text    AS pc_name,
        NULL::text    AS pc_slug,
        NULL::text    AS pc_description
      FROM products p
      WHERE p.is_active = true AND p.category = ${matchedCategory.category}
      ORDER BY p.created_at DESC
    ` as DbProductJoined[]

    return fallbackRows.map(mapJoinedRowToProduct)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[products] Error fetching products by category slug:", error)
    }
    return []
  }
}

/**
 * Return all active category slugs.
 * Used for sitemap generation and future generateStaticParams.
 */
export async function getAllCategorySlugs(): Promise<string[]> {
  const sql = getSqlConnection()
  if (!sql) return []

  try {
    const rows = await sql`
      SELECT slug
      FROM product_categories
      WHERE is_active = true
      ORDER BY display_order, name
    ` as { slug: string }[]

    if (rows.length > 0) return rows.map((r) => r.slug)

    // Fallback: derive from raw category column
    const productRows = await sql`
      SELECT DISTINCT category FROM products WHERE is_active = true ORDER BY category
    ` as { category: string }[]

    return productRows.map((r) => _categorySlug(r.category))
  } catch {
    return []
  }
}

/**
 * Fetch featured products for the homepage.
 *
 * Query priority:
 *   1. products.is_featured = true  (authoritative flag if column exists)
 *   2. Fallback: products with a discount (original_price IS NOT NULL)
 * Returns up to 8 products.
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const sql = getSqlConnection()
    if (!sql) return []

    // Strategy 1: try is_featured column
    try {
      const featuredRows = await sql`
        SELECT
          p.id, p.name, p.category, p.category_id, p.price, p.original_price,
          p.stock_quantity, p.is_active, p.created_at,
          p.is_pre_order, p.release_date,
          pc.id   AS pc_id,
          pc.name AS pc_name,
          pc.slug AS pc_slug,
          pc.description AS pc_description
        ${sql.unsafe(PRODUCT_JOIN_SQL)}
        WHERE p.is_active = true AND p.is_featured = true
        ORDER BY p.created_at DESC
        LIMIT 8
      ` as DbProductJoined[]

      if (featuredRows.length > 0) return featuredRows.map(mapJoinedRowToProduct)
    } catch {
      // is_featured column not yet added — fall through to discount fallback
    }

    // Strategy 2: products with a discount (visible "sale" items make good featured cards)
    const rows = await sql`
      SELECT
        p.id, p.name, p.category, p.category_id, p.price, p.original_price,
        p.stock_quantity, p.is_active, p.created_at,
        p.is_pre_order, p.release_date,
        pc.id   AS pc_id,
        pc.name AS pc_name,
        pc.slug AS pc_slug,
        pc.description AS pc_description
      ${sql.unsafe(PRODUCT_JOIN_SQL)}
      WHERE p.is_active = true AND p.original_price IS NOT NULL
      ORDER BY p.created_at DESC
      LIMIT 8
    ` as DbProductJoined[]

    // Strategy 3: still empty — return any 8 active products
    if (rows.length === 0) {
      const anyRows = await sql`
        SELECT
          p.id, p.name, p.category, p.category_id, p.price, p.original_price,
          p.stock_quantity, p.is_active, p.created_at,
          p.is_pre_order, p.release_date,
          pc.id   AS pc_id,
          pc.name AS pc_name,
          pc.slug AS pc_slug,
          pc.description AS pc_description
        ${sql.unsafe(PRODUCT_JOIN_SQL)}
        WHERE p.is_active = true
        ORDER BY p.created_at DESC
        LIMIT 8
      ` as DbProductJoined[]
      return anyRows.map(mapJoinedRowToProduct)
    }

    return rows.map(mapJoinedRowToProduct)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[products] Error fetching featured products:", error)
    }
    return []
  }
}

/**
 * Fetch best-selling products for the homepage.
 * Ordered by created_at DESC as a proxy until a sales_count column is added.
 * Returns up to 8 products.
 */
export async function getBestSellingProducts(): Promise<Product[]> {
  try {
    const sql = getSqlConnection()
    if (!sql) return []

    const rows = await sql`
      SELECT
        p.id, p.name, p.category, p.category_id, p.price, p.original_price,
        p.stock_quantity, p.is_active, p.created_at,
        p.is_pre_order, p.release_date,
        pc.id   AS pc_id,
        pc.name AS pc_name,
        pc.slug AS pc_slug,
        pc.description AS pc_description
      ${sql.unsafe(PRODUCT_JOIN_SQL)}
      WHERE p.is_active = true AND p.stock_quantity > 0
      ORDER BY p.created_at DESC
      LIMIT 8
    ` as DbProductJoined[]

    // Fallback: any active products if none have stock
    if (rows.length === 0) {
      const anyRows = await sql`
        SELECT
          p.id, p.name, p.category, p.category_id, p.price, p.original_price,
          p.stock_quantity, p.is_active, p.created_at,
          p.is_pre_order, p.release_date,
          pc.id   AS pc_id,
          pc.name AS pc_name,
          pc.slug AS pc_slug,
          pc.description AS pc_description
        ${sql.unsafe(PRODUCT_JOIN_SQL)}
        WHERE p.is_active = true
        ORDER BY p.created_at DESC
        LIMIT 8
      ` as DbProductJoined[]
      return anyRows.map(mapJoinedRowToProduct)
    }

    return rows.map(mapJoinedRowToProduct)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[products] Error fetching best selling products:", error)
    }
    return []
  }
}

/**
 * Fetch pre-order products for the homepage.
 *
 * Query priority:
 *   1. products.condition = 'pre-order'  (explicit flag)
 *   2. Fallback: products.is_preorder = true  (alternate column name)
 *   3. Returns [] gracefully when neither column exists
 *
 * Returns up to 8 products, mapped with isPreOrder = true.
 */
export async function getPreOrderProducts(): Promise<Product[]> {
  const sql = getSqlConnection()
  if (!sql) return []

  // ── Primary: new is_pre_order boolean column ──────────────────────────────
  // This is the authoritative path once the migration has run.
  try {
    const rows = await sql`
      SELECT
        p.id, p.name, p.category, p.category_id, p.price, p.original_price,
        p.stock_quantity, p.is_active, p.created_at,
        p.is_pre_order, p.release_date,
        pc.id   AS pc_id,
        pc.name AS pc_name,
        pc.slug AS pc_slug,
        pc.description AS pc_description
      ${sql.unsafe(PRODUCT_JOIN_SQL)}
      WHERE p.is_active = true
        AND p.is_pre_order = true
      ORDER BY p.release_date ASC NULLS LAST, p.created_at DESC
      LIMIT 8
    ` as DbProductJoined[]

    if (rows.length > 0) {
      return rows.map(mapJoinedRowToProduct)
    }
  } catch {
    // is_pre_order column doesn't exist yet — fall through to legacy strategy
  }

  // ── Legacy fallback 1: condition = 'pre-order' varchar column ─────────────
  try {
    const rows = await sql`
      SELECT
        p.id, p.name, p.category, p.category_id, p.price, p.original_price,
        p.stock_quantity, p.is_active, p.created_at,
        NULL::boolean AS is_pre_order,
        NULL::date    AS release_date,
        pc.id   AS pc_id,
        pc.name AS pc_name,
        pc.slug AS pc_slug,
        pc.description AS pc_description
      ${sql.unsafe(PRODUCT_JOIN_SQL)}
      WHERE p.is_active = true
        AND LOWER(p.condition) = 'pre-order'
      ORDER BY p.created_at DESC
      LIMIT 8
    ` as DbProductJoined[]

    if (rows.length > 0) {
      // Override isPreOrder to true — we know these are pre-orders from the condition column
      return rows.map((r) => ({ ...mapJoinedRowToProduct(r), isPreOrder: true }))
    }
  } catch {
    // condition column doesn't exist — try is_preorder boolean
  }

  // ── Legacy fallback 2: is_preorder boolean (alternate column name) ─────────
  try {
    const rows = await sql`
      SELECT
        p.id, p.name, p.category, p.category_id, p.price, p.original_price,
        p.stock_quantity, p.is_active, p.created_at,
        p.is_preorder AS is_pre_order,
        NULL::date    AS release_date,
        pc.id   AS pc_id,
        pc.name AS pc_name,
        pc.slug AS pc_slug,
        pc.description AS pc_description
      ${sql.unsafe(PRODUCT_JOIN_SQL)}
      WHERE p.is_active = true AND p.is_preorder = true
      ORDER BY p.created_at DESC
      LIMIT 8
    ` as DbProductJoined[]

    if (rows.length > 0) {
      return rows.map(mapJoinedRowToProduct)
    }
  } catch {
    // Neither column exists — no pre-orders configured in this DB
  }

  // No pre-order data at all — homepage hides the section automatically (preOrderProducts.length === 0)
  return []
}

/**
 * Fetch related products in the same category (excluding given product ID).
 * Uses category_id FK when available; falls back to category string match.
 */
export async function getRelatedProducts(productId: number): Promise<Product[]> {
  try {
    const sql = getSqlConnection()
    if (!sql) return []

    // Resolve the category for the current product
    const [current] = await sql`
      SELECT category, category_id FROM products WHERE id = ${productId}
    ` as { category: string; category_id: number | null }[]

    if (!current) return []

    const rows = await sql`
      SELECT
        p.id, p.name, p.category, p.category_id, p.price, p.original_price,
        p.stock_quantity, p.is_active, p.created_at,
        p.is_pre_order, p.release_date,
        pc.id   AS pc_id,
        pc.name AS pc_name,
        pc.slug AS pc_slug,
        pc.description AS pc_description
      ${sql.unsafe(PRODUCT_JOIN_SQL)}
      WHERE p.is_active = true
        AND p.id != ${productId}
        AND (
          ${current.category_id !== null ? sql`p.category_id = ${current.category_id}` : sql`p.category = ${current.category}`}
        )
      ORDER BY p.created_at DESC
      LIMIT 4
    ` as DbProductJoined[]

    return rows.map(mapJoinedRowToProduct)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[products] Error fetching related products:", error)
    }
    return []
  }
}

/**
 * Fetch related products by product slug.
 */
export async function getRelatedProductsBySlug(slug: string): Promise<Product[]> {
  const currentProduct = await getProductBySlug(slug)
  if (!currentProduct) return []
  return getRelatedProducts(currentProduct.id)
}

/**
 * Full-text search across product name and category.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const sql = getSqlConnection()
    if (!sql) return []

    const searchPattern = `%${query}%`

    const rows = await sql`
      SELECT
        p.id, p.name, p.category, p.category_id, p.price, p.original_price,
        p.stock_quantity, p.is_active, p.created_at,
        p.is_pre_order, p.release_date,
        pc.id   AS pc_id,
        pc.name AS pc_name,
        pc.slug AS pc_slug,
        pc.description AS pc_description
      ${sql.unsafe(PRODUCT_JOIN_SQL)}
      WHERE p.is_active = true
        AND (
          p.name     ILIKE ${searchPattern}
          OR p.category ILIKE ${searchPattern}
          OR pc.name    ILIKE ${searchPattern}
        )
      ORDER BY p.created_at DESC
    ` as DbProductJoined[]

    return rows.map(mapJoinedRowToProduct)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[products] Error searching products:", error)
    }
    return []
  }
}

/**
 * Return all unique category names (for filter UI dropdowns).
 * Prefers product_categories table; falls back to raw column.
 */
export async function getProductCategories(): Promise<string[]> {
  try {
    const sql = getSqlConnection()
    if (!sql) return []

    // Prefer authoritative categories table
    const catRows = await sql`
      SELECT name FROM product_categories WHERE is_active = true ORDER BY display_order, name
    ` as { name: string }[]

    if (catRows.length > 0) return catRows.map((r) => r.name)

    // Fallback: derive from products table
    const rows = await sql`
      SELECT DISTINCT category FROM products WHERE is_active = true ORDER BY category
    ` as { category: string }[]

    return rows.map((r) => r.category)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[products] Error fetching categories:", error)
    }
    return []
  }
}

// ============================================================
// Sync cache (for Client Components that need sync access)
// ============================================================

let _productCache: Map<number, Product> | null = null

export function getProductByIdSync(id: number): Product | undefined {
  return _productCache?.get(id)
}

/**
 * Preload the in-memory product cache.
 * Call from Server Components before rendering a Client Component
 * that needs sync product access.
 */
export async function preloadProductCache(ids?: number[]): Promise<void> {
  if (_productCache) return

  const products = ids
    ? await Promise.all(ids.map((id) => getProductById(id)))
    : await getAllProducts()

  const validProducts = products.filter((p): p is Product => p !== undefined)
  _productCache = new Map(validProducts.map((p) => [p.id, p]))
}
