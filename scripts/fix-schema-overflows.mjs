/**
 * Fix all VARCHAR columns that are too narrow for the data being inserted.
 *
 * Known overflows identified from schema audit:
 *   - shipping_addresses.phone   VARCHAR(20)  → encrypted JSON blob is 200+ chars
 *   - payment_methods.brand      VARCHAR(20)  → fine now, safetymargin to 50
 *   - payment_transactions.status VARCHAR(20) → 'succeeded' = 9 chars, fine; widen anyway
 *
 * Run once against the target DB:
 *   node scripts/fix-schema-overflows.mjs
 */

import { Pool } from '@neondatabase/serverless'
import { config } from 'dotenv'

config({ path: '.env.local' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const migrations = [
  // shipping_addresses.phone stores an *encrypted* JSON blob (AES-256-GCM),
  // not a plain phone number. The JSON ciphertext is 200-300 chars.
  // VARCHAR(20) truncates it → must be TEXT or at least VARCHAR(512).
  {
    sql: `ALTER TABLE shipping_addresses ALTER COLUMN phone TYPE TEXT`,
    description: 'shipping_addresses.phone VARCHAR(20) → TEXT (stores encrypted JSON)'
  },
  // billing_addresses.postal_code — ZIP+4 format "NNNNN-NNNN" = 10 chars, fine at 20.
  // Widen state to 50 for safety (some full state names come through).
  {
    sql: `ALTER TABLE billing_addresses ALTER COLUMN state TYPE VARCHAR(50)`,
    description: 'billing_addresses.state VARCHAR(10) → VARCHAR(50)'
  },
  {
    sql: `ALTER TABLE shipping_addresses ALTER COLUMN state TYPE VARCHAR(50)`,
    description: 'shipping_addresses.state VARCHAR(10) → VARCHAR(50)'
  },
  // payment_methods.brand — "discover" is 8 chars, fine. Widen for safety.
  {
    sql: `ALTER TABLE payment_methods ALTER COLUMN brand TYPE VARCHAR(50)`,
    description: 'payment_methods.brand VARCHAR(20) → VARCHAR(50)'
  },
  // payment_transactions.status — 'succeeded' = 9 chars. Under the limit but widen for clarity.
  {
    sql: `ALTER TABLE payment_transactions ALTER COLUMN status TYPE VARCHAR(50)`,
    description: 'payment_transactions.status VARCHAR(20) → VARCHAR(50)'
  },
]

let passed = 0
let failed = 0

for (const { sql, description } of migrations) {
  try {
    await pool.query(sql)
    console.log(`✅  ${description}`)
    passed++
  } catch (err) {
    console.error(`❌  FAILED — ${description}`)
    console.error(`    ${err.message}`)
    failed++
  }
}

await pool.end()
console.log(`\n📊  Done: ${passed} passed, ${failed} failed.`)
