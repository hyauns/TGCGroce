import { neon } from "@neondatabase/serverless";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
  
  // Create an index to make fuzzy searching fast
  await sql`
    CREATE INDEX IF NOT EXISTS product_name_trgm_idx 
    ON products USING gin (name gin_trgm_ops);
  `;
  console.log("Enabled pg_trgm and created GIN index successfully.");
}

run().catch(console.error);
