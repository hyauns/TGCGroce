import postgres from "postgres"
const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1, idle_timeout: 10 })

async function main() {
  // Check if slug column exists
  const cols = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'products' AND column_name IN ('slug', 'name')
    ORDER BY ordinal_position
  `
  console.log("Columns:", JSON.stringify(cols))

  // Check slug stats
  const stats = await sql`
    SELECT 
      COUNT(*) as total,
      COUNT(slug) as has_slug,
      COUNT(*) - COUNT(slug) as missing_slug,
      COUNT(CASE WHEN slug = '' THEN 1 END) as empty_slug
    FROM products
    WHERE is_active = true
  `
  console.log("Slug stats:", JSON.stringify(stats))

  // Check the example product
  const example = await sql`
    SELECT id, name, slug, is_active, stock_quantity
    FROM products
    WHERE name ILIKE ${"%" + "Glorious Gallery" + "%"}
    LIMIT 5
  `
  console.log("Example products:", JSON.stringify(example))

  // Check slug vs generated slug mismatch
  const mismatches = await sql`
    SELECT id, name, slug,
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              LOWER(TRIM(name)),
              '[^a-z0-9 -]', '', 'g'
            ),
            '\s+', '-', 'g'
          ),
          '-+', '-', 'g'
        ),
        '^-+|-+$', '', 'g'
      ) AS generated_slug
    FROM products
    WHERE is_active = true
      AND slug IS NOT NULL
      AND slug != ''
      AND slug != regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              LOWER(TRIM(name)),
              '[^a-z0-9 -]', '', 'g'
            ),
            '\s+', '-', 'g'
          ),
          '-+', '-', 'g'
        ),
        '^-+|-+$', '', 'g'
      )
    LIMIT 20
  `
  console.log("\nSlug vs generated_slug mismatches:", mismatches.length)
  for (const r of mismatches) {
    console.log(`  id=${r.id}: db_slug="${r.slug}" generated="${r.generated_slug}" name="${r.name}"`)
  }

  await sql.end()
}

main().catch(e => { console.error(e); process.exit(1) })
