/**
 * Fix payment_methods.brand column that is used by a view.
 * Must drop the view(s) first, alter the column, then recreate the view(s).
 */

import { Pool } from '@neondatabase/serverless'
import { config } from 'dotenv'

config({ path: '.env.local' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

try {
  // 1. Find all views that depend on payment_methods.brand
  const viewsRes = await pool.query(`
    SELECT DISTINCT v.table_name AS view_name,
           v.view_definition
    FROM information_schema.views v
    WHERE v.view_definition ILIKE '%payment_methods%'
      AND v.table_schema = 'public'
  `)

  console.log(`Found ${viewsRes.rows.length} dependent view(s):`)
  viewsRes.rows.forEach(r => console.log(` - ${r.view_name}`))

  // 2. Drop each dependent view (CASCADE)
  for (const { view_name } of viewsRes.rows) {
    await pool.query(`DROP VIEW IF EXISTS "${view_name}" CASCADE`)
    console.log(`✅  Dropped view: ${view_name}`)
  }

  // 3. Alter the column
  await pool.query(`ALTER TABLE payment_methods ALTER COLUMN brand TYPE VARCHAR(50)`)
  console.log('✅  payment_methods.brand VARCHAR(20) → VARCHAR(50)')

  // 4. Recreate the views
  for (const { view_name, view_definition } of viewsRes.rows) {
    try {
      await pool.query(`CREATE OR REPLACE VIEW "${view_name}" AS ${view_definition}`)
      console.log(`✅  Recreated view: ${view_name}`)
    } catch (viewErr) {
      console.error(`⚠️  Could not auto-recreate view ${view_name}: ${viewErr.message}`)
      console.error('   You may need to recreate it manually.')
    }
  }

  console.log('\n✅  All done.')
} catch (err) {
  console.error('❌  Migration failed:', err.message)
} finally {
  await pool.end()
}
