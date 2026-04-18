import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('No DATABASE_URL found');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    // Check if stock_quantity column exists
    const colCheck = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'stock_quantity'
    `;

    if (colCheck.length === 0) {
      console.log('Adding stock_quantity column...');
      await sql`ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 0`;
      console.log('Column stock_quantity added successfully.');
    } else {
      console.log('Column stock_quantity already exists.');
    }

    // Count total products before update
    const countBefore = await sql`SELECT count(*) as total FROM products`;
    console.log(`Total products: ${countBefore[0].total}`);

    // Update all products with random stock_quantity between 100 and 300
    // Using floor(random() * 201 + 100) to get range [100, 300]
    await sql`
      UPDATE products 
      SET stock_quantity = floor(random() * 201 + 100)::int
    `;

    // Count total products after update (should be same)
    const countAfter = await sql`SELECT count(*) as total FROM products`;
    console.log(`Total products after update: ${countAfter[0].total} (no deletions)`);

    // Show sample
    const sample = await sql`
      SELECT id, name, stock_quantity 
      FROM products 
      ORDER BY random() 
      LIMIT 10
    `;
    console.log('\nSample products with new stock_quantity:');
    console.table(sample);

    // Show min/max/avg
    const stats = await sql`
      SELECT 
        min(stock_quantity) as min_stock, 
        max(stock_quantity) as max_stock, 
        round(avg(stock_quantity)) as avg_stock
      FROM products
    `;
    console.log('\nStock statistics:');
    console.table(stats);

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
