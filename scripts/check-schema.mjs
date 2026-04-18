import { Pool } from '@neondatabase/serverless'
import { config } from 'dotenv'

config({ path: '.env.local' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

try {
  // Show all varchar/char columns in the orders-related tables
  const res = await pool.query(`
    SELECT table_name, column_name, data_type, character_maximum_length, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('orders', 'order_items', 'payment_methods', 'payment_transactions', 'billing_addresses', 'shipping_addresses', 'customers')
      AND (data_type LIKE '%char%' OR data_type = 'text')
    ORDER BY table_name, column_name
  `)
  console.log('\n📋  VARCHAR/TEXT columns in order-related tables:\n')
  console.table(res.rows)
} catch (err) {
  console.error('❌  Query failed:', err.message)
} finally {
  await pool.end()
}
