import { neon } from "@neondatabase/serverless";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const categories = await sql`SELECT id, name, display_order, is_active FROM product_categories ORDER BY display_order ASC;`;
  console.log(JSON.stringify(categories, null, 2));
}

run().catch(console.error);
