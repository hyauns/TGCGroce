/**
 * Diagnostic script: Audit product landing pages for broken PDP URLs.
 *
 * Checks:
 * 1. Duplicate slugs (multiple products map to the same URL)
 * 2. Bad slug patterns (empty, trailing dots, spaces, etc.)
 * 3. Products visible in feeds but whose PDP would 404
 *
 * Usage: npx tsx scripts/audit-product-landing-pages.ts
 *
 * This script is READ-ONLY — it never modifies data.
 */

import postgres from "postgres"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is required")
  process.exit(1)
}

const sql = postgres(url, { prepare: false, max: 1, idle_timeout: 10 })

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .replace(/^-+|-+$/g, "")
}

async function main() {
  console.log("=== Product Landing Page Audit ===\n")

  // 1. Load all active products
  const rows = await sql`
    SELECT id, name, is_active, stock_quantity, is_pre_order, image_url, category
    FROM products
    WHERE is_active = true
    ORDER BY id
  `

  console.log(`Total active products: ${rows.length}\n`)

  // 2. Generate slugs and detect duplicates
  const slugMap = new Map<string, { id: number; name: string }[]>()
  const badSlugs: { id: number; name: string; slug: string; reason: string }[] = []

  for (const row of rows) {
    const slug = generateSlug(row.name)

    // Check bad patterns
    if (!slug || slug.length === 0) {
      badSlugs.push({ id: row.id, name: row.name, slug, reason: "EMPTY_SLUG" })
    }
    if (slug.includes("..")) {
      badSlugs.push({ id: row.id, name: row.name, slug, reason: "DOUBLE_DOT" })
    }
    if (slug.endsWith(".") || slug.endsWith("-")) {
      badSlugs.push({ id: row.id, name: row.name, slug, reason: "TRAILING_PUNCT" })
    }
    if (slug !== slug.toLowerCase()) {
      badSlugs.push({ id: row.id, name: row.name, slug, reason: "UPPERCASE" })
    }
    if (slug.includes(" ")) {
      badSlugs.push({ id: row.id, name: row.name, slug, reason: "CONTAINS_SPACE" })
    }

    if (!slugMap.has(slug)) {
      slugMap.set(slug, [])
    }
    slugMap.get(slug)!.push({ id: row.id, name: row.name })
  }

  // 3. Report duplicate slugs
  const duplicates = [...slugMap.entries()].filter(([, products]) => products.length > 1)

  console.log(`--- Duplicate Slugs (${duplicates.length} groups) ---`)
  if (duplicates.length === 0) {
    console.log("None found.\n")
  } else {
    for (const [slug, products] of duplicates) {
      console.log(`\nSlug: /products/${slug}`)
      console.log(`  URL would resolve to: product id=${products[0].id} (first match by Array.find)`)
      console.log(`  Products sharing this slug:`)
      for (const p of products) {
        console.log(`    - id=${p.id}: "${p.name}"`)
      }
    }
    console.log()
  }

  // 4. Report bad slugs
  console.log(`--- Bad Slug Patterns (${badSlugs.length}) ---`)
  if (badSlugs.length === 0) {
    console.log("None found.\n")
  } else {
    for (const b of badSlugs) {
      console.log(`  id=${b.id}: slug="${b.slug}" reason=${b.reason} name="${b.name}"`)
    }
    console.log()
  }

  // 5. Check the specific example
  const exampleSlug = "battles-of-legend-glorious-gallery-booster-pack-1st-edition"
  const exampleMatch = [...slugMap.entries()].find(([slug]) => slug === exampleSlug)
  console.log(`--- Example Product Investigation ---`)
  console.log(`Looking for slug: ${exampleSlug}`)
  if (exampleMatch) {
    console.log(`  Found! Product(s):`)
    for (const p of exampleMatch[1]) {
      console.log(`    - id=${p.id}: "${p.name}"`)
    }
  } else {
    console.log(`  NOT FOUND in slug map. This would 404.`)
    // Search for partial match
    const partial = [...slugMap.entries()].filter(([slug]) =>
      slug.includes("battles-of-legend-glorious-gallery")
    )
    if (partial.length > 0) {
      console.log(`  Partial matches:`)
      for (const [slug, products] of partial) {
        console.log(`    slug="${slug}"`)
        for (const p of products) {
          console.log(`      - id=${p.id}: "${p.name}"`)
        }
      }
    }

    // Also search by name pattern in DB
    const nameSearch = await sql`
      SELECT id, name, is_active, stock_quantity
      FROM products
      WHERE name ILIKE ${"%" + "Battles of Legend" + "%" + "Glorious Gallery" + "%"}
      ORDER BY id
    `
    if (nameSearch.length > 0) {
      console.log(`  DB name search results:`)
      for (const r of nameSearch) {
        const s = generateSlug(r.name)
        console.log(`    id=${r.id}: "${r.name}" → slug="${s}" active=${r.is_active} stock=${r.stock_quantity}`)
      }
    }
  }
  console.log()

  // 6. Summary
  const totalSlugs = slugMap.size
  const duplicateProducts = duplicates.reduce((acc, [, p]) => acc + p.length, 0)
  const affectedUrls = duplicates.length

  console.log(`=== Summary ===`)
  console.log(`Active products: ${rows.length}`)
  console.log(`Unique slugs: ${totalSlugs}`)
  console.log(`Duplicate slug groups: ${affectedUrls}`)
  console.log(`Products with duplicate slug (would 404 for some): ${duplicateProducts}`)
  console.log(`Bad slug patterns: ${badSlugs.length}`)
  console.log(`Products that would resolve correctly: ${rows.length - duplicateProducts + affectedUrls}`)
  console.log(`Products that COULD 404 (duplicate slug, not first match): ${duplicateProducts - affectedUrls}`)

  await sql.end()
}

main().catch((e) => {
  console.error("Script failed:", e)
  process.exit(1)
})
