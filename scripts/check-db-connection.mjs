import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load .env.local first (higher priority), then .env
config({ path: '.env.local' });
config({ path: '.env' });

const url = process.env.DATABASE_URL;
console.log('DATABASE_URL connects to:', url?.replace(/npg_[^@]+/, 'npg_***'));

const sql = neon(url);

try {
  const countResult = await sql`SELECT COUNT(*) AS cnt FROM products WHERE is_active = true`;
  console.log('\n=== Products in connected database ===');
  console.log('Active products:', countResult[0].cnt);

  const sampleResult = await sql`SELECT id, name, category FROM products WHERE is_active = true ORDER BY id LIMIT 5`;
  console.log('\nFirst 5 products:');
  for (const row of sampleResult) {
    console.log(`  [${row.id}] ${row.name} (${row.category})`);
  }

  const lastResult = await sql`SELECT id, name, category FROM products WHERE is_active = true ORDER BY id DESC LIMIT 3`;
  console.log('\nLast 3 products:');
  for (const row of lastResult) {
    console.log(`  [${row.id}] ${row.name} (${row.category})`);
  }
} catch (err) {
  console.error('Query error:', err.message);
}
