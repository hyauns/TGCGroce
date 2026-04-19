import { neon } from "@neondatabase/serverless";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  
  console.log("Starting DB update...");
  
  // Update query
  const result = await sql`
    UPDATE products
    SET 
      product_type = CASE WHEN product_type IS NULL OR product_type = '' THEN 'Cards' ELSE product_type END,
      stock_quantity = CASE WHEN stock_quantity = 0 THEN floor(random() * 201 + 100)::INT ELSE stock_quantity END,
      updated_at = NOW()
    WHERE category = 'Magic: The Gathering' 
      AND (
        (product_type IS NULL OR product_type = '') 
        OR stock_quantity = 0
      )
    RETURNING id, name, product_type, stock_quantity;
  `;
  
  console.log(`Updated ${result.length} products.`);
  if (result.length > 0) {
      console.log("Sample of updated records (up to 5):", result.slice(0, 5));
  }
}

run().catch(console.error);
