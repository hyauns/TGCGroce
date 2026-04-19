import { neon } from "@neondatabase/serverless";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  
  console.log("Adding rarity column to products table...");
  
  try {
      await sql`ALTER TABLE products ADD COLUMN rarity VARCHAR(50);`;
      console.log("Successfully added rarity column.");
      
      // Let's set some random rarity values for testing just to see UI
      console.log("Setting a few dummy rarities for testing...");
      await sql`UPDATE products SET rarity = 'Mythic' WHERE id IN (SELECT id FROM products LIMIT 5)`;
      await sql`UPDATE products SET rarity = 'Rare' WHERE id IN (SELECT id FROM products OFFSET 5 LIMIT 10)`;
      await sql`UPDATE products SET rarity = 'Uncommon' WHERE id IN (SELECT id FROM products OFFSET 15 LIMIT 15)`;
      console.log("Dummy data injected.");

  } catch (e: any) {
      if (e.message && e.message.includes('already exists')) {
          console.log("Column rarity already exists.");
      } else {
          console.error(e);
      }
  }
}

run().catch(console.error);
