import { neon } from "@neondatabase/serverless";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const [products, categories] = await Promise.all([
    sql`SELECT DISTINCT category FROM products`,
    sql`SELECT id, name, slug FROM product_categories`
  ]);
  console.log('Products:', products);
  console.log('Categories:', categories);
}

run().catch(console.error);
