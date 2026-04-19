import { neon } from "@neondatabase/serverless";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`UPDATE products SET rarity = 'Rare' WHERE slug = 'thirst-for-knowledge'`;
  await sql`UPDATE products SET rarity = 'Mythic' WHERE slug = 'lorcana-the-first-chapter-booster-box'`;
  console.log("Updated specific products.");
}

run().catch(console.error);
