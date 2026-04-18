import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load env
config({ path: '.env.local' });
config({ path: '.env' });

const url = process.env.DATABASE_URL;
const sql = neon(url);

const today = new Date('2026-04-17T00:00:00Z');

async function run() {
  try {
    // 1. Total products
    const totalResult = await sql`SELECT COUNT(*) AS count FROM products WHERE is_active = true`;
    const totalProducts = totalResult[0].count;

    // 2. Products with price $0
    const zeroPriceResult = await sql`SELECT COUNT(*) AS count FROM products WHERE is_active = true AND price = 0`;
    const zeroPriceProducts = zeroPriceResult[0].count;

    // 3. Preorder products with release date < today
    // Depending on what column we use for preorder: is_pre_order boolean column or condition = 'pre-order'
    // Let's check using both or simply the new is_pre_order column since it was added.
    const preorderPastResult = await sql`
      SELECT COUNT(*) AS count 
      FROM products 
      WHERE is_active = true 
        AND is_pre_order = true 
        AND release_date < ${today.toISOString()}
    `;
    const preorderPastProducts = preorderPastResult[0].count;

    console.log('--- DATABASE STATS ---');
    console.log(`1. Total active products: ${totalProducts}`);
    console.log(`2. Products with price $0: ${zeroPriceProducts}`);
    console.log(`3. Pre-order products with release date before 04/17/2026: ${preorderPastProducts}`);

    // Let's also fetch a sample of those $0 / pre-order issues if any exist
    if (zeroPriceProducts > 0) {
      const sampleZero = await sql`SELECT id, name, price FROM products WHERE is_active = true AND price = 0 LIMIT 5`;
      console.log('\nSample of $0 products:');
      sampleZero.forEach(p => console.log(`  - [ID: ${p.id}] ${p.name}`));
    }

    if (preorderPastProducts > 0) {
      const samplePreorder = await sql`
        SELECT id, name, release_date 
        FROM products 
        WHERE is_active = true AND is_pre_order = true AND release_date < ${today.toISOString()} 
        LIMIT 5
      `;
      console.log('\nSample of outdated pre-orders:');
      samplePreorder.forEach(p => console.log(`  - [ID: ${p.id}] ${p.name} (Release Date: ${p.release_date})`));
    }

  } catch (e) {
    console.error('Error running script:', e.message);
  }
}

run();
