/**
 * Full column audit for checkout-related tables.
 * Shows ALL columns (not just varchar) to catch type mismatches on FK columns.
 */
import { Pool } from '@neondatabase/serverless'
import { config } from 'dotenv'

config({ path: '.env.local' })
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

try {
  const res = await pool.query(`
    SELECT table_name, column_name, data_type,
           character_maximum_length, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('orders','order_items','payment_methods','payment_transactions',
                         'billing_addresses','shipping_addresses','customers')
    ORDER BY table_name, ordinal_position
  `)

  // Group by table
  const grouped = {}
  for (const row of res.rows) {
    if (!grouped[row.table_name]) grouped[row.table_name] = []
    grouped[row.table_name].push({
      column: row.column_name,
      type: row.data_type + (row.character_maximum_length ? `(${row.character_maximum_length})` : ''),
      nullable: row.is_nullable,
    })
  }

  for (const [table, cols] of Object.entries(grouped)) {
    console.log(`\n── ${table} ──`)
    console.table(cols)
  }
} catch (err) {
  console.error('Error:', err.message)
} finally {
  await pool.end()
}
