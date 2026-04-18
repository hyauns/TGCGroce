import { Pool } from '@neondatabase/serverless'
import { config } from 'dotenv'

config({ path: '.env.local' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

try {
  await pool.query('ALTER TABLE orders ALTER COLUMN order_number TYPE VARCHAR(50)')
  console.log('✅  order_number column widened to VARCHAR(50)')

  // Also check and widen any related index columns if they exist
  const res = await pool.query(`
    SELECT column_name, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_number'
  `)
  console.log('Column info after migration:', res.rows[0])
} catch (err) {
  console.error('❌  Migration failed:', err.message)
} finally {
  await pool.end()
}
