import postgres from "postgres"
const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1, idle_timeout: 10 })

async function main() {
  const testSlug = "battles-of-legend-glorious-gallery-booster-pack-1st-edition"
  
  console.log(`Testing PDP lookup for slug: ${testSlug}`)
  
  const t0 = performance.now()
  const rows = await sql`
    SELECT p.id, p.name, p.slug, p.is_active, p.stock_quantity, p.price
    FROM products p
    WHERE p.is_active = true AND p.slug = ${testSlug}
    LIMIT 1
  `
  const t1 = performance.now()
  
  if (rows.length > 0) {
    console.log(`✅ Found in ${Math.round(t1-t0)}ms:`)
    console.log(`   id=${rows[0].id} name="${rows[0].name}" price=${rows[0].price} stock=${rows[0].stock_quantity}`)
  } else {
    console.log(`❌ NOT FOUND (would 404)`)
  }

  // Compare: old approach timing (load ALL products)
  const t2 = performance.now()
  const allRows = await sql`SELECT p.name FROM products p WHERE p.is_active = true`
  const t3 = performance.now()
  console.log(`\nOld approach (load all): ${allRows.length} rows in ${Math.round(t3-t2)}ms`)
  console.log(`New approach (slug lookup): 1 row in ${Math.round(t1-t0)}ms`)
  console.log(`Speedup: ${Math.round((t3-t2)/(t1-t0))}x`)

  // Check index existence on slug column
  const indexes = await sql`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'products' AND indexdef ILIKE '%slug%'
  `
  if (indexes.length > 0) {
    console.log(`\n✅ Slug index exists:`)
    for (const idx of indexes) {
      console.log(`   ${idx.indexname}: ${idx.indexdef}`)
    }
  } else {
    console.log(`\n⚠️ No index on slug column — recommend adding:`)
    console.log(`   CREATE INDEX CONCURRENTLY idx_products_slug ON products (slug) WHERE is_active = true;`)
  }

  await sql.end()
}

main().catch(e => { console.error(e); process.exit(1) })
