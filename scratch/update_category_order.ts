import { neon } from "@neondatabase/serverless";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  
  await sql`UPDATE product_categories SET display_order = 1 WHERE name ILIKE '%Magic%'`;
  await sql`UPDATE product_categories SET display_order = 2 WHERE name ILIKE '%Yu-Gi-Oh!%'`;
  await sql`UPDATE product_categories SET display_order = 3 WHERE name ILIKE '%Pokemon%'`;
  await sql`UPDATE product_categories SET display_order = 4 WHERE name ILIKE '%Disney Lorcana%'`;
  await sql`UPDATE product_categories SET display_order = 5 WHERE name ILIKE '%One Piece%'`;
  await sql`UPDATE product_categories SET display_order = 6 WHERE name ILIKE '%Digimon%'`;
  await sql`UPDATE product_categories SET display_order = 7 WHERE name ILIKE '%Star Wars: Unlimited%'`;
  await sql`UPDATE product_categories SET display_order = 8 WHERE name ILIKE '%Flesh and Blood%'`;

  console.log("Categories order updated");
}

run().catch(console.error);
