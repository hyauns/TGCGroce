import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const result = await sql`
    SELECT category, COUNT(*) as count 
    FROM products 
    WHERE is_active = true 
    GROUP BY category
  `;
  console.log('Categories in products table:');
  console.log(result);
  
  // Let's also check if the product_categories table has yu-gi-oh
  const productCategories = await sql`
    SELECT * FROM product_categories
  `;
  console.log('product_categories table:');
  console.log(productCategories);
}

run();
